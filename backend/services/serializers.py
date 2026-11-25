from rest_framework import serializers
from .models import (
    ServiceCategory, Village, ProviderService, Review,
    AgriculturalReferenceRecord, HistoricalMachineryRate, HistoricalAgriculturalWage,
    InstitutionalResource, State, District, SubDistrict, DevelopmentBlock, LocalBody, Ward
)
from accounts.serializers import UserSerializer

class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = [
            'id', 'slug', 'name_en', 'name_hi',
            'description_en', 'description_hi',
            'icon', 'is_active', 'base_unit', 'typical_price_range', 'display_order'
        ]


class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = ['id', 'lgd_code', 'name_en', 'name_local', 'state_or_ut']


class DistrictSerializer(serializers.ModelSerializer):
    state_name = serializers.CharField(source='state.name_en', read_only=True)

    class Meta:
        model = District
        fields = ['id', 'lgd_code', 'name_en', 'name_local', 'state', 'state_name']


class SubDistrictSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.name_en', read_only=True)
    state_id = serializers.IntegerField(source='district.state_id', read_only=True)
    state_name = serializers.CharField(source='district.state.name_en', read_only=True)

    class Meta:
        model = SubDistrict
        fields = ['id', 'lgd_code', 'name_en', 'name_local', 'district', 'district_name', 'state_id', 'state_name']


class DevelopmentBlockSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.name_en', read_only=True)

    class Meta:
        model = DevelopmentBlock
        fields = ['id', 'lgd_code', 'name_en', 'name_local', 'district', 'district_name']


class LocalBodySerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.name_en', read_only=True)
    state_name = serializers.CharField(source='state.name_en', read_only=True)

    class Meta:
        model = LocalBody
        fields = [
            'id', 'lgd_code', 'name_en', 'name_local',
            'local_body_type', 'local_body_type_name',
            'state', 'state_name', 'district', 'district_name',
            'parent_local_body_code'
        ]


class WardSerializer(serializers.ModelSerializer):
    local_body_name = serializers.CharField(source='local_body.name_en', read_only=True)

    class Meta:
        model = Ward
        fields = ['id', 'ward_code', 'ward_number', 'ward_name', 'local_body', 'local_body_name']


class VillageSerializer(serializers.ModelSerializer):
    subdistrict_name = serializers.CharField(source='subdistrict.name_en', default='', read_only=True)
    district_name = serializers.CharField(source='district_ref.name_en', default='', read_only=True)
    state_name = serializers.CharField(source='state_ref.name_en', default='', read_only=True)

    class Meta:
        model = Village
        fields = [
            'id', 'name', 'name_local', 'lgd_code',
            'subdistrict', 'subdistrict_name',
            'district_ref', 'district_name', 'district',
            'state_ref', 'state_name', 'state',
            'pincode', 'latitude', 'longitude', 'village_status'
        ]


class ProviderServiceSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.get_full_name', read_only=True)
    provider_username = serializers.CharField(source='provider.username', read_only=True)
    provider_village = serializers.CharField(source='provider.village', read_only=True)
    provider_phone = serializers.CharField(source='provider.phone', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    category_name = serializers.CharField(source='category.name_en', read_only=True)

    class Meta:
        model = ProviderService
        fields = [
            'id', 'provider', 'provider_name', 'provider_username',
            'provider_village', 'provider_phone', 'category',
            'category_slug', 'category_name', 'title', 'description',
            'base_rate', 'rate_unit', 'equipment_models', 'is_active', 'created_at'
        ]


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'reviewer', 'reviewer_name', 'target_user', 'rating', 'comment', 'created_at']
        read_only_fields = ['reviewer', 'created_at']


class AgriculturalReferenceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgriculturalReferenceRecord
        fields = '__all__'


class HistoricalMachineryRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricalMachineryRate
        fields = '__all__'


class HistoricalAgriculturalWageSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricalAgriculturalWage
        fields = '__all__'


class InstitutionalResourceSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = InstitutionalResource
        fields = [
            'id', 'name_en', 'name_hi', 'category', 'category_display',
            'description_en', 'description_hi', 'official_url',
            'geographic_coverage', 'implementing_agency', 'contact_info',
            'is_verified', 'last_reviewed_date', 'display_order', 'created_at'
        ]

