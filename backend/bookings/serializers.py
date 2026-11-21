from rest_framework import serializers
from .models import ServiceRequest, Quotation, Booking, BookingEvent, Complaint, Notification
from services.serializers import ServiceCategorySerializer
from accounts.serializers import UserSerializer

class QuotationSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.get_full_name', read_only=True)
    provider_username = serializers.CharField(source='provider.username', read_only=True)
    provider_phone = serializers.CharField(source='provider.phone', read_only=True)
    provider_village = serializers.CharField(source='provider.village', read_only=True)
    provider_rating = serializers.SerializerMethodField()
    provider_completed_jobs = serializers.SerializerMethodField()

    class Meta:
        model = Quotation
        fields = [
            'id', 'request', 'provider', 'provider_name', 'provider_username',
            'provider_phone', 'provider_village', 'provider_rating',
            'provider_completed_jobs', 'quote_amount', 'price_breakdown',
            'notes', 'proposed_schedule', 'status', 'created_at'
        ]
        read_only_fields = ['provider', 'created_at']

    def get_provider_rating(self, obj):
        if hasattr(obj.provider, 'worker_profile'):
            return float(obj.provider.worker_profile.rating)
        elif hasattr(obj.provider, 'provider_profile'):
            return float(obj.provider.provider_profile.rating)
        return 4.8

    def get_provider_completed_jobs(self, obj):
        if hasattr(obj.provider, 'worker_profile'):
            return obj.provider.worker_profile.completed_jobs_count
        elif hasattr(obj.provider, 'provider_profile'):
            return obj.provider.provider_profile.completed_bookings_count
        return 0


class ServiceRequestSerializer(serializers.ModelSerializer):
    category_details = ServiceCategorySerializer(source='category', read_only=True)
    farmer_name = serializers.CharField(source='farmer.get_full_name', read_only=True)
    farmer_phone = serializers.CharField(source='farmer.phone', read_only=True)
    quotations_count = serializers.IntegerField(source='quotations.count', read_only=True)
    quotations = QuotationSerializer(many=True, read_only=True)
    project_name = serializers.CharField(source='farm_project.name', read_only=True)

    class Meta:
        model = ServiceRequest
        fields = [
            'id', 'farmer', 'farmer_name', 'farmer_phone', 'category',
            'category_details', 'farm_project', 'project_name', 'title',
            'description', 'village', 'district', 'state', 'required_date',
            'scope_quantity', 'budget_max', 'status', 'quotations_count',
            'quotations', 'created_at', 'updated_at'
        ]
        read_only_fields = ['farmer', 'status', 'created_at', 'updated_at']


class BookingEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.get_full_name', read_only=True)

    class Meta:
        model = BookingEvent
        fields = ['id', 'actor', 'actor_name', 'action', 'from_status', 'to_status', 'notes', 'timestamp']


class BookingSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source='farmer.get_full_name', read_only=True)
    farmer_phone = serializers.CharField(source='farmer.phone', read_only=True)
    farmer_village = serializers.CharField(source='farmer.village', read_only=True)
    provider_name = serializers.CharField(source='provider.get_full_name', read_only=True)
    provider_phone = serializers.CharField(source='provider.phone', read_only=True)
    provider_village = serializers.CharField(source='provider.village', read_only=True)
    category_name = serializers.CharField(source='request.category.name_en', read_only=True)
    category_slug = serializers.CharField(source='request.category.slug', read_only=True)
    request_title = serializers.CharField(source='request.title', read_only=True)
    request_scope = serializers.CharField(source='request.scope_quantity', read_only=True)
    events = BookingEventSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'reference_id', 'request', 'quotation', 'farmer',
            'farmer_name', 'farmer_phone', 'farmer_village',
            'provider', 'provider_name', 'provider_phone', 'provider_village',
            'category_name', 'category_slug', 'request_title', 'request_scope',
            'agreed_amount', 'scheduled_date', 'status', 'cancellation_reason',
            'completed_at', 'events', 'created_at', 'updated_at'
        ]
        read_only_fields = ['reference_id', 'farmer', 'provider', 'agreed_amount', 'scheduled_date', 'status', 'created_at', 'updated_at']


class ComplaintSerializer(serializers.ModelSerializer):
    reported_by_name = serializers.CharField(source='reported_by.get_full_name', read_only=True)
    booking_ref = serializers.CharField(source='booking.reference_id', read_only=True)

    class Meta:
        model = Complaint
        fields = ['id', 'booking', 'booking_ref', 'reported_by', 'reported_by_name', 'title', 'description', 'status', 'resolution_notes', 'created_at']
        read_only_fields = ['reported_by', 'status', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'link_url', 'is_read', 'created_at']
