from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import ServiceRequest, Quotation, Booking, BookingEvent, Complaint, Notification
from .serializers import (
    ServiceRequestSerializer, QuotationSerializer,
    BookingSerializer, ComplaintSerializer, NotificationSerializer
)
from matching.matcher import find_backup_providers, find_matching_providers

class RequestListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_farmer():
            # Farmer sees their own requests
            requests = ServiceRequest.objects.filter(farmer=user).order_by('-created_at')
        elif user.is_worker():
            # Workers see open labour requests in their district/state
            requests = ServiceRequest.objects.filter(
                category__slug='labour',
                status='open'
            ).order_by('-created_at')
        elif user.is_provider():
            # Providers see open requests for categories they provide
            categories_offered = []
            if hasattr(user, 'provider_profile') and user.provider_profile.service_categories:
                categories_offered = [c.strip().lower() for c in user.provider_profile.service_categories.split(',')]
            
            # Also check ProviderService table
            from_services = list(user.services.filter(is_active=True).values_list('category__slug', flat=True))
            all_slugs = list(set(categories_offered + from_services))

            if all_slugs:
                requests = ServiceRequest.objects.filter(
                    category__slug__in=all_slugs,
                    status='open'
                ).order_by('-created_at')
            else:
                requests = ServiceRequest.objects.filter(status='open').order_by('-created_at')
        else:
            requests = ServiceRequest.objects.all().order_by('-created_at')

        serializer = ServiceRequestSerializer(requests, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_farmer() and not request.user.is_superuser:
            return Response({'error': 'Only registered farmers can create service requests.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ServiceRequestSerializer(data=request.data)
        if serializer.is_valid():
            req_obj = serializer.save(farmer=request.user)

            # If linked to a FarmProject, attach ProjectService
            project_id = request.data.get('farm_project')
            if project_id:
                from farm_projects.models import FarmProject, ProjectService
                try:
                    proj = FarmProject.objects.get(id=project_id, farmer=request.user)
                    req_obj.farm_project = proj
                    req_obj.save()
                    ProjectService.objects.create(
                        project=proj,
                        category=req_obj.category,
                        service_request=req_obj,
                        scope_description=req_obj.scope_quantity,
                        target_date=req_obj.required_date
                    )
                    proj.update_project_status()
                except FarmProject.DoesNotExist:
                    pass

            return Response(ServiceRequestSerializer(req_obj).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RequestDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer


class RequestCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        req_obj = get_object_or_404(ServiceRequest, pk=pk)
        if req_obj.farmer != request.user and not request.user.is_superuser:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        if req_obj.status in ['booked', 'completed']:
            return Response({'error': 'Cannot directly cancel a request with a confirmed or completed booking. Cancel the booking instead.'}, status=status.HTTP_400_BAD_REQUEST)

        req_obj.status = 'cancelled'
        req_obj.save()

        # Reject pending quotations
        req_obj.quotations.filter(status='pending').update(status='rejected')

        return Response({'message': 'Service request cancelled successfully.', 'status': 'cancelled'})


class QuotationCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if not (user.is_worker() or user.is_provider() or user.is_superuser):
            return Response({'error': 'Only providers and workers can submit quotations.'}, status=status.HTTP_403_FORBIDDEN)

        request_id = request.data.get('request')
        service_req = get_object_or_404(ServiceRequest, pk=request_id)

        if service_req.status != 'open':
            return Response({'error': 'This service request is no longer accepting quotations.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check existing quote by this provider
        existing = Quotation.objects.filter(request=service_req, provider=user).first()
        if existing:
            return Response({'error': 'You have already submitted a quotation for this request.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = QuotationSerializer(data=request.data)
        if serializer.is_valid():
            quote = serializer.save(provider=user)

            # Notify farmer
            Notification.objects.create(
                recipient=service_req.farmer,
                title="New Quotation Received!",
                message=f"{user.get_full_name() or user.username} submitted a quote of ₹{quote.quote_amount} for '{service_req.title}'.",
                link_url=f"/farmer/requests/{service_req.id}"
            )

            return Response(QuotationSerializer(quote).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuotationAcceptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        quote = get_object_or_404(Quotation, pk=pk)
        service_req = quote.request

        if service_req.farmer != request.user and not request.user.is_superuser:
            return Response({'error': 'Only the request owner can accept quotations.'}, status=status.HTTP_403_FORBIDDEN)

        if service_req.status != 'open':
            return Response({'error': f'Request cannot accept quotation in status {service_req.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            quote.status = 'accepted'
            quote.save()

            # Mark other quotes for this request as rejected
            service_req.quotations.exclude(id=quote.id).update(status='rejected')

            service_req.status = 'quote_accepted'
            service_req.save()

            # Create Booking in pending_confirmation state
            # A farmer must not be able to confirm a provider's booking without the provider's agreement!
            booking = Booking.objects.create(
                request=service_req,
                quotation=quote,
                farmer=service_req.farmer,
                provider=quote.provider,
                agreed_amount=quote.quote_amount,
                scheduled_date=quote.proposed_schedule,
                status='pending_confirmation'
            )

            BookingEvent.objects.create(
                booking=booking,
                actor=request.user,
                action='Quotation Selected',
                from_status='',
                to_status='pending_confirmation',
                notes=f"Farmer accepted quote of ₹{quote.quote_amount}. Awaiting provider confirmation."
            )

            # Notify provider to confirm availability
            Notification.objects.create(
                recipient=quote.provider,
                title="Action Required: Quotation Accepted!",
                message=f"Farmer {request.user.get_full_name() or request.user.username} accepted your quote for '{service_req.title}'. Please confirm your booking availability.",
                link_url="/provider/bookings"
            )

            return Response({
                'message': 'Quotation accepted. Booking created in pending confirmation state.',
                'booking': BookingSerializer(booking).data
            })


class BookingListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_farmer():
            bookings = Booking.objects.filter(farmer=user).order_by('-created_at')
        elif user.is_worker() or user.is_provider():
            bookings = Booking.objects.filter(provider=user).order_by('-created_at')
        else:
            bookings = Booking.objects.all().order_by('-created_at')

        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)


class BookingDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer


class BookingConfirmView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        try:
            confirmed_booking = booking.confirm_by_provider(request.user)
            return Response({
                'message': 'Booking confirmed successfully!',
                'booking': BookingSerializer(confirmed_booking).data
            })
        except ValidationError as e:
            return Response({'error': str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)


class BookingStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')

        valid_transitions = {
            'confirmed': ['scheduled', 'in_progress', 'cancelled_by_farmer', 'cancelled_by_provider'],
            'scheduled': ['in_progress', 'completed', 'cancelled_by_farmer', 'cancelled_by_provider'],
            'in_progress': ['completed'],
        }

        if new_status not in valid_transitions.get(booking.status, []):
            return Response({'error': f"Invalid status transition from '{booking.status}' to '{new_status}'."}, status=status.HTTP_400_BAD_REQUEST)

        from_status = booking.status
        booking.status = new_status
        if new_status == 'completed':
            booking.completed_at = timezone.now()
            booking.request.status = 'completed'
            booking.request.save()

            # Increment provider/worker completed count
            if hasattr(booking.provider, 'worker_profile'):
                booking.provider.worker_profile.completed_jobs_count += 1
                booking.provider.worker_profile.save()
            elif hasattr(booking.provider, 'provider_profile'):
                booking.provider.provider_profile.completed_bookings_count += 1
                booking.provider.provider_profile.save()

        booking.save()

        BookingEvent.objects.create(
            booking=booking,
            actor=request.user,
            action=f"Status changed to {new_status}",
            from_status=from_status,
            to_status=new_status,
            notes=notes
        )

        if booking.request.farm_project:
            booking.request.farm_project.update_project_status()

        return Response({
            'message': f"Booking status updated to '{new_status}'.",
            'booking': BookingSerializer(booking).data
        })


class BookingCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        reason = request.data.get('reason', 'Scheduling conflict or cancellation request')
        try:
            cancelled_booking = booking.cancel(request.user, reason=reason)
            return Response({
                'message': 'Booking cancelled successfully.',
                'booking': BookingSerializer(cancelled_booking).data
            })
        except ValidationError as e:
            return Response({'error': str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)


class BackupProvidersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        backups = find_backup_providers(booking)
        return Response({
            'booking_id': booking.id,
            'reference_id': booking.reference_id,
            'category': booking.request.category.name_en,
            'village': booking.request.village,
            'backup_providers': backups,
            'count': len(backups)
        })


class ComplaintListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_admin_role():
            complaints = Complaint.objects.all().order_by('-created_at')
        else:
            complaints = Complaint.objects.filter(reported_by=user).order_by('-created_at')
        serializer = ComplaintSerializer(complaints, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ComplaintSerializer(data=request.data)
        if serializer.is_valid():
            comp = serializer.save(reported_by=request.user)
            return Response(ComplaintSerializer(comp).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(recipient=request.user).order_by('-created_at')[:30]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Mark all as read
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})
