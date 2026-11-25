from rest_framework import serializers
from .models import User, FarmerProfile, WorkerProfile, ProviderProfile, UserConsent, VerificationAuditLog

class FarmerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmerProfile
        fields = ['preferred_language', 'total_land_acres', 'primary_crops', 'address']


class WorkerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerProfile
        fields = [
            'skills', 'daily_wage_rate', 'experience_years', 'is_available',
            'verification_status', 'verified_at', 'rating', 'completed_jobs_count', 'bio'
        ]
        read_only_fields = ['verification_status', 'verified_at', 'rating', 'completed_jobs_count']


class ProviderProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderProfile
        fields = [
            'business_name', 'service_categories', 'service_radius_km', 'service_villages',
            'is_available', 'qualifications', 'machinery_details',
            'verification_status', 'verified_at', 'rating', 'completed_bookings_count', 'bio'
        ]
        read_only_fields = ['verification_status', 'verified_at', 'rating', 'completed_bookings_count']


class UserSerializer(serializers.ModelSerializer):
    farmer_profile = FarmerProfileSerializer(read_only=True)
    worker_profile = WorkerProfileSerializer(read_only=True)
    provider_profile = ProviderProfileSerializer(read_only=True)
    verification_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'state', 'district', 'village',
            'profile_complete', 'date_joined',
            'farmer_profile', 'worker_profile', 'provider_profile',
            'verification_status'
        ]
        read_only_fields = ['id', 'role', 'date_joined']

    def get_verification_status(self, obj):
        try:
            if hasattr(obj, 'provider_profile') and obj.provider_profile:
                return obj.provider_profile.verification_status
            elif hasattr(obj, 'worker_profile') and obj.worker_profile:
                return 'verified' if obj.worker_profile.is_verified else 'unverified'
        except Exception:
            pass
        return 'verified' if (obj.is_staff or obj.role in ['farmer', 'admin']) else 'unverified'


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    # Consent fields
    consent_terms = serializers.BooleanField(write_only=True, required=False, default=True)
    consent_privacy = serializers.BooleanField(write_only=True, required=False, default=True)
    terms_version = serializers.CharField(write_only=True, required=False, default='v1.0')

    # Specific profile fields
    land_acres = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, default=0.0)
    primary_crops = serializers.CharField(required=False, allow_blank=True)
    skills = serializers.CharField(required=False, allow_blank=True)
    daily_wage_rate = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, default=500.0)
    business_name = serializers.CharField(required=False, allow_blank=True)
    service_categories = serializers.CharField(required=False, allow_blank=True)
    service_villages = serializers.CharField(required=False, allow_blank=True)
    qualifications = serializers.CharField(required=False, allow_blank=True)
    machinery_details = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'name', 'role',
            'phone', 'state', 'district', 'village',
            'consent_terms', 'consent_privacy', 'terms_version',
            'land_acres', 'primary_crops', 'skills', 'daily_wage_rate',
            'business_name', 'service_categories', 'service_villages',
            'qualifications', 'machinery_details'
        ]

    def validate_role(self, value):
        if value not in ['farmer', 'worker', 'provider']:
            raise serializers.ValidationError("Invalid registration role. Public registration for administrative roles is prohibited.")
        return value

    def create(self, validated_data):
        name = validated_data.pop('name', '')
        password = validated_data.pop('password')
        role = validated_data.get('role', 'farmer')

        # Pop consent fields
        consent_terms = validated_data.pop('consent_terms', True)
        consent_privacy = validated_data.pop('consent_privacy', True)
        terms_version = validated_data.pop('terms_version', 'v1.0')

        # Extract profile fields
        land_acres = validated_data.pop('land_acres', 0.0)
        primary_crops = validated_data.pop('primary_crops', '')
        skills = validated_data.pop('skills', '')
        daily_wage_rate = validated_data.pop('daily_wage_rate', 500.0)
        business_name = validated_data.pop('business_name', '')
        service_categories = validated_data.pop('service_categories', '')
        service_villages = validated_data.pop('service_villages', '')
        qualifications = validated_data.pop('qualifications', '')
        machinery_details = validated_data.pop('machinery_details', '')

        first_name = name
        last_name = ''
        if ' ' in name:
            parts = name.split(' ', 1)
            first_name, last_name = parts[0], parts[1]

        user = User(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=first_name,
            last_name=last_name,
            role=role,
            phone=validated_data.get('phone', ''),
            state=validated_data.get('state', 'Uttar Pradesh'),
            district=validated_data.get('district', 'Meerut'),
            village=validated_data.get('village', 'Daurala'),
        )
        user.set_password(password)
        user.save()

        # Create consent record
        UserConsent.objects.create(
            user=user,
            terms_accepted=consent_terms,
            privacy_accepted=consent_privacy,
            terms_version=terms_version
        )

        # Create corresponding role profile: WORKERS & PROVIDERS MUST DEFAULT TO PENDING
        if role == 'farmer':
            FarmerProfile.objects.create(
                user=user,
                total_land_acres=land_acres,
                primary_crops=primary_crops
            )
        elif role == 'worker':
            WorkerProfile.objects.create(
                user=user,
                skills=skills,
                daily_wage_rate=daily_wage_rate,
                verification_status='pending'  # Never auto-verify newly registered workers
            )
        elif role == 'provider':
            ProviderProfile.objects.create(
                user=user,
                business_name=business_name or f"{user.first_name}'s Agro Services",
                service_categories=service_categories,
                service_villages=service_villages or user.village,
                qualifications=qualifications,
                machinery_details=machinery_details,
                verification_status='pending'  # Never auto-verify newly registered providers
            )

        return user


class AdminVerificationActionSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=True)
    action = serializers.ChoiceField(choices=['verify', 'reject', 'suspend', 'reinstate'])
    reason = serializers.CharField(required=True, min_length=5, allow_blank=False)


class VerificationAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.ReadOnlyField(source='actor.get_full_name')
    target_username = serializers.ReadOnlyField(source='target_user.username')
    subject_user_name = serializers.ReadOnlyField(source='target_user.username')
    subject_user = serializers.ReadOnlyField(source='target_user.id')
    created_at = serializers.ReadOnlyField(source='timestamp')
    reviewed_by_name = serializers.ReadOnlyField(source='actor.get_full_name')
    notes = serializers.ReadOnlyField(source='reason')

    class Meta:
        model = VerificationAuditLog
        fields = [
            'id', 'target_user', 'target_username', 'actor', 'actor_name',
            'action', 'previous_status', 'new_status', 'reason', 'timestamp',
            'subject_user_name', 'subject_user', 'created_at', 'reviewed_by_name', 'notes'
        ]

