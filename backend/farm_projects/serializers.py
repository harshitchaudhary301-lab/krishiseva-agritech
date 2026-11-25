from rest_framework import serializers
from .models import (
    Farm, Field, CropTemplate, CropOperationTemplate,
    FarmProject, ProjectOperation, ProjectService,
    ExpenseRecord, PaymentRecord, RevenueRecord, FinancialAdjustment,
    SoilReport, SeedProcurementRecord, CropObservation, PostHarvestRecord
)
from services.serializers import ServiceCategorySerializer
from bookings.serializers import ServiceRequestSerializer

class FieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = Field
        fields = [
            'id', 'farm', 'name', 'khasra_number', 'area_acres',
            'soil_type', 'irrigation_status', 'latitude', 'longitude', 'created_at'
        ]
        read_only_fields = ['created_at']


class FarmSerializer(serializers.ModelSerializer):
    fields = FieldSerializer(many=True, read_only=True)

    class Meta:
        model = Farm
        fields = [
            'id', 'farmer', 'name', 'village', 'block', 'district', 'state',
            'lgd_code', 'land_tenure', 'size_acres', 'original_area_unit',
            'latitude', 'longitude', 'current_crops', 'soil_type', 'irrigation_source',
            'history_notes', 'fields', 'created_at'
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


class FinancialAdjustmentSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = FinancialAdjustment
        fields = ['id', 'expense', 'amount', 'reason', 'approved_by', 'approved_by_name', 'created_at']
        read_only_fields = ['expense', 'approved_by', 'created_at']


class ExpenseRecordSerializer(serializers.ModelSerializer):
    adjustments = FinancialAdjustmentSerializer(many=True, read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    type_display = serializers.CharField(source='get_record_type_display', read_only=True)

    class Meta:
        model = ExpenseRecord
        fields = [
            'id', 'project', 'category', 'category_display', 'record_type',
            'type_display', 'booking', 'title', 'amount', 'status', 'notes',
            'adjustments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['project', 'created_at', 'updated_at']


class PaymentRecordSerializer(serializers.ModelSerializer):
    payer_name = serializers.CharField(source='payer.get_full_name', read_only=True)
    payee_name = serializers.CharField(source='payee.get_full_name', read_only=True)
    type_display = serializers.CharField(source='get_payment_type_display', read_only=True)

    class Meta:
        model = PaymentRecord
        fields = [
            'id', 'project', 'expense', 'booking', 'payer', 'payer_name',
            'payee', 'payee_name', 'payment_type', 'type_display', 'amount',
            'payment_mode', 'transaction_reference', 'notes', 'payment_date', 'created_at'
        ]
        read_only_fields = ['project', 'payer', 'created_at']


class RevenueRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = RevenueRecord
        fields = [
            'id', 'project', 'crop', 'quantity_quintals', 'rate_per_quintal',
            'total_realized_revenue', 'buyer_name', 'mandi_or_mill',
            'sale_date', 'created_at'
        ]
        read_only_fields = ['project', 'total_realized_revenue', 'created_at']


class FarmProjectSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source='farmer.get_full_name', read_only=True)
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    field_name = serializers.CharField(source='field.name', read_only=True)
    project_operations = ProjectOperationSerializer(many=True, read_only=True)
    project_services = ProjectServiceSerializer(many=True, read_only=True)
    progress_info = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    financial_summary = serializers.SerializerMethodField()
    services_count = serializers.SerializerMethodField()
    confirmed_count = serializers.SerializerMethodField()

    class Meta:
        model = FarmProject
        fields = [
            'id', 'farmer', 'farmer_name', 'farm', 'farm_name',
            'field', 'field_name', 'crop_template', 'template_version',
            'name', 'crop', 'variant', 'target_area_acres', 'start_date',
            'expected_completion_date', 'status', 'estimated_budget',
            'actual_cost', 'notes', 'project_operations', 'project_services',
            'progress_info', 'completion_percentage', 'financial_summary',
            'services_count', 'confirmed_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['farmer', 'status', 'estimated_budget', 'actual_cost', 'created_at', 'updated_at']

    def get_progress_info(self, obj):
        return obj.calculate_actual_progress()

    def get_completion_percentage(self, obj):
        prog = obj.calculate_actual_progress()
        return prog.get('percentage')

    def get_services_count(self, obj):
        return obj.project_services.count()

    def get_confirmed_count(self, obj):
        return obj.project_services.filter(
            service_request__status__in=['booked', 'confirmed', 'completed']
        ).count()

    def get_financial_summary(self, obj):
        return obj.get_financial_summary()


class SoilReportSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source='farmer.get_full_name', read_only=True)
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    field_name = serializers.CharField(source='field.name', read_only=True)
    electrical_conductivity = serializers.DecimalField(source='ec', max_digits=5, decimal_places=2, read_only=True)
    organic_carbon_percentage = serializers.DecimalField(source='organic_carbon_percent', max_digits=4, decimal_places=2, read_only=True)
    nitrogen_kg_per_ha = serializers.DecimalField(source='nitrogen_kg_ha', max_digits=6, decimal_places=2, read_only=True)
    phosphorus_kg_per_ha = serializers.DecimalField(source='phosphorus_kg_ha', max_digits=6, decimal_places=2, read_only=True)
    potassium_kg_per_ha = serializers.DecimalField(source='potassium_kg_ha', max_digits=6, decimal_places=2, read_only=True)

    class Meta:
        model = SoilReport
        fields = [
            'id', 'farmer', 'farmer_name', 'farm', 'farm_name', 'field', 'field_name',
            'sampling_date', 'report_date', 'lab_name', 'sample_id', 'soil_texture',
            'ph', 'ec', 'organic_carbon_percent', 'nitrogen_kg_ha', 'phosphorus_kg_ha',
            'potassium_kg_ha', 'zinc_ppm', 'iron_ppm', 'document_reference', 'notes',
            'electrical_conductivity', 'organic_carbon_percentage',
            'nitrogen_kg_per_ha', 'phosphorus_kg_per_ha', 'potassium_kg_per_ha',
            'created_at'
        ]
        read_only_fields = ['farmer', 'farm', 'created_at']


class SeedProcurementRecordSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    status_display = serializers.CharField(source='get_procurement_status_display', read_only=True)
    variety = serializers.CharField(source='variety_name', read_only=True)
    breeder_source = serializers.CharField(source='source_breeder', read_only=True)
    unit = serializers.CharField(source='quantity_unit', read_only=True)

    class Meta:
        model = SeedProcurementRecord
        fields = [
            'id', 'project', 'project_name', 'crop', 'variety_name', 'source_breeder',
            'variety', 'breeder_source', 'unit',
            'required_quantity', 'quantity_unit', 'procurement_status', 'status_display',
            'supplier_name', 'purchase_date', 'lot_number', 'recorded_cost',
            'notes', 'created_at'
        ]
        read_only_fields = ['project', 'created_at']


class CropObservationSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    operation_name = serializers.CharField(source='operation.operation_name_en', read_only=True)
    condition_display = serializers.CharField(source='get_crop_condition_display', read_only=True)
    follow_up_display = serializers.CharField(source='get_follow_up_status_display', read_only=True)

    class Meta:
        model = CropObservation
        fields = [
            'id', 'project', 'project_name', 'operation', 'operation_name',
            'observation_date', 'growth_stage', 'crop_condition', 'condition_display',
            'field_notes', 'reported_concerns', 'follow_up_status', 'follow_up_display',
            'photo_reference', 'created_at'
        ]
        read_only_fields = ['project', 'created_at']


class PostHarvestRecordSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    sale_status_display = serializers.CharField(source='get_sale_status_display', read_only=True)
    storage_type_display = serializers.CharField(source='get_storage_type_display', read_only=True)
    unit = serializers.CharField(source='quantity_unit', read_only=True)
    storage_days = serializers.IntegerField(source='storage_duration_days', read_only=True)
    storage_cost = serializers.DecimalField(source='storage_cost_inr', max_digits=10, decimal_places=2, read_only=True)
    transport_cost = serializers.DecimalField(source='transport_cost_inr', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = PostHarvestRecord
        fields = [
            'id', 'project', 'project_name', 'harvest_date', 'produce_quantity',
            'quantity_unit', 'unit', 'quality_grade', 'moisture_content_percent',
            'storage_type', 'storage_type_display', 'storage_location',
            'storage_duration_days', 'storage_days',
            'storage_cost_inr', 'storage_cost',
            'transport_required', 'transport_cost_inr', 'transport_cost',
            'sale_status', 'sale_status_display', 'notes', 'created_at'
        ]
        read_only_fields = ['project', 'created_at']

