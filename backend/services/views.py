from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Avg
from .models import (
    ServiceCategory, Village, ProviderService, Review,
    AgriculturalReferenceRecord, HistoricalMachineryRate, HistoricalAgriculturalWage,
    InstitutionalResource, State, District, SubDistrict, DevelopmentBlock, LocalBody, Ward,
    ProviderCoverageArea, ProviderResource, ProviderAvailabilityWindow
)
from .serializers import (
    ServiceCategorySerializer, VillageSerializer, ProviderServiceSerializer, ReviewSerializer,
    AgriculturalReferenceRecordSerializer, HistoricalMachineryRateSerializer, HistoricalAgriculturalWageSerializer,
    InstitutionalResourceSerializer, StateSerializer, DistrictSerializer, SubDistrictSerializer,
    DevelopmentBlockSerializer, LocalBodySerializer, WardSerializer,
    ProviderCoverageAreaSerializer, ProviderResourceSerializer, ProviderAvailabilityWindowSerializer
)
from .weather import get_weather_forecast
from accounts.models import User
from accounts.serializers import UserSerializer

class LocationStandardPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class StateListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = State.objects.all().order_by('name_en')
    serializer_class = StateSerializer
    pagination_class = None


class DistrictListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = DistrictSerializer
    pagination_class = None

    def get_queryset(self):
        qs = District.objects.all().select_related('state').order_by('name_en')
        state_id = self.request.query_params.get('state_id')
        state_code = self.request.query_params.get('state_code')
        state_name = self.request.query_params.get('state')
        search = self.request.query_params.get('search')
        if state_id:
            qs = qs.filter(state_id=state_id)
        elif state_code:
            qs = qs.filter(state__lgd_code=state_code)
        elif state_name:
            qs = qs.filter(state__name_en__iexact=state_name)

        if search:
            qs = qs.filter(name_en__icontains=search)
        return qs


class SubDistrictListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SubDistrictSerializer
    pagination_class = None

    def get_queryset(self):
        qs = SubDistrict.objects.all().select_related('district', 'district__state').order_by('name_en')
        district_id = self.request.query_params.get('district_id')
        district_code = self.request.query_params.get('district_code')
        district_name = self.request.query_params.get('district')
        search = self.request.query_params.get('search')
        if district_id:
            qs = qs.filter(district_id=district_id)
        elif district_code:
            qs = qs.filter(district__lgd_code=district_code)
        elif district_name:
            qs = qs.filter(district__name_en__iexact=district_name)

        if search:
            qs = qs.filter(name_en__icontains=search)
        return qs


class DevelopmentBlockListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = DevelopmentBlockSerializer
    pagination_class = None

    def get_queryset(self):
        qs = DevelopmentBlock.objects.all().select_related('district').order_by('name_en')
        district_id = self.request.query_params.get('district_id')
        district_code = self.request.query_params.get('district_code')
        district_name = self.request.query_params.get('district')
        search = self.request.query_params.get('search')
        if district_id:
            qs = qs.filter(district_id=district_id)
        elif district_code:
            qs = qs.filter(district__lgd_code=district_code)
        elif district_name:
            qs = qs.filter(district__name_en__iexact=district_name)

        if search:
            qs = qs.filter(name_en__icontains=search)
        return qs


class LocalBodyListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LocalBodySerializer
    pagination_class = LocationStandardPagination

    def get_queryset(self):
        qs = LocalBody.objects.all().select_related('state', 'district').order_by('name_en')
        state_id = self.request.query_params.get('state_id')
        district_id = self.request.query_params.get('district_id')
        body_type = self.request.query_params.get('type')
        parent_code = self.request.query_params.get('parent_code')
        search = self.request.query_params.get('search')

        if state_id:
            qs = qs.filter(state_id=state_id)
        if district_id:
            qs = qs.filter(district_id=district_id)
        if body_type:
            qs = qs.filter(local_body_type=body_type)
        if parent_code:
            qs = qs.filter(parent_local_body_code=parent_code)
        if search:
            qs = qs.filter(Q(name_en__icontains=search) | Q(name_local__icontains=search))
        return qs


class WardListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = WardSerializer
    pagination_class = LocationStandardPagination

    def get_queryset(self):
        qs = Ward.objects.all().select_related('local_body').order_by('ward_number')
        local_body_id = self.request.query_params.get('local_body_id')
        local_body_code = self.request.query_params.get('local_body_code')
        if local_body_id:
            qs = qs.filter(local_body_id=local_body_id)
        elif local_body_code:
            qs = qs.filter(local_body__lgd_code=local_body_code)
        return qs


class NationwideVillageListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = VillageSerializer
    pagination_class = LocationStandardPagination

    def get_queryset(self):
        qs = Village.objects.all().select_related('subdistrict', 'district_ref', 'state_ref').order_by('name')
        subdistrict_id = self.request.query_params.get('subdistrict_id')
        subdistrict_code = self.request.query_params.get('subdistrict_code')
        district_id = self.request.query_params.get('district_id')
        district_code = self.request.query_params.get('district_code')
        district_name = self.request.query_params.get('district')
        search = self.request.query_params.get('search')

        if subdistrict_id:
            qs = qs.filter(subdistrict_id=subdistrict_id)
        elif subdistrict_code:
            qs = qs.filter(subdistrict__lgd_code=subdistrict_code)

        if district_id:
            qs = qs.filter(district_ref_id=district_id)
        elif district_code:
            qs = qs.filter(district_ref__lgd_code=district_code)
        elif district_name:
            qs = qs.filter(district__iexact=district_name)

        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(name_local__icontains=search))

        if not (subdistrict_id or subdistrict_code or district_id or district_code or district_name or search):
            return qs.filter(district__iexact='Meerut')
        return qs


class LocationSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if len(query) < 2:
            return Response({'results': []})

        results = []
        # Search Districts
        districts = District.objects.filter(name_en__icontains=query).select_related('state')[:5]
        for d in districts:
            results.append({
                'type': 'district',
                'id': d.id,
                'lgd_code': d.lgd_code,
                'name': d.name_en,
                'name_local': d.name_local,
                'state_id': d.state_id,
                'state': d.state.name_en,
                'display': f"{d.name_en}, {d.state.name_en} (District)"
            })

        # Search SubDistricts
        subdistricts = SubDistrict.objects.filter(name_en__icontains=query).select_related('district', 'district__state')[:5]
        for sd in subdistricts:
            results.append({
                'type': 'subdistrict',
                'id': sd.id,
                'lgd_code': sd.lgd_code,
                'name': sd.name_en,
                'name_local': sd.name_local,
                'district_id': sd.district_id,
                'district': sd.district.name_en,
                'state_id': sd.district.state_id,
                'state': sd.district.state.name_en,
                'display': f"{sd.name_en} (Tehsil), {sd.district.name_en}, {sd.district.state.name_en}"
            })

        # Search Villages
        villages = Village.objects.filter(
            Q(name__icontains=query) | Q(name_local__icontains=query)
        ).select_related('subdistrict', 'district_ref', 'state_ref')[:15]

        for v in villages:
            results.append({
                'type': 'village',
                'id': v.id,
                'lgd_code': v.lgd_code,
                'name': v.name,
                'name_local': v.name_local,
                'subdistrict_id': v.subdistrict_id,
                'subdistrict': v.subdistrict.name_en if v.subdistrict else '',
                'district_id': v.district_ref_id,
                'district': v.district or (v.district_ref.name_en if v.district_ref else ''),
                'state_id': v.state_ref_id,
                'state': v.state or (v.state_ref.name_en if v.state_ref else ''),
                'pincode': v.pincode,
                'display': f"{v.name}" + (f" ({v.name_local})" if v.name_local else "") + f", {v.district}, {v.state}"
            })

        return Response({'results': results})


class LocationValidateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        state_id = request.data.get('state_id')
        district_id = request.data.get('district_id')
        subdistrict_id = request.data.get('subdistrict_id')
        village_id = request.data.get('village_id')
        village_name = request.data.get('village_name', '').strip()
        is_unverified = request.data.get('is_unverified', False)
        unverified_details = request.data.get('unverified_details', '')

        errors = []
        state_obj = None
        district_obj = None
        subdistrict_obj = None
        village_obj = None

        if state_id:
            try:
                state_obj = State.objects.get(id=state_id)
            except State.DoesNotExist:
                errors.append("Selected State does not exist in the official directory.")

        if district_id:
            try:
                district_obj = District.objects.get(id=district_id)
                if state_obj and district_obj.state_id != state_obj.id:
                    errors.append(f"District '{district_obj.name_en}' does not belong to State '{state_obj.name_en}'.")
            except District.DoesNotExist:
                errors.append("Selected District does not exist in the official directory.")

        if subdistrict_id:
            try:
                subdistrict_obj = SubDistrict.objects.get(id=subdistrict_id)
                if district_obj and subdistrict_obj.district_id != district_obj.id:
                    errors.append(f"Sub-district '{subdistrict_obj.name_en}' does not belong to District '{district_obj.name_en}'.")
            except SubDistrict.DoesNotExist:
                errors.append("Selected Sub-district does not exist in the official directory.")

        if is_unverified:
            if not village_name:
                errors.append("Village name is required for unverified manual location.")
            if not district_obj:
                errors.append("District selection is required even when entering an unverified village.")
        elif village_id:
            try:
                village_obj = Village.objects.get(id=village_id)
                if subdistrict_obj and village_obj.subdistrict_id and village_obj.subdistrict_id != subdistrict_obj.id:
                    errors.append(f"Village '{village_obj.name}' is registered under a different Sub-district.")
                if district_obj and village_obj.district_ref_id and village_obj.district_ref_id != district_obj.id:
                    errors.append(f"Village '{village_obj.name}' does not belong to District '{district_obj.name_en}'.")
            except Village.DoesNotExist:
                errors.append("Selected Village does not exist in the official directory.")

        if errors:
            return Response({'valid': False, 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'valid': True,
            'is_unverified': is_unverified,
            'hierarchy': {
                'state': {
                    'id': state_obj.id if state_obj else None,
                    'lgd_code': state_obj.lgd_code if state_obj else None,
                    'name': state_obj.name_en if state_obj else None,
                },
                'district': {
                    'id': district_obj.id if district_obj else None,
                    'lgd_code': district_obj.lgd_code if district_obj else None,
                    'name': district_obj.name_en if district_obj else None,
                },
                'subdistrict': {
                    'id': subdistrict_obj.id if subdistrict_obj else None,
                    'lgd_code': subdistrict_obj.lgd_code if subdistrict_obj else None,
                    'name': subdistrict_obj.name_en if subdistrict_obj else None,
                },
                'village': {
                    'id': village_obj.id if village_obj else None,
                    'lgd_code': village_obj.lgd_code if village_obj else None,
                    'name': village_obj.name if village_obj else village_name,
                    'is_unverified': is_unverified,
                    'unverified_details': unverified_details if is_unverified else None
                }
            }
        })


class CategoryListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = ServiceCategory.objects.all().order_by('display_order', 'id')
    serializer_class = ServiceCategorySerializer
    pagination_class = None


class VillageListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = VillageSerializer
    pagination_class = None

    def get_queryset(self):
        district = self.request.query_params.get('district')
        search = self.request.query_params.get('search')
        qs = Village.objects.all().order_by('name')
        if district:
            qs = qs.filter(district__iexact=district)
        if search:
            qs = qs.filter(name__icontains=search)
        if not district and not search:
            qs = qs.filter(district__iexact='Meerut')
        return qs[:100]


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

        # District & State filter
        district = request.query_params.get('district')
        state = request.query_params.get('state')
        if district:
            qs = qs.filter(district__iexact=district)
        if state:
            qs = qs.filter(state__iexact=state)

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


class ProviderCoverageAreaListCreateView(APIView):
    """
    Allows verified providers to view and register explicit LGD coverage areas.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        coverages = ProviderCoverageArea.objects.filter(provider=request.user).select_related(
            'state', 'district', 'subdistrict', 'village'
        )
        return Response(ProviderCoverageAreaSerializer(coverages, many=True).data)

    def post(self, request):
        user = request.user
        if not (user.is_provider() or user.is_worker() or user.is_admin_role()):
            return Response({'error': 'Only providers or workers can configure coverage areas.'}, status=status.HTTP_403_FORBIDDEN)
        if (hasattr(user, 'provider_profile') and user.provider_profile.is_suspended()) or (hasattr(user, 'worker_profile') and user.worker_profile.is_suspended()):
            return Response({'error': 'Suspended accounts cannot modify coverage areas.'}, status=status.HTTP_403_FORBIDDEN)

        coverage_level = request.data.get('coverage_level', 'village')
        state_id = request.data.get('state_id')
        district_id = request.data.get('district_id')
        subdistrict_id = request.data.get('subdistrict_id')
        village_id = request.data.get('village_id')
        includes_subordinates = request.data.get('includes_subordinates', True)

        state_obj = State.objects.filter(pk=state_id).first() if state_id else None
        district_obj = District.objects.filter(pk=district_id).first() if district_id else None
        subdistrict_obj = SubDistrict.objects.filter(pk=subdistrict_id).first() if subdistrict_id else None
        village_obj = Village.objects.filter(pk=village_id).first() if village_id else None

        if village_obj:
            if not subdistrict_obj and village_obj.subdistrict:
                subdistrict_obj = village_obj.subdistrict
            if not district_obj and village_obj.district_ref:
                district_obj = village_obj.district_ref
            if not state_obj and village_obj.state_ref:
                state_obj = village_obj.state_ref
        elif subdistrict_obj:
            if not district_obj and subdistrict_obj.district:
                district_obj = subdistrict_obj.district
            if not state_obj and subdistrict_obj.district and subdistrict_obj.district.state:
                state_obj = subdistrict_obj.district.state
        elif district_obj:
            if not state_obj and district_obj.state:
                state_obj = district_obj.state

        coverage, created = ProviderCoverageArea.objects.get_or_create(
            provider=user,
            coverage_level=coverage_level,
            state=state_obj,
            district=district_obj,
            subdistrict=subdistrict_obj,
            village=village_obj,
            defaults={'includes_subordinates': bool(includes_subordinates), 'is_active': True}
        )
        if not created:
            coverage.includes_subordinates = bool(includes_subordinates)
            coverage.is_active = True
            coverage.save()

        return Response(ProviderCoverageAreaSerializer(coverage).data, status=status.HTTP_201_CREATED)


class ProviderCoverageAreaDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        cov = get_object_or_404(ProviderCoverageArea, pk=pk, provider=request.user)
        cov.delete()
        return Response({'message': 'Coverage area removed.'}, status=status.HTTP_204_NO_CONTENT)


class ProviderResourceListCreateView(APIView):
    """
    Allows providers to register exclusive and shared resources and declare capacity.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        resources = ProviderResource.objects.filter(provider=request.user).select_related('category')
        return Response(ProviderResourceSerializer(resources, many=True).data)

    def post(self, request):
        user = request.user
        if not (user.is_provider() or user.is_worker() or user.is_admin_role()):
            return Response({'error': 'Only providers or workers can configure resources.'}, status=status.HTTP_403_FORBIDDEN)
        if (hasattr(user, 'provider_profile') and user.provider_profile.is_suspended()) or (hasattr(user, 'worker_profile') and user.worker_profile.is_suspended()):
            return Response({'error': 'Suspended accounts cannot register resources.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ProviderResourceSerializer(data=request.data)
        if serializer.is_valid():
            res = serializer.save(provider=user)
            return Response(ProviderResourceSerializer(res).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProviderResourceDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        res = get_object_or_404(ProviderResource, pk=pk, provider=request.user)
        serializer = ProviderResourceSerializer(res, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(ProviderResourceSerializer(updated).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        res = get_object_or_404(ProviderResource, pk=pk, provider=request.user)
        res.delete()
        return Response({'message': 'Resource deleted.'}, status=status.HTTP_204_NO_CONTENT)


class ProviderAvailabilityWindowListCreateView(APIView):
    """
    Allows providers to register scheduled availability windows or declare blackouts.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        windows = ProviderAvailabilityWindow.objects.filter(provider=request.user).select_related('resource')
        return Response(ProviderAvailabilityWindowSerializer(windows, many=True).data)

    def post(self, request):
        user = request.user
        if not (user.is_provider() or user.is_worker() or user.is_admin_role()):
            return Response({'error': 'Only providers or workers can configure availability windows.'}, status=status.HTTP_403_FORBIDDEN)
        if (hasattr(user, 'provider_profile') and user.provider_profile.is_suspended()) or (hasattr(user, 'worker_profile') and user.worker_profile.is_suspended()):
            return Response({'error': 'Suspended accounts cannot configure availability windows.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ProviderAvailabilityWindowSerializer(data=request.data)
        if serializer.is_valid():
            window = serializer.save(provider=user)
            return Response(ProviderAvailabilityWindowSerializer(window).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProviderAvailabilityWindowDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        window = get_object_or_404(ProviderAvailabilityWindow, pk=pk, provider=request.user)
        window.delete()
        return Response({'message': 'Availability window deleted.'}, status=status.HTTP_204_NO_CONTENT)


class ProviderServiceManageView(APIView):
    """
    Manage services offered by provider, including pricing method and decimal price amounts.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        services = ProviderService.objects.filter(provider=request.user).select_related('category')
        return Response(ProviderServiceSerializer(services, many=True).data)

    def post(self, request):
        user = request.user
        if not (user.is_provider() or user.is_worker() or user.is_admin_role()):
            return Response({'error': 'Only providers or workers can configure services.'}, status=status.HTTP_403_FORBIDDEN)
        if (hasattr(user, 'provider_profile') and user.provider_profile.is_suspended()) or (hasattr(user, 'worker_profile') and user.worker_profile.is_suspended()):
            return Response({'error': 'Suspended accounts cannot manage service offerings.'}, status=status.HTTP_403_FORBIDDEN)
        category_id = request.data.get('category_id') or request.data.get('category')
        category = get_object_or_404(ServiceCategory, pk=category_id)

        title = request.data.get('title') or f"{category.name_en} Service"
        description = request.data.get('description', '')
        pricing_method = request.data.get('pricing_method', 'per_day')
        base_rate = request.data.get('price_amount') or request.data.get('base_rate', 0.0)
        rate_unit = request.data.get('rate_unit', 'per day')
        equipment_models = request.data.get('equipment_models', '')

        service, created = ProviderService.objects.update_or_create(
            provider=user,
            category=category,
            defaults={
                'title': title,
                'description': description,
                'pricing_method': pricing_method,
                'price_amount': base_rate,
                'base_rate': base_rate,
                'rate_unit': rate_unit,
                'equipment_models': equipment_models,
                'is_active': True
            }
        )
        return Response(ProviderServiceSerializer(service).data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

