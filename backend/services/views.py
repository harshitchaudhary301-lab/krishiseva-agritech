from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Avg
from .models import (
    ServiceCategory, Village, ProviderService, Review,
    AgriculturalReferenceRecord, HistoricalMachineryRate, HistoricalAgriculturalWage,
    InstitutionalResource
)
from .serializers import (
    ServiceCategorySerializer, VillageSerializer, ProviderServiceSerializer, ReviewSerializer,
    AgriculturalReferenceRecordSerializer, HistoricalMachineryRateSerializer, HistoricalAgriculturalWageSerializer,
    InstitutionalResourceSerializer
)
from .weather import get_weather_forecast
from accounts.models import User
from accounts.serializers import UserSerializer

class CategoryListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = ServiceCategory.objects.all().order_by('display_order', 'id')
    serializer_class = ServiceCategorySerializer
    pagination_class = None


class VillageListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = Village.objects.all().order_by('name')
    serializer_class = VillageSerializer
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        district = self.request.query_params.get('district')
        if district:
            qs = qs.filter(district__iexact=district)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        return qs


class ProviderDirectoryView(APIView):
    """
    Agricultural service provider and worker discovery endpoint.
    Filters by: category, village, verification status, declared availability.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        role = request.query_params.get('role', 'all')
        category_slug = request.query_params.get('category')
        village = request.query_params.get('village')
        verification_filter = request.query_params.get('verification')
        availability_only = request.query_params.get('available')

        qs = User.objects.filter(is_active=True).select_related('provider_profile', 'worker_profile')

        if role == 'worker':
            qs = qs.filter(role='worker')
        elif role == 'provider':
            qs = qs.filter(role='provider')
        else:
            qs = qs.filter(role__in=['worker', 'provider'])

        # Availability filter
        if availability_only in ['true', '1', 'yes']:
            qs = qs.filter(
                Q(worker_profile__is_available=True) |
                Q(provider_profile__is_available=True)
            )

        # Verification status filter
        if verification_filter:
            qs = qs.filter(
                Q(worker_profile__verification_status=verification_filter) |
                Q(provider_profile__verification_status=verification_filter)
            )

        # Village filter
        if village:
            qs = qs.filter(
                Q(village__iexact=village) |
                Q(provider_profile__service_villages__icontains=village)
            )

        # Category filter
        if category_slug:
            if category_slug == 'labour':
                qs = qs.filter(
                    Q(role='worker') |
                    Q(provider_profile__service_categories__icontains='labour') |
                    Q(services__category__slug='labour')
                )
            else:
                qs = qs.filter(
                    Q(provider_profile__service_categories__icontains=category_slug) |
                    Q(services__category__slug=category_slug)
                ).distinct()

        serializer = UserSerializer(qs, many=True)
        return Response(serializer.data)


class ReviewListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReviewSerializer

    def get_queryset(self):
        target_id = self.request.query_params.get('target_user')
        if target_id:
            return Review.objects.filter(target_user_id=target_id).order_by('-created_at')
        return Review.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        review = serializer.save(reviewer=self.request.user)
        target = review.target_user

        # Recalculate average rating
        avg_res = Review.objects.filter(target_user=target).aggregate(avg_score=Avg('rating'))
        new_avg = avg_res['avg_score']
        if new_avg is not None:
            if hasattr(target, 'worker_profile'):
                target.worker_profile.rating = round(new_avg, 2)
                target.worker_profile.save()
            elif hasattr(target, 'provider_profile'):
                target.provider_profile.rating = round(new_avg, 2)
                target.provider_profile.save()


class HistoricalMachineryRateListView(generics.ListAPIView):
    """
    Read-only historical machinery rental comparisons for farmer planning.
    STRICT RULE: Rates are benchmarks only and not live provider quotes.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = HistoricalMachineryRateSerializer
    pagination_class = None

    def get_queryset(self):
        qs = HistoricalMachineryRate.objects.all()
        operation = self.request.query_params.get('operation')
        equipment = self.request.query_params.get('equipment')
        district = self.request.query_params.get('district')
        if operation:
            qs = qs.filter(operation__icontains=operation)
        if equipment:
            qs = qs.filter(equipment_type__icontains=equipment)
        if district:
            qs = qs.filter(district__iexact=district)
        return qs


class HistoricalAgriculturalWageListView(generics.ListAPIView):
    """
    Read-only historical agricultural wage observations.
    STRICT RULE: Wages are benchmarks only and not agreed worker payments.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = HistoricalAgriculturalWageSerializer
    pagination_class = None

    def get_queryset(self):
        qs = HistoricalAgriculturalWage.objects.all()
        year = self.request.query_params.get('year')
        operation = self.request.query_params.get('operation')
        state = self.request.query_params.get('state')
        if year:
            qs = qs.filter(reference_year=year)
        if operation:
            qs = qs.filter(operation__icontains=operation)
        if state:
            qs = qs.filter(state__iexact=state)
        return qs


class AgriculturalReferenceRecordListView(generics.ListAPIView):
    """
    Canonical agricultural statistical reference records.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = AgriculturalReferenceRecordSerializer

    def get_queryset(self):
        qs = AgriculturalReferenceRecord.objects.all()
        state = self.request.query_params.get('state')
        indicator = self.request.query_params.get('indicator')
        crop = self.request.query_params.get('crop')
        if state:
            qs = qs.filter(state__iexact=state)
        if indicator:
            qs = qs.filter(indicator__icontains=indicator)
        if crop:
            qs = qs.filter(crop__icontains=crop)
        return qs


class InstitutionalResourceListView(generics.ListAPIView):
    """
    Module 12: Government & Institutional Connect
    Read-only public directory of official government schemes, KVKs, ICAR research centers, and portals.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = InstitutionalResourceSerializer
    pagination_class = None

    def get_queryset(self):
        qs = InstitutionalResource.objects.filter(is_verified=True)
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(Q(name_en__icontains=search) | Q(name_hi__icontains=search) | Q(description_en__icontains=search))
        return qs


class WeatherForecastView(APIView):
    """
    Module 05: Weather Intelligence
    Returns live weather conditions, 3-day forecast, and agro-advisories for a given latitude/longitude or district.
    Cached for 1 hour with robust offline fallback.
    STRICT RULE: Weather advisories do not automatically cancel confirmed bookings.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lat = request.query_params.get('lat') or request.query_params.get('latitude')
        lon = request.query_params.get('lon') or request.query_params.get('longitude')
        district = request.query_params.get('district', 'Meerut')
        weather_data = get_weather_forecast(latitude=lat, longitude=lon, district=district)
        return Response(weather_data)

