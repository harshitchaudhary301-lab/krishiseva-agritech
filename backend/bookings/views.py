import json
import hashlib
from decimal import Decimal
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import (
    ServiceRequest, Quotation, Booking, BookingEvent, Complaint,
    Notification, ResourceReservation, IdempotencyKey,
    AdditionalChargeRequest, PartialCompletionRecord
)
from .serializers import (
    ServiceRequestSerializer, QuotationSerializer,
    BookingSerializer, BookingEventSerializer, ComplaintSerializer,
    NotificationSerializer, AdditionalChargeRequestSerializer,
    PartialCompletionRecordSerializer, QuoteAcceptanceRequestSerializer
)
from matching.matcher import find_backup_providers

class RequestListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_farmer():
            requests = ServiceRequest.objects.filter(farmer=user).order_by('-created_at')
        elif user.is_worker():
            requests = ServiceRequest.objects.filter(
                category__slug='labour',
                status='open'
            ).order_by('-created_at')
        elif user.is_provider():
            categories_offered = []
            if hasattr(user, 'provider_profile') and user.provider_profile.service_categories:
                categories_offered = [c.strip().lower() for c in user.provider_profile.service_categories.split(',')]
            from_services = list(user.services.filter(is_active=True).values_list('category__slug', flat=True))
            all_slugs = list(set(categories_offered + from_services))

            if all_slugs:
                requests = ServiceRequest.objects.filter(
                    category__slug__in=all_slugs,
                    status='open'
                ).order_by('-created_at')
            else:
                requests = ServiceRequest.objects.filter(status='open').order_by('-created_at')
        elif user.is_admin_role():
            requests = ServiceRequest.objects.all().order_by('-created_at')
        else:
            requests = ServiceRequest.objects.none()

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


class RequestDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        service_req = get_object_or_404(ServiceRequest, pk=pk)
        user = request.user
        # Strict object-level permission
        if not (user.is_admin_role() or service_req.farmer == user or user.is_provider() or user.is_worker()):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(ServiceRequestSerializer(service_req).data)


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
    """
    BOOK-01: Multiple quotes can be submitted for a service request.
    BOOK-15: Suspended providers cannot submit quotations.
    Unverified providers cannot submit quotations.
    Server calculates total amount; client values cannot override server calculations.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if not (user.is_worker() or user.is_provider() or user.is_superuser):
            return Response({'error': 'Only providers and workers can submit quotations.'}, status=status.HTTP_403_FORBIDDEN)

        # Check verification & suspension (BOOK-15)
        if hasattr(user, 'provider_profile'):
            if user.provider_profile.is_suspended():
                return Response({'error': 'Suspended providers cannot submit quotations (BOOK-15).'}, status=status.HTTP_403_FORBIDDEN)
            if not user.provider_profile.is_verified() and not user.is_superuser:
                return Response({'error': 'Your provider profile is pending verification. Only verified providers can quote.'}, status=status.HTTP_403_FORBIDDEN)
        elif hasattr(user, 'worker_profile'):
            if user.worker_profile.is_suspended():
                return Response({'error': 'Suspended workers cannot submit quotations (BOOK-15).'}, status=status.HTTP_403_FORBIDDEN)
            if not user.worker_profile.is_verified() and not user.is_superuser:
                return Response({'error': 'Your worker profile is pending verification. Only verified workers can quote.'}, status=status.HTTP_403_FORBIDDEN)

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
            # Server derives quote_amount automatically via model calculate_total()
            quote = serializer.save(provider=user)

            Notification.send_unique(
                recipient=service_req.farmer,
                title="New Quotation Received!",
                message=f"{user.get_full_name() or user.username} submitted Quote v{quote.quotation_version} of ₹{quote.quote_amount} for '{service_req.title}'.",
                link_url=f"/farmer/requests/{service_req.id}"
            )

            return Response(QuotationSerializer(quote).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuotationAcceptView(APIView):
    """
    CRITICAL QUOTATION ACCEPTANCE CONTRACT:
    - BOOK-02: Only one active accepted booking may fulfil an individual service request.
    - BOOK-04: Validates current quotation version and expiry.
    - BOOK-05 & BOOK-07: Successful exclusive/shared resource reservation.
    - BOOK-06: Concurrency protection via select_for_update().
    - BOOK-09 & BOOK-10: Idempotency enforcement.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        idempotency_key = request.data.get('idempotency_key', '')
        expected_version = int(request.data.get('expected_version', 1))
        exclusive_res_id = request.data.get('exclusive_resource_id', '')

        # BOOK-09 & BOOK-10: Check Idempotency
        if idempotency_key:
            req_hash = hashlib.sha256(json.dumps(request.data, sort_keys=True, default=str).encode('utf-8')).hexdigest()
            cached = IdempotencyKey.objects.filter(key=idempotency_key).first()
            if cached:
                if cached.request_hash == req_hash:
                    # BOOK-09: Identical retried request returns existing result
                    return Response(cached.response_data, status=cached.response_status)
                else:
                    # BOOK-10: Reusing idempotency key with different content returns conflict
                    return Response({
                        'error': 'Conflict: Idempotency key reused with different request payload (BOOK-10).'
                    }, status=status.HTTP_409_CONFLICT)

        with transaction.atomic():
            quote = Quotation.objects.select_for_update().filter(pk=pk).first()
            if not quote:
                return Response({'error': 'Quotation not found.'}, status=status.HTTP_404_NOT_FOUND)

            service_req = ServiceRequest.objects.select_for_update().get(pk=quote.request_id)

            if service_req.farmer != user and not user.is_superuser:
                return Response({'error': 'Only the request owner can accept quotations.'}, status=status.HTTP_403_FORBIDDEN)

            # BOOK-02 & BOOK-06: Check that request is still open
            if service_req.status != 'open':
                return Response({
                    'error': f"Conflict: Service request is already in status '{service_req.status}'. Only one active booking may fulfil a request (BOOK-02, BOOK-06)."
                }, status=status.HTTP_409_CONFLICT)

            # BOOK-04: Validate quotation version
            if quote.quotation_version != expected_version:
                return Response({
                    'error': f"Quotation version mismatch: expected v{expected_version}, but quotation is v{quote.quotation_version} (BOOK-04)."
                }, status=status.HTTP_400_BAD_REQUEST)

            # BOOK-04: Validate quotation expiry
            if quote.is_expired():
                quote.status = 'expired'
                quote.save()
                return Response({'error': 'Quotation has expired and can no longer be accepted (BOOK-04).'}, status=status.HTTP_400_BAD_REQUEST)

            # BOOK-15: Check provider suspension
            if hasattr(quote.provider, 'provider_profile') and quote.provider.provider_profile.is_suspended():
                return Response({'error': 'Cannot accept quote: Provider is currently suspended (BOOK-15).'}, status=status.HTTP_400_BAD_REQUEST)

            # BOOK-07: Check exclusive resource reservation
            if Booking.check_double_booking(quote.provider_id, quote.proposed_schedule, exclusive_resource_id=exclusive_res_id):
                return Response({
                    'error': f"Resource reservation conflict: Exclusive resource or provider already booked for {quote.proposed_schedule} (BOOK-07)."
                }, status=status.HTTP_409_CONFLICT)

            # Accept quotation
            quote.status = 'accepted'
            quote.save()

            # Reject other competing quotes for this request
            service_req.quotations.exclude(id=quote.id).update(status='rejected')

            service_req.status = 'quote_accepted'
            service_req.save()

            # Create Booking
            booking = Booking.objects.create(
                request=service_req,
                quotation=quote,
                farmer=service_req.farmer,
                provider=quote.provider,
                agreed_amount=quote.quote_amount,
                scheduled_date=quote.proposed_schedule,
                confirmed_window_start=quote.proposed_service_window_start or quote.proposed_schedule,
                confirmed_window_end=quote.proposed_service_window_end or quote.proposed_schedule,
                exclusive_resource_id=exclusive_res_id,
                status='pending_confirmation'
            )

            # Create tentative resource reservation
            res_record, _ = ResourceReservation.objects.update_or_create(
                booking=booking,
                defaults={
                    'provider': quote.provider,
                    'resource_type': 'exclusive' if exclusive_res_id else 'shared',
                    'resource_identifier': exclusive_res_id or f"Provider-{quote.provider_id}",
                    'date': quote.proposed_schedule,
                    'allocated_quantity': 1,
                    'max_capacity': 1,
                    'is_active': True
                }
            )

            # Record event (BOOK-20)
            BookingEvent.objects.create(
                booking=booking,
                actor=user,
                action='Quotation Accepted',
                from_status='',
                to_status='pending_confirmation',
                notes=f"Farmer accepted Quote v{quote.quotation_version} total ₹{quote.quote_amount}. Resource tentatively reserved."
            )

            # FIN-02: Confirmed commitment recorded in Farm Project Financial Planner
            if service_req.farm_project:
                from farm_projects.models import ExpenseRecord
                cat = 'machinery'
                if service_req.category and service_req.category.slug in ['labour', 'irrigation']:
                    cat = service_req.category.slug
                ExpenseRecord.objects.create(
                    project=service_req.farm_project,
                    booking=booking,
                    category=cat,
                    record_type='commitment',
                    title=f"Quotation #{quote.id}: {service_req.title}",
                    amount=booking.agreed_amount,
                    status='active',
                    notes=f"Accepted quotation v{quote.quotation_version} by provider {quote.provider.username}"
                )
                service_req.farm_project.update_project_status()

            Notification.send_unique(
                recipient=quote.provider,
                title="Quotation Accepted! Please Confirm Booking",
                message=f"Farmer {user.get_full_name() or user.username} accepted your Quote v{quote.quotation_version} for '{service_req.title}'. Confirm availability.",
                link_url="/provider/bookings"
            )

            response_payload = {
                'message': 'Quotation successfully accepted. Booking created in pending confirmation state.',
                'booking_id': booking.id,
                'reference_id': booking.reference_id,
                'confirmed_booking_status': booking.status,
                'accepted_total': str(booking.agreed_amount),
                'currency': 'INR',
                'confirmed_service_window': {
                    'start_date': str(booking.confirmed_window_start),
                    'end_date': str(booking.confirmed_window_end)
                },
                'reservation_identifier': res_record.resource_identifier,
                'booking': BookingSerializer(booking).data
            }

            # Cache idempotency record if key was provided
            if idempotency_key:
                IdempotencyKey.objects.create(
                    key=idempotency_key,
                    user=user,
                    request_hash=hashlib.sha256(json.dumps(request.data, sort_keys=True, default=str).encode('utf-8')).hexdigest(),
                    response_data=response_payload,
                    response_status=200
                )

            return Response(response_payload, status=status.HTTP_200_OK)


class BookingListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_farmer():
            bookings = Booking.objects.filter(farmer=user).order_by('-created_at')
        elif user.is_worker() or user.is_provider():
            bookings = Booking.objects.filter(provider=user).order_by('-created_at')
        elif user.is_admin_role():
            bookings = Booking.objects.all().order_by('-created_at')
        else:
            bookings = Booking.objects.none()

        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)


class BookingDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        user = request.user
        if not (user.is_admin_role() or booking.farmer == user or booking.provider == user):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(BookingSerializer(booking).data)


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
            'scheduled': ['in_progress', 'cancelled_by_farmer', 'cancelled_by_provider'],
            'in_progress': ['completion_pending'],
        }

        if new_status not in valid_transitions.get(booking.status, []):
            return Response({'error': f"Invalid status transition from '{booking.status}' to '{new_status}'."}, status=status.HTTP_400_BAD_REQUEST)

        from_status = booking.status
        booking.status = new_status
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


class BookingCompletionSubmitView(APIView):
    """
    BOOK-19: Provider submits service completion. Sets status to 'completion_pending'.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        notes = request.data.get('notes', 'Provider declared service completed.')
        try:
            updated = booking.submit_completion(request.user, notes=notes)
            return Response({
                'message': 'Service completion submitted. Awaiting farmer inspection & approval.',
                'booking': BookingSerializer(updated).data
            })
        except ValidationError as e:
            return Response({'error': str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)


class BookingCompletionConfirmView(APIView):
    """
    BOOK-19: Farmer confirms completed work or raises dispute.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        is_approved = request.data.get('approved', True)
        reason = request.data.get('reason', '')
        try:
            confirmed = booking.confirm_completion_by_farmer(request.user, is_approved=is_approved, dispute_reason=reason)
            return Response({
                'message': 'Service completion decision recorded.',
                'booking': BookingSerializer(confirmed).data
            })
        except ValidationError as e:
            return Response({'error': str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)


class BookingAdditionalChargeView(APIView):
    """
    BOOK-12: Additional charges require explicit farmer approval.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        action = request.data.get('action', 'request')

        if action == 'request':
            if booking.provider != request.user and not request.user.is_superuser:
                return Response({'error': 'Only the assigned provider can request additional charges.'}, status=status.HTTP_403_FORBIDDEN)
            amount = Decimal(str(request.data.get('amount', '0.00')))
            reason = request.data.get('reason', '')
            if amount <= 0:
                return Response({'error': 'Additional charge amount must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)
            charge = AdditionalChargeRequest.objects.create(
                booking=booking,
                requested_by=request.user,
                amount=amount,
                reason=reason
            )
            Notification.send_unique(
                recipient=booking.farmer,
                title="Additional Charge Approval Required",
                message=f"Provider requested additional charge of ₹{amount} on {booking.reference_id}: {reason}.",
                link_url="/farmer/bookings"
            )
            return Response(AdditionalChargeRequestSerializer(charge).data, status=status.HTTP_201_CREATED)

        elif action in ['approve', 'reject']:
            if booking.farmer != request.user and not request.user.is_superuser:
                return Response({'error': 'Only the farmer can approve or reject additional charges.'}, status=status.HTTP_403_FORBIDDEN)
            charge_id = request.data.get('charge_id')
            charge = get_object_or_404(AdditionalChargeRequest, pk=charge_id, booking=booking)
            charge.status = 'approved' if action == 'approve' else 'rejected'
            charge.resolved_at = timezone.now()
            charge.save()

            if action == 'approve':
                # Increase booking agreed amount
                booking.agreed_amount += charge.amount
                booking.save()
                BookingEvent.objects.create(
                    booking=booking,
                    actor=request.user,
                    action='Approved Additional Charge',
                    from_status=booking.status,
                    to_status=booking.status,
                    notes=f"Farmer approved additional charge of ₹{charge.amount}: {charge.reason}"
                )

            return Response(AdditionalChargeRequestSerializer(charge).data)
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


class BookingPartialCompletionView(APIView):
    """
    BOOK-18: Partial completion requires recorded completed quantity and agreed settlement.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        user = request.user
        if not (booking.farmer == user or booking.provider == user or user.is_superuser):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        completed_qty = request.data.get('completed_quantity', '')
        settlement_amt = Decimal(str(request.data.get('agreed_settlement_amount', '0.00')))
        reason = request.data.get('reason', '')

        with transaction.atomic():
            booking.status = 'partially_completed'
            booking.agreed_amount = settlement_amt
            booking.completed_at = timezone.now()
            booking.save()

            record, _ = PartialCompletionRecord.objects.update_or_create(
                booking=booking,
                defaults={
                    'completed_quantity': completed_qty,
                    'agreed_settlement_amount': settlement_amt,
                    'reason': reason,
                    'confirmed_by_farmer': True
                }
            )

            # Release resource reservation (BOOK-14)
            ResourceReservation.objects.filter(booking=booking).update(is_active=False)

            BookingEvent.objects.create(
                booking=booking,
                actor=user,
                action='Recorded Partial Completion',
                from_status='',
                to_status='partially_completed',
                notes=f"Partial settlement ₹{settlement_amt} for '{completed_qty}': {reason}"
            )

            if booking.request.farm_project:
                from farm_projects.models import ExpenseRecord
                # FIN-08 / FIN-03: Fulfill commitment and record partial settlement incurred expense
                ExpenseRecord.objects.filter(booking=booking, record_type='commitment').update(status='fulfilled')
                cat = 'machinery'
                if booking.request.category and booking.request.category.slug in ['labour', 'irrigation']:
                    cat = booking.request.category.slug
                ExpenseRecord.objects.update_or_create(
                    project=booking.request.farm_project,
                    booking=booking,
                    record_type='incurred',
                    defaults={
                        'category': cat,
                        'title': f"Partial Service {booking.reference_id}: {booking.request.title}",
                        'amount': settlement_amt,
                        'status': 'active',
                        'notes': f"Partial completion recorded. Agreed settlement ₹{settlement_amt}."
                    }
                )
                booking.request.farm_project.update_project_status()

            return Response({
                'message': 'Partial completion successfully recorded.',
                'booking': BookingSerializer(booking).data,
                'partial_record': PartialCompletionRecordSerializer(record).data
            })


class BookingRescheduleView(APIView):
    """
    BOOK-13: Failed rescheduling must preserve the original valid reservation.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        user = request.user
        if not (booking.farmer == user or booking.provider == user or user.is_superuser):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        new_date_str = request.data.get('new_date')
        if not new_date_str:
            return Response({'error': 'Please provide new_date.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            locked = Booking.objects.select_for_update().get(id=booking.id)
            # Check if provider has conflict on new date
            conflict = Booking.check_double_booking(
                locked.provider_id,
                new_date_str,
                exclude_booking_id=locked.id,
                exclusive_resource_id=locked.exclusive_resource_id
            )
            if conflict:
                # Failed rescheduling preserves original reservation (BOOK-13)
                return Response({
                    'error': f"Rescheduling failed: Provider or resource is unavailable on {new_date_str}. Original reservation for {locked.scheduled_date} is preserved (BOOK-13)."
                }, status=status.HTTP_409_CONFLICT)

            old_date = locked.scheduled_date
            locked.scheduled_date = new_date_str
            locked.confirmed_window_start = new_date_str
            locked.confirmed_window_end = new_date_str
            locked.save()

            # Update reservation record
            ResourceReservation.objects.filter(booking=locked).update(date=new_date_str)

            BookingEvent.objects.create(
                booking=locked,
                actor=user,
                action='Rescheduled Booking',
                from_status=locked.status,
                to_status=locked.status,
                notes=f"Rescheduled from {old_date} to {new_date_str}."
            )

            return Response({
                'message': f"Booking successfully rescheduled to {new_date_str}.",
                'booking': BookingSerializer(locked).data
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
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})
