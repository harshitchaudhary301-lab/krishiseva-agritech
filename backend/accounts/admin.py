from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils import timezone
from .models import User, FarmerProfile, WorkerProfile, ProviderProfile, UserConsent, VerificationAuditLog

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
    list_display = ('user', 'skills', 'daily_wage_rate', 'is_available', 'verification_status', 'verified_at', 'rating')
    list_filter = ('verification_status', 'is_available')
    actions = ['verify_worker', 'suspend_worker', 'mark_unavailable']

    @admin.action(description="Verify selected workers (with audit record)")
    def verify_worker(self, request, queryset):
        now = timezone.now()
        for w in queryset:
            prev = w.verification_status
            w.verification_status = 'verified'
            w.verified_at = now
            w.verified_by = request.user
            w.save()
            VerificationAuditLog.objects.create(
                target_user=w.user,
                actor=request.user,
                action='verify',
                previous_status=prev,
                new_status='verified',
                reason='Administrative batch verification via Django Admin'
            )

    @admin.action(description="Suspend selected workers")
    def suspend_worker(self, request, queryset):
        now = timezone.now()
        for w in queryset:
            prev = w.verification_status
            w.verification_status = 'suspended'
            w.suspended_at = now
            w.suspension_reason = 'Administrative suspension via Django Admin'
            w.save()
            VerificationAuditLog.objects.create(
                target_user=w.user,
                actor=request.user,
                action='suspend',
                previous_status=prev,
                new_status='suspended',
                reason='Administrative suspension via Django Admin'
            )

    @admin.action(description="Mark unavailable")
    def mark_unavailable(self, request, queryset):
        queryset.update(is_available=False)

@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'business_name', 'service_categories', 'verification_status', 'verified_at', 'rating', 'completed_bookings_count')
    list_filter = ('verification_status', 'is_available')
    actions = ['verify_provider', 'suspend_provider']

    @admin.action(description="Verify selected providers (with audit record)")
    def verify_provider(self, request, queryset):
        now = timezone.now()
        for p in queryset:
            prev = p.verification_status
            p.verification_status = 'verified'
            p.verified_at = now
            p.verified_by = request.user
            p.save()
            VerificationAuditLog.objects.create(
                target_user=p.user,
                actor=request.user,
                action='verify',
                previous_status=prev,
                new_status='verified',
                reason='Administrative batch verification via Django Admin'
            )

    @admin.action(description="Suspend selected providers")
    def suspend_provider(self, request, queryset):
        now = timezone.now()
        for p in queryset:
            prev = p.verification_status
            p.verification_status = 'suspended'
            p.suspended_at = now
            p.suspension_reason = 'Administrative suspension via Django Admin'
            p.save()
            VerificationAuditLog.objects.create(
                target_user=p.user,
                actor=request.user,
                action='suspend',
                previous_status=prev,
                new_status='suspended',
                reason='Administrative suspension via Django Admin'
            )

@admin.register(UserConsent)
class UserConsentAdmin(admin.ModelAdmin):
    list_display = ('user', 'terms_version', 'terms_accepted', 'privacy_accepted', 'timestamp')
    list_filter = ('terms_version', 'terms_accepted', 'privacy_accepted')
    search_fields = ('user__username',)

@admin.register(VerificationAuditLog)
class VerificationAuditLogAdmin(admin.ModelAdmin):
    list_display = ('target_user', 'actor', 'action', 'previous_status', 'new_status', 'timestamp')
    list_filter = ('action', 'new_status')
    search_fields = ('target_user__username', 'actor__username', 'reason')
    readonly_fields = ('target_user', 'actor', 'action', 'previous_status', 'new_status', 'reason', 'timestamp')
