from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import User, WorkerProfile, ProviderProfile, VerificationAuditLog
from .serializers import (
    RegisterSerializer, UserSerializer,
    AdminVerificationActionSerializer, VerificationAuditLogSerializer
)
from .permissions import IsAdminRole

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            user_data = UserSerializer(user).data
            return Response({
                'token': token.key,
                'user': user_data,
                'message': 'Registration successful'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get('username') or request.data.get('email', '')
        password = request.data.get('password', '')

        if not identifier or not password:
            return Response({'error': 'Please provide both username/email and password.'}, status=status.HTTP_400_BAD_REQUEST)

        # Support login by username or email
        user = None
        if '@' in identifier:
            try:
                matched_user = User.objects.get(email=identifier)
                user = authenticate(username=matched_user.username, password=password)
            except User.DoesNotExist:
                user = None
        else:
            user = authenticate(username=identifier, password=password)

        if not user:
            return Response({'error': 'Invalid credentials. Please check your username and password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'This account has been deactivated.'}, status=status.HTTP_403_FORBIDDEN)

        token, _ = Token.objects.get_or_create(user=user)
        user_data = UserSerializer(user).data

        return Response({
            'token': token.key,
            'user': user_data,
            'message': 'Login successful'
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        data = request.data
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'village' in data:
            user.village = data['village']
        if 'district' in data:
            user.district = data['district']
        if 'state' in data:
            user.state = data['state']
        user.save()

        # Update profile if provided
        if user.is_farmer() and hasattr(user, 'farmer_profile'):
            profile = user.farmer_profile
            if 'total_land_acres' in data:
                profile.total_land_acres = data['total_land_acres']
            if 'primary_crops' in data:
                profile.primary_crops = data['primary_crops']
            if 'preferred_language' in data:
                profile.preferred_language = data['preferred_language']
            profile.save()
        elif user.is_worker() and hasattr(user, 'worker_profile'):
            profile = user.worker_profile
            if 'skills' in data:
                profile.skills = data['skills']
            if 'daily_wage_rate' in data:
                profile.daily_wage_rate = data['daily_wage_rate']
            if 'is_available' in data:
                profile.is_available = data['is_available']
            profile.save()
        elif user.is_provider() and hasattr(user, 'provider_profile'):
            profile = user.provider_profile
            if 'business_name' in data:
                profile.business_name = data['business_name']
            if 'service_categories' in data:
                profile.service_categories = data['service_categories']
            if 'service_villages' in data:
                profile.service_villages = data['service_villages']
            if 'is_available' in data:
                profile.is_available = data['is_available']
            profile.save()

        return Response(UserSerializer(user).data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully'})


class AdminVerificationView(APIView):
    """
    Administrative management for verifying, rejecting, or suspending service providers and workers.
    Requires privileged administrator credentials.
    """
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        status_filter = request.query_params.get('status', 'all')
        
        workers_qs = WorkerProfile.objects.select_related('user').all()
        providers_qs = ProviderProfile.objects.select_related('user').all()

        if status_filter != 'all':
            workers_qs = workers_qs.filter(verification_status=status_filter)
            providers_qs = providers_qs.filter(verification_status=status_filter)

        queue = []
        for p in providers_qs:
            queue.append({
                'id': p.id,
                'user_id': p.user_id,
                'name': p.user.get_full_name() or p.user.username,
                'username': p.user.username,
                'email': p.user.email,
                'phone': p.user.phone,
                'type': 'provider',
                'business_name': p.business_name,
                'service_categories': p.service_categories,
                'village': p.user.village,
                'district': p.user.district,
                'verification_status': p.verification_status,
                'verified_at': p.verified_at,
                'verified_by': p.verified_by.username if p.verified_by else None,
                'verification_notes': p.verification_notes,
                'suspended_at': p.suspended_at,
                'suspension_reason': p.suspension_reason,
                'qualifications': p.qualifications,
                'machinery_details': p.machinery_details,
                'date_joined': p.user.date_joined,
            })

        for w in workers_qs:
            queue.append({
                'id': w.id,
                'user_id': w.user_id,
                'name': w.user.get_full_name() or w.user.username,
                'username': w.user.username,
                'email': w.user.email,
                'phone': w.user.phone,
                'type': 'worker',
                'business_name': f"Labour Group / Worker ({w.skills})",
                'service_categories': 'labour',
                'village': w.user.village,
                'district': w.user.district,
                'verification_status': w.verification_status,
                'verified_at': w.verified_at,
                'verified_by': w.verified_by.username if w.verified_by else None,
                'verification_notes': w.verification_notes,
                'suspended_at': w.suspended_at,
                'suspension_reason': w.suspension_reason,
                'qualifications': f"Experience: {w.experience_years} years, Rate: ₹{w.daily_wage_rate}/day",
                'machinery_details': 'N/A (Field Labour)',
                'date_joined': w.user.date_joined,
            })

        return Response({
            'count': len(queue),
            'queue': queue
        })

    def post(self, request):
        serializer = AdminVerificationActionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_id = serializer.validated_data['user_id']
        action = serializer.validated_data['action']
        reason = serializer.validated_data['reason']

        target_user = get_object_or_404(User, pk=user_id)
        actor = request.user
        now = timezone.now()

        profile = None
        if hasattr(target_user, 'provider_profile'):
            profile = target_user.provider_profile
        elif hasattr(target_user, 'worker_profile'):
            profile = target_user.worker_profile
        else:
            return Response({'error': 'Target user is not a provider or agricultural worker.'}, status=status.HTTP_400_BAD_REQUEST)

        prev_status = profile.verification_status

        if action == 'verify':
            profile.verification_status = 'verified'
            profile.verified_at = now
            profile.verified_by = actor
            profile.verification_notes = reason
            profile.suspended_at = None
            profile.suspension_reason = ''
            new_status = 'verified'
        elif action == 'reject':
            profile.verification_status = 'rejected'
            profile.verification_notes = reason
            new_status = 'rejected'
        elif action == 'suspend':
            profile.verification_status = 'suspended'
            profile.suspended_at = now
            profile.suspension_reason = reason
            new_status = 'suspended'
        elif action == 'reinstate':
            profile.verification_status = 'verified'
            profile.suspended_at = None
            profile.suspension_reason = ''
            profile.verification_notes = f"Reinstated on {now.strftime('%Y-%m-%d')}: {reason}"
            new_status = 'verified'
        else:
            return Response({'error': f'Unsupported action {action}.'}, status=status.HTTP_400_BAD_REQUEST)

        profile.save()

        # Write audit log entry
        audit_log = VerificationAuditLog.objects.create(
            target_user=target_user,
            actor=actor,
            action=action,
            previous_status=prev_status,
            new_status=new_status,
            reason=reason
        )

        return Response({
            'message': f"Successfully updated verification status to '{new_status}' for {target_user.username}.",
            'audit_log': VerificationAuditLogSerializer(audit_log).data
        })


class AdminVerificationLogsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        logs = VerificationAuditLog.objects.select_related('target_user', 'actor').all()[:100]
        serializer = VerificationAuditLogSerializer(logs, many=True)
        return Response(serializer.data)


class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        users = User.objects.all().order_by('-date_joined')[:100]
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
