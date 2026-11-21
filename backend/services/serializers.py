from rest_framework import serializers
from .models import ServiceCategory, Village, ProviderService, Review
from accounts.serializers import UserSerializer

class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = [
            'id', 'slug', 'name_en', 'name_hi',
            'description_en', 'description_hi',
            'icon', 'is_active', 'base_unit', 'typical_price_range', 'display_order'
        ]


class VillageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Village
        fields = ['id', 'name', 'district', 'state', 'pincode']


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
