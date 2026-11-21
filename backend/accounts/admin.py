from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, FarmerProfile, WorkerProfile, ProviderProfile

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'get_full_name', 'role', 'phone', 'village', 'district', 'is_active', 'date_joined')
    list_filter = ('role', 'state', 'district', 'is_active')
    search_fields = ('username', 'first_name', 'last_name', 'phone', 'village')
    ordering = ('-date_joined',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('KrishiSeva Role & Location', {
            'fields': ('role', 'phone', 'state', 'district', 'village', 'profile_complete')
        }),
    )

@admin.register(FarmerProfile)
class FarmerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_land_acres', 'primary_crops', 'preferred_language')
    search_fields = ('user__username', 'primary_crops', 'user__village')

@admin.register(WorkerProfile)
class WorkerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'skills', 'daily_wage_rate', 'is_available', 'verification_status', 'rating')
    list_filter = ('verification_status', 'is_available')
    actions = ['verify_worker', 'mark_unavailable']

    @admin.action(description="Verify selected workers")
    def verify_worker(self, request, queryset):
        queryset.update(verification_status='verified')

    @admin.action(description="Mark unavailable")
    def mark_unavailable(self, request, queryset):
        queryset.update(is_available=False)

@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'business_name', 'service_categories', 'verification_status', 'rating', 'completed_bookings_count')
    list_filter = ('verification_status', 'is_available')
    actions = ['verify_provider']

    @admin.action(description="Verify selected providers")
    def verify_provider(self, request, queryset):
        queryset.update(verification_status='verified')
