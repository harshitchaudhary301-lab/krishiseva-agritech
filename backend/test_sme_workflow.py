"""
End-to-end verification script for KrishiSeva Service Matching Engine (KS-DEV-SME-001)
Tests:
- LGD Location and Category Validation
- Exact Matching Logic and Result Classifications (ELIGIBLE, AVAILABILITY_UNKNOWN, UNAVAILABLE, WIDER_AREA_ALTERNATIVE)
- Half-Open Interval Scheduling and Capacity Reservations
- Pricing & Financial Distinctions
- Complete End-to-End Workflow:
    Farm Project Operation -> Service Request -> Matching Engine -> Quotation ->
    Booking Confirmation -> Resource Reservation -> Farmer-Approved Completion ->
    Operation Progress Recalculation -> Financial Records
"""

import os
import sys
from decimal import Decimal
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.utils import timezone
from accounts.models import User
from services.models import (
    State, District, SubDistrict, Village, ServiceCategory,
    ProviderService, ProviderCoverageArea, ProviderResource, ProviderAvailabilityWindow
)
from farm_projects.models import Farm, FarmProject, ProjectOperation, ExpenseRecord
from bookings.models import ServiceRequest, Quotation, Booking, ResourceReservation
from matching.matcher import (
    resolve_delivery_location, evaluate_provider_coverage,
    check_resource_and_capacity_availability, match_service_providers,
    half_open_intervals_overlap, haversine_distance
)


def run_sme_tests():
    print("======================================================================")
    print("KRISHISEVA SERVICE MATCHING ENGINE (KS-DEV-SME-001) — VERIFICATION")
    print("======================================================================")

    # 1. Test Half-Open Interval Logic
    print("\n[TEST 1] Half-Open Scheduling Intervals [start, end)")
    # Adjacent intervals [2026-11-25, 2026-11-26) and [2026-11-26, 2026-11-27)
    d1 = date(2026, 11, 25)
    d2 = date(2026, 11, 26)
    d3 = date(2026, 11, 27)
    assert not half_open_intervals_overlap(d1, d2, d2, d3), "Adjacent half-open intervals should NOT overlap!"
    assert half_open_intervals_overlap(d1, d3, d2, d3), "Overlapping intervals must be detected!"
    print("  ✓ Adjacent intervals do not falsely conflict")
    print("  ✓ Overlapping intervals are accurately identified")

    # 2. Test LGD Location Resolution
    print("\n[TEST 2] LGD Location Resolution")
    loc = resolve_delivery_location({'village_name': 'Daurala', 'district_name': 'Meerut'})
    assert loc['village'] is not None, "Daurala village should be resolved from LGD"
    assert loc['village_lgd'] == 941836, f"Daurala LGD code should be 941836, got {loc['village_lgd']}"
    assert loc['district_lgd'] == 169, f"Meerut LGD code should be 169, got {loc['district_lgd']}"
    print(f"  ✓ Resolved {loc['display_name']} with LGD Code {loc['village_lgd']}")

    # 3. Test Provider Geographic Coverage Specificity
    print("\n[TEST 3] Provider Geographic Coverage Evaluation")
    vikram = User.objects.get(username='vikram_mechanic')
    # Daurala should be direct village coverage
    cov_daurala = evaluate_provider_coverage(vikram, loc)
    assert cov_daurala['has_confirmed_coverage'] is True
    assert cov_daurala['coverage_level'] == 'village'
    assert cov_daurala['specificity_score'] == 4
    print("  ✓ Vikram covers Daurala at village level (Score: 4)")

    # Hastinapur location for Vikram -> should be wider-area alternative (district without subordinate scope or base in Meerut)
    loc_hastinapur = resolve_delivery_location({'village_name': 'Hastinapur', 'district_name': 'Meerut'})
    cov_hastinapur = evaluate_provider_coverage(vikram, loc_hastinapur)
    assert cov_hastinapur['is_wider_area'] is True, "Hastinapur should be wider-area alternative for Vikram"
    assert cov_hastinapur['has_confirmed_coverage'] is False
    print("  ✓ Vikram classified as WIDER-AREA ALTERNATIVE for Hastinapur (Delivery coverage unconfirmed)")

    # 4. Test Matching Engine Classifications
    print("\n[TEST 4] Matching Engine Result Classifications")
    # 4A. Eligible search (Daurala, tractor_mechanic, scheduled date)
    res_eligible = match_service_providers(
        location={'village_name': 'Daurala', 'district_name': 'Meerut'},
        category='tractor_mechanic',
        start_date='2026-11-28'
    )
    assert res_eligible['counts']['eligible'] >= 1, "Expected at least 1 eligible provider"
    first = res_eligible['results'][0]
    assert first['matching_status'] == 'ELIGIBLE'
    assert first['pricing']['pricing_method'] in ['fixed', 'per_day', 'per_visit']
    print(f"  ✓ ELIGIBLE: {first['name']} ({first['pricing']['formatted']})")

    # 4B. Availability Unknown search (No date specified)
    res_no_date = match_service_providers(
        location={'village_name': 'Daurala', 'district_name': 'Meerut'},
        category='tractor_mechanic'
    )
    assert res_no_date['counts']['availability_unknown'] >= 1
    assert res_no_date['counts']['eligible'] == 0, "Without dates, should not be marked eligible"
    print(f"  ✓ AVAILABILITY UNKNOWN: {res_no_date['counts']['availability_unknown']} providers require schedule details")

    # 4C. Wider-Area Alternative search
    res_wider = match_service_providers(
        location={'village_name': 'Hastinapur', 'district_name': 'Meerut'},
        category='tractor_mechanic',
        start_date='2026-11-28'
    )
    assert res_wider['counts']['wider_area_alternatives'] >= 1
    print(f"  ✓ WIDER-AREA ALTERNATIVE: {res_wider['counts']['wider_area_alternatives']} providers identified")

    # 5. Test Step 9 Complete Workflow
    print("\n[TEST 5] Complete End-to-End Workflow Execution (Step 9)")
    farmer = User.objects.get(username='ramesh_farmer')
    provider = User.objects.get(username='vikram_mechanic')
    category = ServiceCategory.objects.get(slug='tractor_mechanic')

    # Ensure farm exists
    farm = Farm.objects.filter(farmer=farmer).first()
    if not farm:
        farm = Farm.objects.create(
            farmer=farmer,
            name="Ganga Khet — Daurala",
            village="Daurala",
            district="Meerut",
            state="Uttar Pradesh",
            size_acres=Decimal('10.00')
        )

    # 5A. Farm Project & Operation
    test_date = date(2026, 12, 10)
    project = FarmProject.objects.create(
        farmer=farmer,
        farm=farm,
        name=f"Workflow Test Project {test_date}",
        crop="Wheat",
        target_area_acres=Decimal('10.00'),
        start_date=test_date,
        expected_completion_date=test_date + timedelta(days=90),
        status='planning'
    )

    op = ProjectOperation.objects.create(
        project=project,
        sequence_order=1,
        operation_name_en="Primary Tillage & Tractor Maintenance",
        operation_name_hi="प्राथमिक जुताई एवं ट्रैक्टर सर्विस",
        stage="Land Preparation",
        service_category=category,
        planned_start_date=test_date,
        planned_end_date=test_date + timedelta(days=2),
        status='planned'
    )
    print("  ✓ 1. Farm Project Operation created in 'planned' status")

    # 5B. Create Linked Service Requirement
    srv_req = ServiceRequest.objects.create(
        farmer=farmer,
        category=category,
        farm_project=project,
        title=f"Service for {op.operation_name_en}",
        description="On-farm engine tuning and hydraulic inspection before sowing.",
        village=farm.village,
        district=farm.district,
        state=farm.state,
        required_date=test_date,
        scope_quantity="1 tractor full diagnostic and hydraulic service",
        status='open'
    )
    op.service_request = srv_req
    op.status = 'service_requested'
    op.save()
    print(f"  ✓ 2. Linked Service Request REQ-{srv_req.id} created; Operation status -> 'service_requested'")

    # 5C. Provider Submits Quotation
    quote = Quotation.objects.create(
        request=srv_req,
        provider=provider,
        quotation_version=1,
        quantity=Decimal('1.00'),
        billing_unit='Per Visit',
        unit_price=Decimal('800.00'),
        proposed_schedule=test_date,
        status='pending'
    )
    assert quote.quote_amount == Decimal('800.00'), "Server must calculate total amount"
    print(f"  ✓ 3. Provider submitted Quotation v1 of ₹{quote.quote_amount} (Server-calculated total)")

    # 5D. Farmer Approves Quotation -> Creates Booking in pending_confirmation
    quote.status = 'accepted'
    quote.save()
    srv_req.status = 'quote_accepted'
    srv_req.save()

    booking = Booking.objects.create(
        request=srv_req,
        quotation=quote,
        farmer=farmer,
        provider=provider,
        agreed_amount=quote.quote_amount,
        scheduled_date=test_date,
        exclusive_resource_id='VIKRAM-DIAG-01',
        status='pending_confirmation'
    )
    print(f"  ✓ 4. Farmer approved quotation -> Booking {booking.reference_id} created in 'pending_confirmation'")

    # 5E. Provider Confirms Booking -> Atomically Reserves Resource
    confirmed_bk = booking.confirm_by_provider(provider)
    assert confirmed_bk.status == 'confirmed', "Booking must be confirmed"
    srv_req.refresh_from_db()
    assert srv_req.status == 'booked', "Service request must be booked"

    # CRITICAL RULE: Confirmed booking MUST NOT mark operation completed!
    op.refresh_from_db()
    assert op.status == 'scheduled', f"Operation status must be 'scheduled', got {op.status}!"
    assert op.status != 'completed', "Confirmed booking must NEVER automatically mark agricultural operation completed!"
    print("  ✓ 5. Provider confirmed booking -> Resource reservation locked")
    print(f"  ✓ 6. Operation status updated to 'scheduled' (STRICT: NOT completed)")

    # 5F. Verify Double-Booking Conflict Prevention
    conflict_detected = Booking.check_double_booking(provider.id, test_date, exclusive_resource_id='VIKRAM-DIAG-01')
    assert conflict_detected is True, "Double-booking check must detect the active exclusive reservation!"
    print(f"  ✓ 7. Double-booking conflict successfully prevented for {test_date} (BOOK-07)")

    # 5G. Provider Submits Completion
    booking.submit_completion(provider, notes="Hydraulic seals replaced and engine tuned satisfactorily.")
    booking.refresh_from_db()
    assert booking.status == 'completion_pending'
    print(f"  ✓ 8. Provider submitted completion -> Booking in 'completion_pending'")

    # 5H. Farmer Approves Completion -> Operation Completed, Financial Records Created
    booking.confirm_completion_by_farmer(farmer, is_approved=True)
    booking.refresh_from_db()
    op.refresh_from_db()
    project.refresh_from_db()

    assert booking.status == 'completed', "Booking must be completed"
    assert op.status == 'completed', f"Operation should now be completed, got {op.status}"
    assert op.actual_completion_date is not None, "Completion date should be recorded"

    # Verify Financial Records
    inc_expense = ExpenseRecord.objects.filter(
        project=project,
        booking=booking,
        record_type='incurred',
        status='active'
    ).first()
    assert inc_expense is not None, "Incurred expenditure must be recorded upon farmer-approved completion"
    assert inc_expense.amount == booking.agreed_amount, f"Expense amount ₹{inc_expense.amount} must equal agreed ₹{booking.agreed_amount}"

    # Verify Financial Summary
    fin_summary = project.get_financial_summary()
    assert Decimal(fin_summary['incurred_expenditure']) >= Decimal('800.00')
    print(f"  ✓ 9. Farmer approved completion -> Booking completed, Operation completed")
    print(f"  ✓ 10. Financial Record created: Incurred expenditure ₹{inc_expense.amount} (FIN-03)")
    print(f"  ✓ 11. Project financial summary: Incurred ₹{fin_summary['incurred_expenditure']}, Outstanding ₹{fin_summary['outstanding_balance']}")

    # Clean up test records
    print("\n[CLEANUP] Cleaning test records...")
    ExpenseRecord.objects.filter(project=project).delete()
    ResourceReservation.objects.filter(booking=booking).delete()
    booking.delete()
    quote.delete()
    srv_req.delete()
    op.delete()
    project.delete()
    print("  ✓ Cleanup complete")

    print("\n======================================================================")
    print("ALL KS-DEV-SME-001 TESTS PASSED SUCCESSFULLY! (100% RULE COMPLIANCE)")
    print("======================================================================")


if __name__ == '__main__':
    run_sme_tests()
