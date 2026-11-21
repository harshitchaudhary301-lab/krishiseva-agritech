from rest_framework import serializers
from .models import Farm, FarmProject, ProjectService
from services.serializers import ServiceCategorySerializer
from bookings.serializers import ServiceRequestSerializer

class FarmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farm
        fields = ['id', 'farmer', 'name', 'village', 'district', 'state', 'size_acres', 'current_crops', 'soil_type', 'irrigation_source', 'created_at']
        read_only_fields = ['farmer', 'created_at']


class ProjectServiceSerializer(serializers.ModelSerializer):
    category_details = ServiceCategorySerializer(source='category', read_only=True)
    service_request_details = ServiceRequestSerializer(source='service_request', read_only=True)
    booking_status = serializers.SerializerMethodField()
    agreed_cost = serializers.SerializerMethodField()

    class Meta:
        model = ProjectService
        fields = [
            'id', 'project', 'category', 'category_details',
            'service_request', 'service_request_details',
            'scope_description', 'target_date', 'booking_status',
            'agreed_cost', 'created_at'
        ]

    def get_booking_status(self, obj):
        if obj.service_request and hasattr(obj.service_request, 'booking') and obj.service_request.booking:
            return obj.service_request.booking.status
        if obj.service_request:
            return obj.service_request.status
        return 'not_created'

    def get_agreed_cost(self, obj):
        if obj.service_request and hasattr(obj.service_request, 'booking') and obj.service_request.booking:
            return float(obj.service_request.booking.agreed_amount)
        if obj.service_request and obj.service_request.budget_max:
            return float(obj.service_request.budget_max)
        return 0.0


class FarmProjectSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source='farmer.get_full_name', read_only=True)
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    project_services = ProjectServiceSerializer(many=True, read_only=True)
    completion_percentage = serializers.SerializerMethodField()
    services_count = serializers.IntegerField(source='project_services.count', read_only=True)
    confirmed_count = serializers.SerializerMethodField()

    class Meta:
        model = FarmProject
        fields = [
            'id', 'farmer', 'farmer_name', 'farm', 'farm_name',
            'name', 'crop', 'target_area_acres', 'start_date',
            'expected_completion_date', 'status', 'estimated_budget',
            'actual_cost', 'notes', 'project_services', 'completion_percentage',
            'services_count', 'confirmed_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['farmer', 'status', 'estimated_budget', 'actual_cost', 'created_at', 'updated_at']

    def get_completion_percentage(self, obj):
        services = obj.project_services.all()
        if not services.exists():
            return 0
        total = services.count()
        completed = 0
        confirmed = 0
        for s in services:
            if s.service_request and hasattr(s.service_request, 'booking') and s.service_request.booking:
                if s.service_request.booking.status == 'completed':
                    completed += 1
                elif s.service_request.booking.status in ['confirmed', 'scheduled', 'in_progress']:
                    confirmed += 1
        # Weight: 100% per completed, 50% per confirmed
        progress = ((completed * 100) + (confirmed * 50)) / total
        return min(int(progress), 100)

    def get_confirmed_count(self, obj):
        services = obj.project_services.all()
        confirmed = 0
        for s in services:
            if s.service_request and hasattr(s.service_request, 'booking') and s.service_request.booking:
                if s.service_request.booking.status in ['confirmed', 'scheduled', 'in_progress', 'completed']:
                    confirmed += 1
        return confirmed
