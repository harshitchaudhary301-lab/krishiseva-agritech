from django.contrib import admin
from .models import (
    Farm, Field, CropTemplate, CropOperationTemplate, FarmProject, ProjectOperation, ProjectService,
    ExpenseRecord, PaymentRecord, RevenueRecord, FinancialAdjustment
)

class FieldInline(admin.TabularInline):
    model = Field
    extra = 1

class CropOperationTemplateInline(admin.TabularInline):
    model = CropOperationTemplate
    extra = 1

class ProjectOperationInline(admin.TabularInline):
    model = ProjectOperation
    extra = 0
    fields = ('sequence_order', 'operation_name_en', 'stage', 'status', 'is_manual', 'planned_start_date', 'actual_completion_date')

class ProjectServiceInline(admin.TabularInline):
    model = ProjectService
    extra = 1

@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ('name', 'farmer', 'village', 'district', 'size_acres', 'current_crops')
    search_fields = ('name', 'farmer__username', 'village')
    list_filter = ('district', 'state')
    inlines = [FieldInline]

@admin.register(Field)
class FieldAdmin(admin.ModelAdmin):
    list_display = ('name', 'farm', 'area_acres', 'soil_type', 'irrigation_status')
    search_fields = ('name', 'farm__name')

@admin.register(CropTemplate)
class CropTemplateAdmin(admin.ModelAdmin):
    list_display = ('crop_name_en', 'crop_name_hi', 'variant_name_en', 'season', 'typical_duration_days', 'version', 'is_active')
    list_filter = ('season', 'is_active')
    search_fields = ('crop_name_en', 'crop_name_hi', 'slug')
    inlines = [CropOperationTemplateInline]

@admin.register(CropOperationTemplate)
class CropOperationTemplateAdmin(admin.ModelAdmin):
    list_display = ('crop_template', 'sequence_order', 'operation_name_en', 'stage', 'default_service_category', 'offset_start_days', 'is_mandatory')
    list_filter = ('crop_template', 'stage', 'is_mandatory')
    search_fields = ('operation_name_en', 'crop_template__crop_name_en')

@admin.register(FarmProject)
class FarmProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'farmer', 'crop', 'variant', 'target_area_acres', 'status', 'start_date', 'estimated_budget', 'actual_cost')
    list_filter = ('status', 'crop')
    search_fields = ('name', 'farmer__username', 'crop')
    inlines = [ProjectOperationInline, ProjectServiceInline]

@admin.register(ProjectOperation)
class ProjectOperationAdmin(admin.ModelAdmin):
    list_display = ('project', 'sequence_order', 'operation_name_en', 'stage', 'status', 'is_manual', 'planned_start_date', 'actual_completion_date')
    list_filter = ('status', 'stage', 'is_manual')
    search_fields = ('operation_name_en', 'project__name')

@admin.register(ProjectService)
class ProjectServiceAdmin(admin.ModelAdmin):
    list_display = ('project', 'category', 'service_request', 'target_date')
    list_filter = ('category',)
    search_fields = ('project__name', 'scope_description')

class FinancialAdjustmentInline(admin.TabularInline):
    model = FinancialAdjustment
    extra = 0

@admin.register(ExpenseRecord)
class ExpenseRecordAdmin(admin.ModelAdmin):
    list_display = ('project', 'category', 'record_type', 'title', 'amount', 'status', 'created_at')
    list_filter = ('record_type', 'category', 'status')
    search_fields = ('title', 'project__name')
    inlines = [FinancialAdjustmentInline]

@admin.register(PaymentRecord)
class PaymentRecordAdmin(admin.ModelAdmin):
    list_display = ('project', 'payment_type', 'amount', 'payer', 'payee', 'payment_date')
    list_filter = ('payment_type', 'payment_date')
    search_fields = ('project__name', 'payer__username', 'transaction_reference')

@admin.register(RevenueRecord)
class RevenueRecordAdmin(admin.ModelAdmin):
    list_display = ('project', 'crop', 'quantity_quintals', 'rate_per_quintal', 'total_realized_revenue', 'sale_date')
    list_filter = ('crop', 'sale_date')
    search_fields = ('project__name', 'buyer_name', 'mandi_or_mill')

@admin.register(FinancialAdjustment)
class FinancialAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('expense', 'amount', 'reason', 'approved_by', 'created_at')
    search_fields = ('expense__title', 'reason')
