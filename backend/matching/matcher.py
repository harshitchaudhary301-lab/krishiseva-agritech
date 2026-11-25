"""
KrishiSeva Service Matching Engine (KS-DEV-SME-001)
Transparent, rule-based matching between farmer agricultural service requirements
and verified local service providers, machinery operators, and worker teams.

STRICT CONTRACT:
- Rule-based Python logic and Django ORM.
- Official LGD identifiers (State, District, SubDistrict, Village).
- Exclusive vs. shared resource capacity tracking with half-open intervals [start, end).
- Accurate result classification: ELIGIBLE, AVAILABILITY_UNKNOWN, UNAVAILABLE, WIDER_AREA_ALTERNATIVE.
- Clear separation between:
    1. Historical reference benchmarks (purely statistical reference).
    2. Provider indicative prices.
    3. Actual quotations.
    4. Farmer-approved booking amounts.
"""

import math
from datetime import date, timedelta
from decimal import Decimal
from django.db.models import Q
from django.utils import timezone

from accounts.models import User
from bookings.models import Booking, ResourceReservation, ServiceRequest
from services.models import (
    ServiceCategory, ProviderService, ProviderCoverageArea,
    ProviderResource, ProviderAvailabilityWindow,
    HistoricalMachineryRate, HistoricalAgriculturalWage,
    Village, SubDistrict, District, State
)
from farm_projects.models import Farm, Field


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Computes great-circle distance between two coordinates in kilometers.
    STRICT RULE: Distance is ONLY calculated when reliable numeric coordinates are available.
    Never calculates distance from village names.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    try:
        lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
        # Check valid ranges
        if not (-90 <= lat1 <= 90 and -90 <= lat2 <= 90 and -180 <= lon1 <= 180 and -180 <= lon2 <= 180):
            return None
        # Earth radius in km
        r = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (math.sin(d_lat / 2.0) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(d_lon / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return round(r * c, 2)
    except (TypeError, ValueError, ZeroDivisionError):
        return None


def half_open_intervals_overlap(start1, end1, start2, end2):
    """
    Evaluates whether two half-open intervals [start1, end1) and [start2, end2) overlap.
    Adjacent intervals where end1 == start2 DO NOT overlap.
    """
    return max(start1, start2) < min(end1, end2)


def resolve_delivery_location(location_input):
    """
    Resolves various delivery location specifications into confirmed official LGD objects.
    Input can be a Farm instance, dict with IDs or names, or explicit location identifiers.
    """
    resolved = {
        'farm': None,
        'field': None,
        'village': None,
        'subdistrict': None,
        'district': None,
        'state': None,
        'village_id': None,
        'village_lgd': None,
        'subdistrict_id': None,
        'subdistrict_lgd': None,
        'district_id': None,
        'district_lgd': None,
        'state_id': None,
        'state_lgd': None,
        'latitude': None,
        'longitude': None,
        'is_unverified': False,
        'display_name': '',
        'warning': None
    }

    if not location_input:
        return resolved

    # 1. Farm instance or dict with farm_id
    farm_obj = None
    if isinstance(location_input, Farm):
        farm_obj = location_input
    elif isinstance(location_input, dict) and location_input.get('farm_id'):
        farm_obj = Farm.objects.filter(pk=location_input['farm_id']).first()

    if farm_obj:
        resolved['farm'] = farm_obj
        resolved['latitude'] = farm_obj.latitude
        resolved['longitude'] = farm_obj.longitude
        resolved['display_name'] = f"{farm_obj.name} ({farm_obj.village}, {farm_obj.district})"

        # Resolve LGD village from farm
        if farm_obj.lgd_code and str(farm_obj.lgd_code).strip().isdigit():
            v = Village.objects.filter(lgd_code=int(farm_obj.lgd_code.strip())).first()
            if v:
                resolved['village'] = v
        if not resolved['village']:
            # Search by name in district
            v = Village.objects.filter(district__iexact=farm_obj.district, name__iexact=farm_obj.village).first()
            if v:
                resolved['village'] = v

        if not resolved['district']:
            d = District.objects.filter(name_en__iexact=farm_obj.district).first()
            if d:
                resolved['district'] = d
        if not resolved['state']:
            s = State.objects.filter(name_en__iexact=farm_obj.state).first()
            if s:
                resolved['state'] = s

    # 2. Field instance or field_id
    field_obj = None
    if isinstance(location_input, Field):
        field_obj = location_input
    elif isinstance(location_input, dict) and location_input.get('field_id'):
        field_obj = Field.objects.filter(pk=location_input['field_id']).first()

    if field_obj:
        resolved['field'] = field_obj
        if field_obj.latitude and field_obj.longitude:
            resolved['latitude'] = field_obj.latitude
            resolved['longitude'] = field_obj.longitude

    # 3. Explicit dictionary identifiers
    if isinstance(location_input, dict):
        if location_input.get('is_unverified'):
            resolved['is_unverified'] = True
            resolved['warning'] = "Delivery location entered manually without official LGD confirmation. Requires farmer confirmation."

        if location_input.get('latitude') and location_input.get('longitude'):
            resolved['latitude'] = location_input['latitude']
            resolved['longitude'] = location_input['longitude']

        v_id = location_input.get('village_id')
        v_lgd = location_input.get('village_lgd') or location_input.get('village_code')
        if v_id and str(v_id).isdigit():
            resolved['village'] = Village.objects.filter(pk=int(v_id)).select_related('subdistrict', 'district_ref', 'state_ref').first()
        elif v_lgd and str(v_lgd).isdigit():
            resolved['village'] = Village.objects.filter(lgd_code=int(v_lgd)).select_related('subdistrict', 'district_ref', 'state_ref').first()
        elif location_input.get('village_name'):
            v_name = location_input['village_name'].strip()
            dist_name = location_input.get('district_name') or location_input.get('district', '')
            if dist_name:
                resolved['village'] = Village.objects.filter(district__iexact=dist_name, name__iexact=v_name).first()
            if not resolved['village']:
                resolved['village'] = Village.objects.filter(name__iexact=v_name).first()

        sd_id = location_input.get('subdistrict_id')
        sd_lgd = location_input.get('subdistrict_lgd') or location_input.get('subdistrict_code')
        if sd_id and str(sd_id).isdigit():
            resolved['subdistrict'] = SubDistrict.objects.filter(pk=int(sd_id)).first()
        elif sd_lgd and str(sd_lgd).isdigit():
            resolved['subdistrict'] = SubDistrict.objects.filter(lgd_code=int(sd_lgd)).first()
        elif location_input.get('subdistrict_name'):
            resolved['subdistrict'] = SubDistrict.objects.filter(name_en__iexact=location_input['subdistrict_name'].strip()).first()

        d_id = location_input.get('district_id')
        d_lgd = location_input.get('district_lgd') or location_input.get('district_code')
        if d_id and str(d_id).isdigit():
            resolved['district'] = District.objects.filter(pk=int(d_id)).first()
        elif d_lgd and str(d_lgd).isdigit():
            resolved['district'] = District.objects.filter(lgd_code=int(d_lgd)).first()
        elif location_input.get('district_name') or location_input.get('district'):
            d_name = (location_input.get('district_name') or location_input.get('district')).strip()
            resolved['district'] = District.objects.filter(name_en__iexact=d_name).first()

        s_id = location_input.get('state_id')
        s_lgd = location_input.get('state_lgd') or location_input.get('state_code')
        if s_id and str(s_id).isdigit():
            resolved['state'] = State.objects.filter(pk=int(s_id)).first()
        elif s_lgd and str(s_lgd).isdigit():
            resolved['state'] = State.objects.filter(lgd_code=int(s_lgd)).first()
        elif location_input.get('state_name') or location_input.get('state'):
            s_name = (location_input.get('state_name') or location_input.get('state')).strip()
            resolved['state'] = State.objects.filter(name_en__iexact=s_name).first()

    # Backfill hierarchy from village if available
    v = resolved['village']
    if v:
        resolved['village_id'] = v.id
        resolved['village_lgd'] = v.lgd_code
        if v.latitude and v.longitude and not resolved['latitude']:
            resolved['latitude'] = v.latitude
            resolved['longitude'] = v.longitude
        if v.subdistrict and not resolved['subdistrict']:
            resolved['subdistrict'] = v.subdistrict
        if v.district_ref and not resolved['district']:
            resolved['district'] = v.district_ref
        if v.state_ref and not resolved['state']:
            resolved['state'] = v.state_ref
        if not resolved['display_name']:
            resolved['display_name'] = f"{v.name}, {v.district}"

    sd = resolved['subdistrict']
    if sd:
        resolved['subdistrict_id'] = sd.id
        resolved['subdistrict_lgd'] = sd.lgd_code
        if sd.district and not resolved['district']:
            resolved['district'] = sd.district
        if not resolved['display_name'] and not v:
            resolved['display_name'] = f"{sd.name_en} (Tehsil), {sd.district.name_en}"

    d = resolved['district']
    if d:
        resolved['district_id'] = d.id
        resolved['district_lgd'] = d.lgd_code
        if d.state and not resolved['state']:
            resolved['state'] = d.state
        if not resolved['display_name'] and not v and not sd:
            resolved['display_name'] = f"{d.name_en} District, {d.state.name_en}"

    s = resolved['state']
    if s:
        resolved['state_id'] = s.id
        resolved['state_lgd'] = s.lgd_code
        if not resolved['display_name'] and not v and not sd and not d:
            resolved['display_name'] = f"{s.name_en} State"

    return resolved


def evaluate_provider_coverage(provider, resolved_loc):
    """
    Evaluates whether a provider explicitly covers the specified delivery location.
    Checks explicit registered coverage areas (State, District, SubDistrict, Village).
    STRICT RULE: A district-level coverage declaration includes its valid subordinate locations
    only when the provider explicitly selects that coverage scope (includes_subordinates=True).
    Provider office location and service coverage remain separate.
    """
    result = {
        'has_confirmed_coverage': False,
        'coverage_level': None, # 'village', 'subdistrict', 'district', 'state'
        'specificity_score': 0, # 4 for village, 3 for subdistrict, 2 for district, 1 for state, 0 for wider/none
        'is_wider_area': False,
        'coverage_desc': '',
    }

    if resolved_loc.get('is_unverified'):
        result['is_wider_area'] = True
        result['coverage_desc'] = "Delivery location unverified. Eligibility cannot be confirmed until location is verified."
        return result

    target_v_id = resolved_loc.get('village_id')
    target_v_lgd = resolved_loc.get('village_lgd')
    target_sd_id = resolved_loc.get('subdistrict_id')
    target_d_id = resolved_loc.get('district_id')
    target_s_id = resolved_loc.get('state_id')

    # Query active coverage areas registered by this provider
    coverage_areas = list(ProviderCoverageArea.objects.filter(provider=provider, is_active=True))

    best_score = 0
    best_level = None
    best_desc = ""
    is_wider_candidate = False

    for ca in coverage_areas:
        # 1. Village level
        if ca.coverage_level == 'village' and ca.village_id:
            if target_v_id and ca.village_id == target_v_id:
                if 4 > best_score:
                    best_score = 4
                    best_level = 'village'
                    best_desc = f"Direct village coverage: {ca.village.name} (LGD: {ca.village.lgd_code})"
            elif target_v_lgd and ca.village.lgd_code == target_v_lgd:
                if 4 > best_score:
                    best_score = 4
                    best_level = 'village'
                    best_desc = f"Direct village coverage: {ca.village.name} (LGD: {ca.village.lgd_code})"

        # 2. Sub-district / Tehsil level
        elif ca.coverage_level == 'subdistrict' and ca.subdistrict_id:
            if target_sd_id and ca.subdistrict_id == target_sd_id:
                if ca.includes_subordinates:
                    if 3 > best_score:
                        best_score = 3
                        best_level = 'subdistrict'
                        best_desc = f"Confirmed tehsil coverage: {ca.subdistrict.name_en} (All constituent villages included)"
                else:
                    is_wider_candidate = True

        # 3. District level
        elif ca.coverage_level == 'district' and ca.district_id:
            if target_d_id and ca.district_id == target_d_id:
                if ca.includes_subordinates:
                    if 2 > best_score:
                        best_score = 2
                        best_level = 'district'
                        best_desc = f"Confirmed district coverage: {ca.district.name_en} (District-wide coverage scope)"
                else:
                    is_wider_candidate = True

        # 4. State level
        elif ca.coverage_level == 'state' and ca.state_id:
            if target_s_id and ca.state_id == target_s_id:
                if ca.includes_subordinates:
                    if 1 > best_score:
                        best_score = 1
                        best_level = 'state'
                        best_desc = f"State-wide coverage: {ca.state.name_en}"
                else:
                    is_wider_candidate = True

    # Fallback to legacy fields if provider has no formal coverage areas
    if not coverage_areas:
        prov_village = (provider.village or '').strip().lower()
        prov_district = (provider.district or '').strip().lower()
        target_v_name = (resolved_loc['village'].name if resolved_loc.get('village') else '').strip().lower()
        target_d_name = (resolved_loc['district'].name_en if resolved_loc.get('district') else '').strip().lower()

        covered_villages_text = ""
        if hasattr(provider, 'provider_profile'):
            covered_villages_text = (provider.provider_profile.service_villages or '').lower()

        if target_v_name and (target_v_name == prov_village or target_v_name in covered_villages_text):
            best_score = 4
            best_level = 'village'
            best_desc = f"Village coverage registered in profile ({resolved_loc['village'].name})"
        elif target_d_name and target_d_name == prov_district:
            is_wider_candidate = True
            best_desc = f"Operates in {provider.district} district (Delivery location coverage not confirmed)"

    if best_score > 0:
        result['has_confirmed_coverage'] = True
        result['coverage_level'] = best_level
        result['specificity_score'] = best_score
        result['coverage_desc'] = best_desc
    elif is_wider_candidate:
        result['is_wider_area'] = True
        result['coverage_desc'] = "Provider operates in nearby or wider administrative area, but coverage of this specific delivery location is not confirmed."
    else:
        cand_district = (provider.district or '').strip().lower()
        t_dist = (resolved_loc['district'].name_en if resolved_loc.get('district') else '').strip().lower()
        if cand_district and t_dist and cand_district == t_dist:
            result['is_wider_area'] = True
            result['coverage_desc'] = f"Provider base is in {provider.district} district; explicit delivery location coverage not confirmed."
        else:
            result['coverage_desc'] = "Provider does not cover this geographic location."

    return result


def check_resource_and_capacity_availability(
    provider,
    prov_service,
    start_date=None,
    end_date=None,
    quantity=None,
    unit=None,
    requested_resource_type=None
):
    """
    Evaluates provider scheduling windows, active booking reservations, and capacity.
    Uses half-open intervals [start, end) so adjacent reservations do not incorrectly overlap.
    For exclusive resources, rejects conflicting reservations.
    For shared resources, ensures total overlapping demand does not exceed confirmed capacity.
    """
    res = {
        'status': 'ELIGIBLE', # 'ELIGIBLE', 'AVAILABILITY_UNKNOWN', 'UNAVAILABLE'
        'reason': '',
        'resource_name': '',
        'resource_type': 'exclusive',
        'capacity_available': None,
        'capacity_unit': '',
        'earliest_available': None,
    }

    # Find provider's primary resource for this service
    resource = None
    if prov_service and prov_service.category:
        resource = ProviderResource.objects.filter(
            provider=provider,
            category=prov_service.category,
            is_active=True
        ).first()

    if not resource:
        resource = ProviderResource.objects.filter(provider=provider, is_active=True).first()

    if resource:
        res['resource_name'] = resource.name
        res['resource_type'] = resource.resource_type
        res['capacity_unit'] = resource.capacity_unit
        res['capacity_available'] = float(resource.capacity)
    else:
        res['resource_name'] = f"General Service ({provider.username})"
        res['resource_type'] = 'exclusive' if provider.role == 'provider' else 'shared'
        res['capacity_unit'] = 'job' if provider.role == 'provider' else 'labourer'
        res['capacity_available'] = 1.0 if provider.role == 'provider' else 5.0

    # If farmer did not provide a booking date, availability cannot be definitively established
    if not start_date:
        res['status'] = 'AVAILABILITY_UNKNOWN'
        res['reason'] = "No service date specified. Please provide a scheduled date to confirm exact availability."
        return res

    # Construct half-open interval [req_start, req_end)
    req_start = start_date
    if end_date and end_date > start_date:
        req_end = end_date
    else:
        req_end = req_start + timedelta(days=1)

    # 1. Check Blackout / Unavailable Windows
    blackouts = ProviderAvailabilityWindow.objects.filter(
        provider=provider,
        is_available=False
    )
    for b in blackouts:
        if half_open_intervals_overlap(req_start, req_end, b.start_date, b.end_date):
            res['status'] = 'UNAVAILABLE'
            res['reason'] = f"Provider declared unavailable during this window ({b.notes or 'Maintenance/Leave'})."
            return res

    # 2. Check Overlapping Active Bookings and Reservations
    active_statuses = ['confirmed', 'scheduled', 'in_progress', 'completion_pending']
    active_bookings = Booking.objects.filter(
        provider=provider,
        status__in=active_statuses
    )

    overlapping_bookings = []
    for bk in active_bookings:
        b_start = bk.confirmed_window_start or bk.scheduled_date
        b_end = (bk.confirmed_window_end or bk.scheduled_date) + timedelta(days=1)
        if half_open_intervals_overlap(req_start, req_end, b_start, b_end):
            overlapping_bookings.append(bk)

    # Exclusive resource evaluation
    is_exclusive = (res['resource_type'] == 'exclusive')
    if is_exclusive:
        if overlapping_bookings:
            res['status'] = 'UNAVAILABLE'
            conflict_dates = ", ".join([str(b.scheduled_date) for b in overlapping_bookings[:2]])
            res['reason'] = f"Exclusive machinery/provider already reserved on overlapping date(s): {conflict_dates} (BOOK-07)."
            return res
    else:
        # Shared resource capacity evaluation (BOOK-08)
        max_cap = Decimal(str(res['capacity_available'] or 1.0))
        req_qty = Decimal(str(quantity or 1.0))

        allocated_total = Decimal('0.00')
        active_res = ResourceReservation.objects.filter(
            provider=provider,
            is_active=True,
            booking__status__in=active_statuses
        )
        for r in active_res:
            r_start = r.date
            r_end = r.date + timedelta(days=1)
            if half_open_intervals_overlap(req_start, req_end, r_start, r_end):
                allocated_total += Decimal(str(r.allocated_quantity or 1))

        remaining_capacity = max(max_cap - allocated_total, Decimal('0.00'))
        res['capacity_available'] = float(remaining_capacity)

        if remaining_capacity < req_qty:
            res['status'] = 'UNAVAILABLE'
            res['reason'] = f"Insufficient capacity: requested {req_qty} {res['capacity_unit']}, but only {remaining_capacity} remaining (BOOK-08)."
            return res

    # 3. Check Positive Scheduling Windows
    positive_windows = ProviderAvailabilityWindow.objects.filter(
        provider=provider,
        is_available=True
    )
    if positive_windows.exists():
        has_matching_window = False
        for pw in positive_windows:
            if pw.start_date <= req_start and req_end <= pw.end_date:
                has_matching_window = True
                break
        if not has_matching_window:
            res['status'] = 'AVAILABILITY_UNKNOWN'
            res['reason'] = "Provider operates outside their declared primary scheduling window on this date."
            return res

    if hasattr(provider, 'provider_profile') and not provider.provider_profile.is_available:
        res['status'] = 'UNAVAILABLE'
        res['reason'] = "Provider has set their operational status to temporarily unavailable."
        return res
    if hasattr(provider, 'worker_profile') and not provider.worker_profile.is_available:
        res['status'] = 'UNAVAILABLE'
        res['reason'] = "Worker has set their operational status to temporarily unavailable."
        return res

    res['status'] = 'ELIGIBLE'
    res['reason'] = "Confirmed resource availability and capacity within requested scheduling window."
    return res


def get_historical_reference_benchmark(category_slug, district_name='Meerut', state_name='Uttar Pradesh'):
    """
    Retrieves official historical reference benchmarks for the requested category.
    STRICT RULE: Historical rates are purely reference benchmarks and must NEVER become confirmed provider quotations.
    Clearly distinguishes reference benchmarks from live commercial proposals.
    """
    if category_slug in ['machinery_rental', 'tractor_mechanic', 'land_preparation', 'harvesting', 'sec-tillage', 'sowing_planting']:
        ref = HistoricalMachineryRate.objects.filter(
            Q(district__iexact=district_name) | Q(state__iexact=state_name)
        ).first()
        if ref:
            return {
                'equipment_type': ref.equipment_type,
                'operation': ref.operation,
                'min_price': float(ref.historical_rate_min),
                'max_price': float(ref.historical_rate_max),
                'rate_unit': ref.rate_unit,
                'reference_year': ref.reference_year,
                'source': ref.source_reference,
                'disclaimer': ref.disclaimer,
                'is_reference_only': True
            }

    if category_slug == 'labour':
        wage = HistoricalAgriculturalWage.objects.filter(
            Q(district__iexact=district_name) | Q(state__iexact=state_name)
        ).order_by('-reference_year').first()
        if wage:
            return {
                'operation': wage.operation,
                'daily_wage_rate': float(wage.daily_wage_rate),
                'rate_unit': 'per day',
                'reference_year': wage.reference_year,
                'source': wage.source_reference,
                'disclaimer': wage.disclaimer,
                'is_reference_only': True
            }

    return None


def match_service_providers(
    location=None,
    category=None,
    start_date=None,
    end_date=None,
    start_time=None,
    end_time=None,
    quantity=None,
    unit=None,
    resource_type=None,
    sort_by='default'
):
    """
    One reusable backend matching service executing the exact 8-step execution sequence:
    1. Validate selected location and service category.
    2. Find providers offering requested service.
    3. Exclude unverified, suspended and ineligible providers.
    4. Check explicitly registered geographic coverage.
    5. Check compatible service and capacity units.
    6. Check scheduling windows.
    7. Subtract capacity reserved by overlapping active bookings.
    8. Classify and sort the results.

    Result classifications:
    - ELIGIBLE: Provider covers location and satisfies schedule & capacity.
    - AVAILABILITY_UNKNOWN: Provider covers location, but scheduling info/details insufficient.
    - UNAVAILABLE: Provider covers location but cannot fulfil schedule or capacity.
    - WIDER_AREA_ALTERNATIVE: Provider operates in wider area, coverage not confirmed.
    """
    # Step 1: Validate location and service category
    resolved_loc = resolve_delivery_location(location)

    category_obj = None
    if isinstance(category, ServiceCategory):
        category_obj = category
    elif category:
        category_obj = (
            ServiceCategory.objects.filter(slug=category).first() or
            ServiceCategory.objects.filter(pk=category if str(category).isdigit() else None).first()
        )

    if not category_obj:
        return {
            'error': 'Invalid or missing service category.',
            'category': None,
            'location': resolved_loc['display_name'],
            'total_matches': 0,
            'eligible_count': 0,
            'results': []
        }

    category_slug = category_obj.slug
    is_labour = (category_slug == 'labour')

    # Parse date strings if passed as strings
    if isinstance(start_date, str) and start_date.strip():
        try:
            start_date = date.fromisoformat(start_date.strip())
        except ValueError:
            start_date = None
    if isinstance(end_date, str) and end_date.strip():
        try:
            end_date = date.fromisoformat(end_date.strip())
        except ValueError:
            end_date = None

    if quantity is not None:
        try:
            quantity = float(quantity)
        except (ValueError, TypeError):
            quantity = None

    # Step 2: Find candidate providers offering the requested service
    target_roles = ['worker', 'provider'] if is_labour else ['provider']
    candidates = User.objects.filter(role__in=target_roles, is_active=True).select_related(
        'provider_profile', 'worker_profile'
    ).prefetch_related('services', 'coverage_areas', 'resources', 'availability_windows')

    historical_benchmark = get_historical_reference_benchmark(
        category_slug,
        district_name=resolved_loc['district'].name_en if resolved_loc.get('district') else 'Meerut',
        state_name=resolved_loc['state'].name_en if resolved_loc.get('state') else 'Uttar Pradesh'
    )

    classified_results = []

    for candidate in candidates:
        # Step 3: Exclude unverified, suspended and ineligible providers
        is_worker = (candidate.role == 'worker')
        if is_worker:
            w_prof = getattr(candidate, 'worker_profile', None)
            if not w_prof or not w_prof.is_verified() or w_prof.is_suspended():
                continue
            rating = float(w_prof.rating or 4.5)
            completed_jobs = w_prof.completed_jobs_count
            business_name = candidate.get_full_name() or candidate.username
            bio = w_prof.bio or f"Experienced agricultural worker: {w_prof.skills}"
            indicative_price = float(w_prof.daily_wage_rate or 500.0)
            pricing_method = 'per_day'
            rate_unit = 'per day'
            service_title = "Agricultural Field Labour Team"
            prov_service = candidate.services.filter(category=category_obj, is_active=True).first()
            if prov_service:
                indicative_price = float(prov_service.price_amount or prov_service.base_rate)
                pricing_method = prov_service.pricing_method
                rate_unit = prov_service.rate_unit
                service_title = prov_service.title
        else:
            p_prof = getattr(candidate, 'provider_profile', None)
            if not p_prof or not p_prof.is_verified() or p_prof.is_suspended():
                continue

            # Check if provider offers this category
            prov_service = candidate.services.filter(category=category_obj, is_active=True).first()
            offers_category = False
            if prov_service:
                offers_category = True
                service_title = prov_service.title
                indicative_price = float(prov_service.price_amount or prov_service.base_rate)
                pricing_method = prov_service.pricing_method
                rate_unit = prov_service.rate_unit
            elif category_slug in (p_prof.service_categories or '').lower():
                offers_category = True
                service_title = f"{category_obj.name_en} Service"
                indicative_price = 1200.0
                pricing_method = 'per_day'
                rate_unit = 'per day'

            if not offers_category:
                continue

            rating = float(p_prof.rating or 4.8)
            completed_jobs = p_prof.completed_bookings_count
            business_name = p_prof.business_name or candidate.get_full_name() or candidate.username
            bio = p_prof.bio or p_prof.machinery_details or "Verified agricultural equipment provider."

        # Step 4: Check explicitly registered geographic coverage
        cov_eval = evaluate_provider_coverage(candidate, resolved_loc)

        # Step 5: Check compatible service and capacity units
        unit_compatible = True
        unit_note = ""
        if unit:
            u_clean = unit.strip().lower()
            if u_clean in ['acre', 'acres'] and pricing_method not in ['per_acre', 'quotation_required', 'fixed']:
                unit_compatible = False
                unit_note = f"Provider rates in {rate_unit}, which may differ from requested {unit}."
            elif u_clean in ['day', 'days'] and pricing_method not in ['per_day', 'per_hour', 'quotation_required', 'fixed']:
                unit_compatible = False
                unit_note = f"Provider rates in {rate_unit}, which may differ from requested {unit}."

        # Step 6 & 7: Check scheduling windows and subtract capacity reserved by active bookings
        sched_eval = check_resource_and_capacity_availability(
            provider=candidate,
            prov_service=prov_service,
            start_date=start_date,
            end_date=end_date,
            quantity=quantity,
            unit=unit,
            requested_resource_type=resource_type
        )

        # Step 8: Classify results
        if cov_eval['is_wider_area']:
            classification = 'WIDER_AREA_ALTERNATIVE'
        elif not cov_eval['has_confirmed_coverage']:
            continue
        elif sched_eval['status'] == 'UNAVAILABLE':
            classification = 'UNAVAILABLE'
        elif sched_eval['status'] == 'AVAILABILITY_UNKNOWN':
            classification = 'AVAILABILITY_UNKNOWN'
        else:
            classification = 'ELIGIBLE'

        dist_km = haversine_distance(
            resolved_loc.get('latitude'),
            resolved_loc.get('longitude'),
            getattr(candidate, 'latitude', None) or getattr(resolved_loc.get('village'), 'latitude', None),
            getattr(candidate, 'longitude', None) or getattr(resolved_loc.get('village'), 'longitude', None)
        )

        match_reasons = []
        if classification == 'ELIGIBLE':
            match_reasons.append("Verified and active provider")
            match_reasons.append(cov_eval['coverage_desc'])
            match_reasons.append("Resource and schedule availability confirmed")
        elif classification == 'AVAILABILITY_UNKNOWN':
            match_reasons.append(cov_eval['coverage_desc'])
            match_reasons.append("Schedule details needed to confirm exact delivery booking")
        elif classification == 'WIDER_AREA_ALTERNATIVE':
            match_reasons.append(cov_eval['coverage_desc'])
            match_reasons.append("Alternative provider in neighboring administrative jurisdiction")
        else:
            match_reasons.append(sched_eval['reason'])

        classified_results.append({
            'provider_id': candidate.id,
            'name': candidate.get_full_name() or candidate.username,
            'business_name': business_name,
            'role': candidate.role,
            'phone': candidate.phone if classification in ['ELIGIBLE', 'AVAILABILITY_UNKNOWN'] else '',
            'village': candidate.village,
            'district': candidate.district,
            'state': candidate.state,
            'service_title': service_title,
            'matching_status': classification,
            'coverage': {
                'level': cov_eval['coverage_level'],
                'specificity_score': cov_eval['specificity_score'],
                'description': cov_eval['coverage_desc'],
                'has_confirmed_coverage': cov_eval['has_confirmed_coverage']
            },
            'availability': {
                'status': sched_eval['status'],
                'reason': sched_eval['reason'],
                'resource_name': sched_eval['resource_name'],
                'resource_type': sched_eval['resource_type'],
                'capacity_remaining': sched_eval['capacity_available'],
                'capacity_unit': sched_eval['capacity_unit'],
            },
            'pricing': {
                'pricing_method': pricing_method,
                'indicative_price': indicative_price,
                'rate_unit': rate_unit,
                'formatted': f"₹{indicative_price:,.2f} {rate_unit}" if pricing_method != 'quotation_required' else 'Quotation Required',
                'is_binding': False,
                'price_type_notice': 'Provider indicative price. Actual quotation and binding booking amount are determined upon proposal acceptance.'
            },
            'historical_benchmark': historical_benchmark,
            'unit_compatibility': {
                'compatible': unit_compatible,
                'note': unit_note
            },
            'distance_km': dist_km,
            'rating': rating,
            'completed_jobs': completed_jobs,
            'bio': bio,
            'match_reasons': match_reasons,
        })

    # Sorting
    status_order = {
        'ELIGIBLE': 1,
        'AVAILABILITY_UNKNOWN': 2,
        'WIDER_AREA_ALTERNATIVE': 3,
        'UNAVAILABLE': 4
    }

    def sort_key(item):
        s_rank = status_order.get(item['matching_status'], 5)
        cov_rank = -item['coverage']['specificity_score']

        price_val = 0.0
        if sort_by == 'price_asc':
            price_val = item['pricing']['indicative_price']
        elif sort_by == 'price_desc':
            price_val = -item['pricing']['indicative_price']
        elif sort_by == 'distance':
            price_val = item['distance_km'] if item['distance_km'] is not None else 99999.0

        provider_id = item['provider_id']
        return (s_rank, cov_rank, price_val, provider_id)

    classified_results.sort(key=sort_key)

    eligible_count = sum(1 for r in classified_results if r['matching_status'] == 'ELIGIBLE')
    avail_unknown_count = sum(1 for r in classified_results if r['matching_status'] == 'AVAILABILITY_UNKNOWN')
    wider_count = sum(1 for r in classified_results if r['matching_status'] == 'WIDER_AREA_ALTERNATIVE')
    unavail_count = sum(1 for r in classified_results if r['matching_status'] == 'UNAVAILABLE')

    return {
        'category': {
            'id': category_obj.id,
            'slug': category_obj.slug,
            'name_en': category_obj.name_en,
            'name_hi': category_obj.name_hi,
            'base_unit': category_obj.base_unit,
            'typical_price_range': category_obj.typical_price_range
        },
        'delivery_location': {
            'display_name': resolved_loc['display_name'],
            'village_id': resolved_loc['village_id'],
            'village_lgd': resolved_loc['village_lgd'],
            'district_id': resolved_loc['district_id'],
            'district_name': resolved_loc['district'].name_en if resolved_loc.get('district') else '',
            'state_name': resolved_loc['state'].name_en if resolved_loc.get('state') else '',
            'is_unverified': resolved_loc['is_unverified'],
            'latitude': resolved_loc['latitude'],
            'longitude': resolved_loc['longitude']
        },
        'search_parameters': {
            'start_date': str(start_date) if start_date else None,
            'end_date': str(end_date) if end_date else None,
            'quantity': quantity,
            'unit': unit,
            'resource_type': resource_type,
            'sort_by': sort_by
        },
        'counts': {
            'total': len(classified_results),
            'eligible': eligible_count,
            'availability_unknown': avail_unknown_count,
            'wider_area_alternatives': wider_count,
            'unavailable': unavail_count
        },
        'historical_reference_benchmark': historical_benchmark,
        'results': classified_results
    }


def find_matching_providers(service_request):
    """
    Backward-compatible wrapper for existing ServiceRequest views.
    Translates ServiceRequest parameters and invokes match_service_providers.
    """
    loc_dict = {
        'farm_id': service_request.farm_project.farm_id if (service_request.farm_project and service_request.farm_project.farm) else None,
        'village_name': service_request.village,
        'district_name': service_request.district,
        'state_name': service_request.state
    }

    qty = None
    unit = None
    scope = (service_request.scope_quantity or '').lower()
    for word in scope.split():
        if word.replace('.', '', 1).isdigit():
            qty = float(word)
            break
    for u in ['acre', 'acres', 'day', 'days', 'labourer', 'labourers']:
        if u in scope:
            unit = u.rstrip('s')
            break

    result = match_service_providers(
        location=loc_dict,
        category=service_request.category,
        start_date=service_request.required_date,
        quantity=qty,
        unit=unit
    )

    legacy_list = []
    for r in result['results']:
        legacy_list.append({
            'provider_id': r['provider_id'],
            'name': r['name'],
            'business_name': r['business_name'],
            'role': r['role'],
            'village': r['village'],
            'district': r['district'],
            'phone': r['phone'],
            'service_title': r['service_title'],
            'estimated_rate': r['pricing']['indicative_price'],
            'pricing_method': r['pricing']['pricing_method'],
            'rate_unit': r['pricing']['rate_unit'],
            'rating': r['rating'],
            'completed_jobs': r['completed_jobs'],
            'matching_status': r['matching_status'],
            'coverage': r['coverage'],
            'availability': r['availability'],
            'match_score': 100 if r['matching_status'] == 'ELIGIBLE' else (75 if r['matching_status'] == 'AVAILABILITY_UNKNOWN' else 40),
            'match_reasons': r['match_reasons'],
            'distance_km': r['distance_km'],
        })
    return legacy_list


def find_backup_providers(booking):
    """
    Finds alternative eligible providers when a booking is cancelled.
    Excludes the original provider who cancelled.
    """
    req = booking.request
    all_matches = find_matching_providers(req)
    backups = [
        m for m in all_matches
        if m['provider_id'] != booking.provider_id and m['matching_status'] in ['ELIGIBLE', 'AVAILABILITY_UNKNOWN', 'WIDER_AREA_ALTERNATIVE']
    ]
    return backups
