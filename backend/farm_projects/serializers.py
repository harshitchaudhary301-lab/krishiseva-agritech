from rest_framework import serializers
from .models import (
    Farm, Field, CropTemplate, CropOperationTemplate,
    FarmProject, ProjectOperation, ProjectService
)
from services.serializers import ServiceCategorySerializer
from bookings.serializers import ServiceRequestSerializer

class FieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = Field
        fields = ['id', 'farm', 'name', 'area_acres', 'soil_type', 'irrigation_status', 'created_at']
        read_only_fields = ['created_at']


class FarmSerializer(serializers.ModelSerializer):
    fields = FieldSerializer(many=True, read_only=True)

    class Meta:
        model = Farm
        fields = [
            'id', 'farmer', 'name', 'village', 'district', 'state',
            'size_acres', 'current_crops', 'soil_type', 'irrigation_source',
            'fields', 'created_at'
        ]
        read_only_fields = ['farmer', 'created_at']


class CropOperationTemplateSerializer(serializers.ModelSerializer):
    default_service_category_details = ServiceCategorySerializer(source='default_service_category', read_only=True)

    class Meta:
        model = CropOperationTemplate
        fields = [
            'id', 'crop_template', 'sequence_order', 'operation_name_en',
            'operation_name_hi', 'stage', 'default_service_category',
            'default_service_category_details', 'offset_start_days',
            'offset_duration_days', 'is_mandatory', 'description'
        ]


class CropTemplateSerializer(serializers.ModelSerializer):
    operations = CropOperationTemplateSerializer(many=True, read_only=True)
    operations_count = serializers.IntegerField(source='operations.count', read_only=True)

    class Meta:
        model = CropTemplate
        fields = [
            'id', 'slug', 'crop_name_en', 'crop_name_hi', 'variant_name_en',
            'variant_name_hi', 'season', 'typical_duration_days', 'version',
            'description_en', 'description_hi', 'operations_count', 'operations', 'is_active'
        ]


class ProjectOperationSerializer(serializers.ModelSerializer):
    service_category_details = ServiceCategorySerializer(source='service_category', read_only=True)
    prerequisite_name = serializers.CharField(source='prerequisite_operation.operation_name_en', read_only=True)
    booking_reference = serializers.CharField(source='booking.reference_id', read_only=True)

    class Meta:
        model = ProjectOperation
        fields = [
            'id', 'project', 'sequence_order', 'operation_name_en', 'operation_name_hi',
            'stage', 'service_category', 'service_category_details',
            'service_request', 'booking', 'booking_reference', 'status',
            'planned_start_date', 'planned_end_date', 'actual_start_date',
            'actual_completion_date', 'is_mandatory', 'is_manual',
            'prerequisite_operation', 'prerequisite_name', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, attrs):
        # Validate dependency on update/create
        prereq = attrs.get('prerequisite_operation')
        instance_id = self.instance.id if self.instance else None
        if prereq and instance_id:
            if prereq.id == instance_id:
                raise serializers.ValidationError({"prerequisite_operation": "An operation cannot depend on itself."})
            visited = {instance_id}
            curr = prereq
            while curr:
                if curr.id in visited:
                    raise serializers.ValidationError({"prerequisite_operation": f"Circular task dependency detected with '{curr.operation_name_en}'."})
                visited.add(curr.id)
                curr = curr.prerequisite_operation
        return attrs


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
    field_name = serializers.CharField(source='field.name', read_only=True)
    project_operations = ProjectOperationSerializer(many=True, read_only=True)
    project_services = ProjectServiceSerializer(many=True, read_only=True)
    progress_info = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()

    class Meta:
        model = FarmProject
        fields = [
            'id', 'farmer', 'farmer_name', 'farm', 'farm_name',
            'field', 'field_name', 'crop_template', 'template_version',
            'name', 'crop', 'variant', 'target_area_acres', 'start_date',
            'expected_completion_date', 'status', 'estimated_budget',
            'actual_cost', 'notes', 'project_operations', 'project_services',
            'progress_info', 'completion_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = ['farmer', 'status', 'estimated_budget', 'actual_cost', 'created_at', 'updated_at']

    def get_progress_info(self, obj):
        return obj.calculate_actual_progress()

    def get_completion_percentage(self, obj):
        prog = obj.calculate_actual_progress()
        return prog.get('percentage')
