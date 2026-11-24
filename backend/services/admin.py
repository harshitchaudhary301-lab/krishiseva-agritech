from django.contrib import admin
from .models import (
    Village, ServiceCategory, ProviderService, Review,
    AgriculturalReferenceRecord, HistoricalMachineryRate, HistoricalAgriculturalWage
)

@admin.register(Village)
class VillageAdmin(admin.ModelAdmin):
    list_display = ('name', 'district', 'state', 'pincode')
    search_fields = ('name', 'district')
    list_filter = ('district', 'state')

@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'name_hi', 'slug', 'is_active', 'base_unit', 'typical_price_range', 'display_order')
    list_filter = ('is_active',)
    search_fields = ('name_en', 'name_hi', 'slug')
    prepopulated_fields = {'slug': ('name_en',)}

@admin.register(ProviderService)
class ProviderServiceAdmin(admin.ModelAdmin):
    list_display = ('provider', 'category', 'title', 'base_rate', 'rate_unit', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('title', 'provider__username', 'provider__first_name')

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('target_user', 'reviewer', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('comment', 'target_user__username', 'reviewer__username')

@admin.register(AgriculturalReferenceRecord)
class AgriculturalReferenceRecordAdmin(admin.ModelAdmin):
    list_display = ('record_id', 'state', 'indicator', 'original_value', 'unit', 'reference_period', 'evidence_classification')
    list_filter = ('state', 'evidence_classification', 'indicator')
    search_fields = ('record_id', 'state', 'indicator', 'source_publisher')

@admin.register(HistoricalMachineryRate)
class HistoricalMachineryRateAdmin(admin.ModelAdmin):
    list_display = ('equipment_type', 'operation', 'state', 'historical_rate_min', 'historical_rate_max', 'rate_unit', 'reference_year')
    list_filter = ('state', 'reference_year', 'operation')
    search_fields = ('equipment_type', 'operation', 'source_reference')

@admin.register(HistoricalAgriculturalWage)
class HistoricalAgriculturalWageAdmin(admin.ModelAdmin):
    list_display = ('state', 'operation', 'reference_year', 'daily_wage_rate', 'gender_category')
    list_filter = ('state', 'reference_year', 'gender_category')
    search_fields = ('state', 'operation', 'source_reference')
