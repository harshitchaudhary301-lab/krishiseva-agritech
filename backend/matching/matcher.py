"""
KrishiSeva Smart Rule-Based Matching Engine
Transparent matching between farmer service requests and eligible local providers/workers.
"""

from accounts.models import User, ProviderProfile, WorkerProfile
from bookings.models import Booking
from services.models import ProviderService


def find_matching_providers(service_request):
    """
    Finds and ranks eligible providers or workers for a given ServiceRequest.
    Returns a sorted list of dicts with provider details, match score, and match reasons.
    """
    category = service_request.category
    category_slug = category.slug
    village = (service_request.village or '').strip().lower()
    district = (service_request.district or '').strip().lower()
    req_date = service_request.required_date

    # Determine eligible role
    is_labour = (category_slug == 'labour')
    target_role = 'worker' if is_labour else 'provider'

    candidates = User.objects.filter(role=target_role, is_active=True)

    matches = []

    for candidate in candidates:
        # 1. Availability check
        if is_labour:
            worker_profile = getattr(candidate, 'worker_profile', None)
            if not worker_profile or not worker_profile.is_available:
                continue
            skills_text = (worker_profile.skills or '').lower()
            experience = worker_profile.experience_years
            rating = float(worker_profile.rating or 4.5)
            completed_jobs = worker_profile.completed_jobs_count
            daily_rate = float(worker_profile.daily_wage_rate or 500)
            service_title = "Agricultural Worker"
        else:
            provider_profile = getattr(candidate, 'provider_profile', None)
            if not provider_profile or not provider_profile.is_available:
                continue

            # Check if provider offers this category
            # Either via ProviderService table or provider_profile.service_categories
            offers_category = False
            prov_services = candidate.services.filter(category=category, is_active=True)
            if prov_services.exists():
                offers_category = True
                prov_svc = prov_services.first()
                daily_rate = float(prov_svc.base_rate)
                service_title = prov_svc.title
            elif category_slug in (provider_profile.service_categories or '').lower():
                offers_category = True
                daily_rate = 1200.0
                service_title = f"{category.name_en} Service"
            else:
                continue

            if not offers_category:
                continue

            experience = 5
            rating = float(provider_profile.rating or 4.8)
            completed_jobs = provider_profile.completed_bookings_count

        # 2. Double-booking conflict check
        if Booking.check_double_booking(candidate.id, req_date):
            # Already booked on this date!
            continue

        # 3. Location & Service Area Relevance
        cand_village = (candidate.village or '').strip().lower()
        cand_district = (candidate.district or '').strip().lower()
        
        # Check provider service_villages if applicable
        covered_villages = ""
        if not is_labour and hasattr(candidate, 'provider_profile'):
            covered_villages = (candidate.provider_profile.service_villages or '').lower()

        match_score = 50 # Base eligibility score
        match_reasons = ["Verified eligible category provider", "Available on selected date"]

        # Village check
        if cand_village == village or village in covered_villages:
            match_score += 35
            match_reasons.append(f"Located directly in {service_request.village} (zero travel delay)")
        elif cand_district == district:
            match_score += 20
            match_reasons.append(f"Within {service_request.district} district")
        else:
            match_score += 5
            match_reasons.append("Nearby district coverage")

        # Rating & Reliability bonus
        if rating > 0:
            rating_bonus = int(rating * 5)
            match_score += rating_bonus
            match_reasons.append(f"High customer satisfaction ({rating}★)")
        
        if completed_jobs > 0:
            exp_bonus = min(completed_jobs * 2, 15)
            match_score += exp_bonus
            match_reasons.append(f"{completed_jobs} successful farm jobs completed")
        else:
            match_reasons.append("New provider ready for immediate service")

        matches.append({
            'provider_id': candidate.id,
            'name': candidate.get_full_name() or candidate.username,
            'role': candidate.role,
            'village': candidate.village,
            'district': candidate.district,
            'phone': candidate.phone,
            'service_title': service_title,
            'estimated_rate': daily_rate,
            'rating': rating,
            'completed_jobs': completed_jobs,
            'match_score': match_score,
            'match_reasons': match_reasons,
        })

    # Sort descending by match score
    matches.sort(key=lambda x: x['match_score'], reverse=True)
    return matches


def find_backup_providers(booking):
    """
    Finds alternative eligible providers when a booking is cancelled.
    Excludes the original provider who cancelled.
    """
    req = booking.request
    original_provider_id = booking.provider_id
    all_matches = find_matching_providers(req)
    # Exclude cancelled provider
    backups = [m for m in all_matches if m['provider_id'] != original_provider_id]
    return backups
