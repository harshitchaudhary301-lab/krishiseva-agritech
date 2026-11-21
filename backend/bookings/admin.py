from django.contrib import admin
from .models import ServiceRequest, Quotation, Booking, BookingEvent, Complaint, Notification

class BookingEventInline(admin.TabularInline):
    model = BookingEvent
    extra = 0
    readonly_fields = ('actor', 'action', 'from_status', 'to_status', 'notes', 'timestamp')
    can_delete = False

@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'farmer', 'category', 'village', 'required_date', 'status', 'created_at')
    list_filter = ('status', 'category', 'district')
    search_fields = ('title', 'farmer__username', 'village', 'scope_quantity')

@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ('id', 'request', 'provider', 'quote_amount', 'proposed_schedule', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('provider__username', 'request__title')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('reference_id', 'farmer', 'provider', 'agreed_amount', 'scheduled_date', 'status', 'created_at')
    list_filter = ('status', 'scheduled_date')
    search_fields = ('reference_id', 'farmer__username', 'provider__username')
    inlines = [BookingEventInline]

@admin.register(BookingEvent)
class BookingEventAdmin(admin.ModelAdmin):
    list_display = ('booking', 'actor', 'action', 'from_status', 'to_status', 'timestamp')
    list_filter = ('action', 'to_status')
    search_fields = ('booking__reference_id', 'notes')

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'reported_by', 'title', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('title', 'description', 'booking__reference_id')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'title', 'is_read', 'created_at')
    list_filter = ('is_read',)
    search_fields = ('title', 'message', 'recipient__username')
