from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .models import User
from .serializers import RegisterSerializer, UserSerializer

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
