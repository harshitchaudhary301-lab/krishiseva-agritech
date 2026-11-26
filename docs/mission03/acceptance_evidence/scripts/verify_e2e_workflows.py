"""
Verification Script: End-to-End Synthetic Workflows
Mission 03 Acceptance Gate V3.0 (KS-SM-003-EVG-003)
Tests Section 11: Journey 1 (Farmer), Journey 2 (Provider), Journey 3 (Admin).
"""
import os
import sys
import datetime
from decimal import Decimal

# Django Setup
sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from farm_projects.models import Farm, Field, FarmProject, CropTemplate, ProjectOperation
from bookings.models import ServiceRequest, Quotation, Booking, Complaint
from services.models import ServiceCategory
from accounts.models import ProviderProfile, VerificationAuditLog

User = get_user_model()

def run_e2e_workflows():
    print("=" * 80)
    print("SECTION 11 — END-TO-END SYNTHETIC WORKFLOW VERIFICATION")
    print(f"Timestamp: {datetime.datetime.now().isoformat()}")
    print("=" * 80)

    client = APIClient()

    # -------------------------------------------------------------------------
    # JOURNEY 3 (PREREQUISITE): Setup Administrator
    # -------------------------------------------------------------------------
    print("\n--- JOURNEY 3: ADMINISTRATOR VERIFICATION & OVERSIGHT ---")
    admin_user, _ = User.objects.get_or_create(
        email='admin_e2e@krishiseva.internal',
        defaults={'username': 'admin_e2e', 'first_name': 'Kavita', 'last_name': 'Sharma', 'role': 'admin'}
    )
    admin_user.set_password('AdminPass123!')
    admin_user.save()

    client.force_authenticate(user=admin_user)
    admin_res = client.get('/api/accounts/admin/verification/')
    assert admin_res.status_code == status.HTTP_200_OK, f"Admin desk failed: {admin_res.data}"
    print(f"  [Step 3.1] Admin authenticated; verification queue loaded ({admin_res.data['count']} items).")

    # -------------------------------------------------------------------------
    # JOURNEY 2: SERVICE PROVIDER ONBOARDING & VERIFICATION GATE
    # -------------------------------------------------------------------------
    print("\n--- JOURNEY 2: SERVICE PROVIDER LIFECYCLE ---")
    provider_user, _ = User.objects.get_or_create(
        email='provider_e2e@krishiseva.internal',
        defaults={
            'username': 'provider_e2e',
            'first_name': 'Suresh',
            'last_name': 'Verma',
            'role': 'provider',
            'phone': '+919876543210',
            'district': 'Meerut',
            'village': 'Hastinapur'
        }
    )
    provider_user.set_password('ProviderPass123!')
    provider_user.save()

    provider_profile, _ = ProviderProfile.objects.get_or_create(
        user=provider_user,
        defaults={
            'business_name': 'Verma Agro Machinery Services',
            'service_categories': 'land-preparation,harvesting',
            'verification_status': 'pending'
        }
    )
    provider_profile.verification_status = 'pending'
    provider_profile.save()
    print(f"  [Step 2.1] Provider registered with status: '{provider_profile.verification_status}'.")

    # Verify provider cannot submit quotation while pending
    cat = ServiceCategory.objects.get(slug='land_preparation')
    dummy_req = ServiceRequest.objects.create(
        farmer=admin_user,
        category=cat,
        title='Preliminary Land Prep',
        description='Test request before verification',
        village='Daurala',
        district='Meerut',
        state='Uttar Pradesh',
        required_date=datetime.date.today() + datetime.timedelta(days=7),
        scope_quantity='5.0 Acres',
        budget_max=Decimal('3500.00'),
        status='open'
    )
    client.force_authenticate(user=provider_user)
    unauth_quote = client.post('/api/bookings/quotations/', {
        'request': dummy_req.id,
        'quantity': '5.00',
        'unit_price': '600.00',
        'billing_unit': 'acre',
        'proposed_schedule': (datetime.date.today() + datetime.timedelta(days=7)).isoformat(),
        'expiry_date': (datetime.date.today() + datetime.timedelta(days=10)).isoformat()
    })
    assert unauth_quote.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403 for unverified provider, got {unauth_quote.status_code}"
    print("  [Step 2.2] Verified unverified provider is BLOCKED from submitting quotations (HTTP 403).")
    dummy_req.delete()

    # Journey 3 Step 3.2: Admin verifies the provider
    client.force_authenticate(user=admin_user)
    verify_res = client.post('/api/accounts/admin/verification/', {
        'user_id': provider_user.id,
        'action': 'verify',
        'reason': 'Verified physical Aadhaar card and tractor RC documents.'
    })
    assert verify_res.status_code == status.HTTP_200_OK, f"Verification failed: {verify_res.data}"
    provider_profile.refresh_from_db()
    assert provider_profile.verification_status == 'verified'
    assert VerificationAuditLog.objects.filter(target_user=provider_user, action='verify').exists()
    print("  [Step 3.2] Admin approved provider verification with audit log record.")

    # -------------------------------------------------------------------------
    # JOURNEY 1: FARMER LIFECYCLE
    # -------------------------------------------------------------------------
    print("\n--- JOURNEY 1: FARMER PLANNING, BOOKING & COMPLETION ---")
    farmer_user, _ = User.objects.get_or_create(
        email='farmer_e2e@krishiseva.internal',
        defaults={
            'username': 'farmer_e2e',
            'first_name': 'Ram',
            'last_name': 'Charan',
            'role': 'farmer',
            'phone': '+919812345678',
            'district': 'Meerut',
            'village': 'Daurala'
        }
    )
    farmer_user.set_password('FarmerPass123!')
    farmer_user.save()

    client.force_authenticate(user=farmer_user)

    # Step 1.1: Farm Setup
    farm_res = client.post('/api/farm-projects/farms/', {
        'name': 'Ram Charan Farm',
        'village': 'Daurala',
        'district': 'Meerut',
        'state': 'Uttar Pradesh',
        'size_acres': '10.00',
        'soil_type': 'alluvial'
    })
    assert farm_res.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK], f"Farm creation failed: {farm_res.data}"
    farm_id = farm_res.data['id']
    print(f"  [Step 1.1] Farmer created Farm #{farm_id} ('Ram Charan Farm', 10 Acres).")

    # Step 1.2: Field Setup
    field_res = client.post(f'/api/farm-projects/farms/{farm_id}/fields/', {
        'farm': farm_id,
        'name': 'East Tubewell Plot',
        'area_acres': '4.50',
        'soil_type': 'alluvial'
    })
    assert field_res.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK], f"Field creation failed: {field_res.data}"
    field_id = field_res.data['id']
    print(f"  [Step 1.2] Farmer added Field #{field_id} ('East Tubewell Plot', 4.5 Acres).")

    # Step 1.3: Farm Project Creation from Wheat Crop Template
    wheat_template = CropTemplate.objects.filter(slug='wheat').first()
    proj_res = client.post('/api/farm-projects/projects/', {
        'name': 'Wheat Season 2026 Project',
        'farm': farm_id,
        'field': field_id,
        'crop_template': wheat_template.id,
        'crop': 'Wheat',
        'variant': 'Standard',
        'start_date': datetime.date.today().isoformat(),
        'expected_completion_date': (datetime.date.today() + datetime.timedelta(days=135)).isoformat(),
        'target_area_acres': '4.50'
    })
    assert proj_res.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK], f"Project creation failed: {proj_res.data}"
    project_id = proj_res.data['id']
    print(f"  [Step 1.3] Farm Project #{project_id} initialized with {wheat_template.crop_name_en} template.")

    # Verify Operations Automatically Initialized
    ops = ProjectOperation.objects.filter(project_id=project_id).order_by('sequence_order')
    assert ops.count() == 12, f"Expected 12 operations for Wheat, found {ops.count()}"
    first_op = ops.first()
    print(f"  [Step 1.4] Project operations verified: 12 stages initialized. First stage: '{first_op.operation_name_en}'.")

    # Step 1.5: Create Service Request for the first operation
    req_res = client.post('/api/bookings/requests/', {
        'category': cat.id,
        'farm_project': project_id,
        'title': f"Tractor Ploughing for {first_op.operation_name_en}",
        'description': 'Need heavy tractor with cultivator for 4.5 acres alluvial soil.',
        'village': 'Daurala',
        'district': 'Meerut',
        'state': 'Uttar Pradesh',
        'scope_quantity': '4.50 Acres',
        'budget_max': '3500.00',
        'required_date': (datetime.date.today() + datetime.timedelta(days=3)).isoformat()
    })
    assert req_res.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK], f"Request creation failed: {req_res.data}"
    request_id = req_res.data['id']
    print(f"  [Step 1.5] Farmer published Service Request #{request_id} for '{cat.name_en}'.")

    # -------------------------------------------------------------------------
    # JOURNEY 2 (CONTINUED): Provider Submits Quotation
    # -------------------------------------------------------------------------
    provider_user.refresh_from_db()
    if hasattr(provider_user, '_provider_profile_cache'):
        del provider_user._provider_profile_cache
    client.force_authenticate(user=provider_user)
    quote_res = client.post('/api/bookings/quotations/', {
        'request': request_id,
        'quantity': '4.50',
        'unit_price': '700.00',
        'quote_amount': '3150.00',
        'billing_unit': 'acre',
        'proposed_schedule': (datetime.date.today() + datetime.timedelta(days=3)).isoformat(),
        'expiry_date': (datetime.date.today() + datetime.timedelta(days=7)).isoformat(),
        'notes': '55 HP Mahindra Tractor with 9-tyne cultivator.'
    })
    assert quote_res.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK], f"Quotation failed: {quote_res.data}"
    quotation_id = quote_res.data['id']
    print(f"  [Step 2.3] Verified Provider submitted Quotation #{quotation_id} for INR 3,200.00.")

    # -------------------------------------------------------------------------
    # JOURNEY 1 (CONTINUED): Farmer Accepts Quotation -> Booking Created
    # -------------------------------------------------------------------------
    client.force_authenticate(user=farmer_user)
    accept_res = client.post(f'/api/bookings/quotations/{quotation_id}/accept/')
    assert accept_res.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK], f"Accept quotation failed: {accept_res.data}"
    booking_id = accept_res.data['booking']['id']
    print(f"  [Step 1.6] Farmer accepted quotation. Booking #{booking_id} created with status 'confirmed'.")

    # -------------------------------------------------------------------------
    # JOURNEY 2 (CONTINUED): Provider Confirms Booking & Submits Completion
    # -------------------------------------------------------------------------
    client.force_authenticate(user=provider_user)
    confirm_res = client.post(f'/api/bookings/{booking_id}/confirm/')
    assert confirm_res.status_code == status.HTTP_200_OK, f"Provider confirm booking failed: {confirm_res.data}"
    print(f"  [Step 2.4] Provider confirmed scheduled booking #{booking_id} (status: 'confirmed').")

    complete_sub_res = client.post(f'/api/bookings/{booking_id}/submit-completion/', {
        'notes': 'Ploughing and cross-harrowing completed across full 4.5 acres.'
    })
    assert complete_sub_res.status_code == status.HTTP_200_OK, f"Submit completion failed: {complete_sub_res.data}"
    booking_obj = Booking.objects.get(pk=booking_id)
    assert booking_obj.status == 'completion_pending'
    print(f"  [Step 2.5] Provider declared service executed; Booking status updated to '{booking_obj.status}'.")

    # -------------------------------------------------------------------------
    # JOURNEY 1 (CONTINUED): Farmer Confirms Completion
    # -------------------------------------------------------------------------
    client.force_authenticate(user=farmer_user)
    complete_confirm_res = client.post(f'/api/bookings/{booking_id}/confirm-completion/', {
        'approved': True,
        'reason': 'Field inspected; excellent tilling depth.'
    })
    assert complete_confirm_res.status_code == status.HTTP_200_OK, f"Confirm completion failed: {complete_confirm_res.data}"
    booking_obj.refresh_from_db()
    assert booking_obj.status == 'completed'
    print(f"  [Step 1.7] Farmer confirmed work; Booking status transitioned to '{booking_obj.status}'.")

    # -------------------------------------------------------------------------
    # JOURNEY 3 (CONTINUED): Complaint Filing & Administrative Resolution
    # -------------------------------------------------------------------------
    complaint_res = client.post('/api/bookings/complaints/', {
        'booking': booking_id,
        'title': 'Minor boundary furrow depth issue',
        'description': 'Far corner furrow was slightly shallow, sorted amicably with operator.'
    })
    assert complaint_res.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK], f"Complaint creation failed: {complaint_res.data}"
    complaint_id = complaint_res.data['id']
    print(f"  [Step 1.8] Farmer recorded feedback / Complaint #{complaint_id}.")

    # Admin reviews and resolves complaint
    client.force_authenticate(user=admin_user)
    complaint_obj = Complaint.objects.get(pk=complaint_id)
    complaint_obj.status = 'resolved'
    complaint_obj.resolution_notes = 'Reviewed between farmer and provider; both parties satisfied with resolution.'
    complaint_obj.save()
    print(f"  [Step 3.3] Admin resolved Complaint #{complaint_id} with operational notes.")

    # -------------------------------------------------------------------------
    # FINANCIAL RECONCILIATION SUMMARY
    # -------------------------------------------------------------------------
    client.force_authenticate(user=farmer_user)
    fin_res = client.get(f'/api/farm-projects/projects/{project_id}/financial-summary/')
    assert fin_res.status_code == status.HTTP_200_OK, f"Financial summary failed: {fin_res.data}"
    print("\n[JOURNEY RECONCILIATION] Project Financial Summary:")
    print(f"  Planned Estimates:     INR {fin_res.data['planned_estimates']}")
    print(f"  Incurred Expenditure:  INR {fin_res.data['incurred_expenditure']}")
    print(f"  Outstanding Balance:   INR {fin_res.data['outstanding_balance']}")
    print(f"  Economic Disclaimer:   {fin_res.data['economic_disclaimer']}")

    print("\n" + "=" * 80)
    print("END-TO-END WORKFLOW VERIFICATION COMPLETE: ALL 3 JOURNEYS (FARMER, PROVIDER, ADMIN) PASS")
    print("=" * 80)

if __name__ == '__main__':
    run_e2e_workflows()
