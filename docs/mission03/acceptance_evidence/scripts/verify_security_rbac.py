import os
import sys
import datetime
from decimal import Decimal

# Setup Django environment
sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.test import Client
from rest_framework import status
from accounts.models import User, ProviderProfile, WorkerProfile
from farm_projects.models import Farm, Field, FarmProject, ExpenseRecord
from bookings.models import ServiceRequest, Quotation, Booking
from services.models import ServiceCategory

def run_security_verification():
    client = Client()
    print("=" * 80)
    print("SECTION 09 — SECURITY AND AUTHORIZATION VERIFICATION")
    print(f"Timestamp: {datetime.datetime.now().isoformat()}")
    print("=" * 80)

    # 1. Setup Isolated Synthetic Identities
    # Cleanup previous synthetic test users if existing
    User.objects.filter(username__startswith='synth_sec_').delete()

    farmer_a = User.objects.create_user(username='synth_sec_farmer_a', password='password123', role='farmer', village='Daurala', district='Meerut')
    farmer_b = User.objects.create_user(username='synth_sec_farmer_b', password='password123', role='farmer', village='Mawana', district='Meerut')
    worker = User.objects.create_user(username='synth_sec_worker', password='password123', role='worker', village='Daurala', district='Meerut')
    provider = User.objects.create_user(username='synth_sec_provider', password='password123', role='provider', village='Daurala', district='Meerut')
    prof, _ = ProviderProfile.objects.get_or_create(user=provider, defaults={'business_name': 'Sharma Agri', 'verification_status': 'verified'})
    prof.verification_status = 'verified'
    prof.save()

    suspended_provider = User.objects.create_user(username='synth_sec_suspended_prov', password='password123', role='provider', village='Daurala', district='Meerut')
    sprof, _ = ProviderProfile.objects.get_or_create(user=suspended_provider, defaults={'business_name': 'Suspended Agri', 'verification_status': 'suspended'})
    sprof.verification_status = 'suspended'
    sprof.suspended_at = datetime.datetime.now()
    sprof.suspension_reason = 'Safety violation'
    sprof.save()

    admin = User.objects.create_superuser(username='synth_sec_admin', password='password123', role='admin', email='admin@krishiseva.org')

    category, _ = ServiceCategory.objects.get_or_create(slug='sec-tillage', defaults={'name_en': 'Sec Tillage', 'name_hi': 'जुताई'})

    farm_a = Farm.objects.create(farmer=farmer_a, name="Farmer A Farm", size_acres=10.0)
    field_a = Field.objects.create(farm=farm_a, name="Khasra A1", area_acres=5.0)
    project_a = FarmProject.objects.create(farmer=farmer_a, farm=farm_a, name="Farmer A Project", crop="Wheat", target_area_acres=5.0, start_date=datetime.date.today(), expected_completion_date=datetime.date.today() + datetime.timedelta(days=120))
    expense_a = ExpenseRecord.objects.create(project=project_a, category='machinery', record_type='incurred', title='Tillage Cost', amount=Decimal('2500.00'), status='active')

    req_a = ServiceRequest.objects.create(farmer=farmer_a, farm_project=project_a, category=category, title="Need Tractor", required_date=datetime.date.today() + datetime.timedelta(days=5), scope_quantity="5 Acres")
    quote_a = Quotation.objects.create(request=req_a, provider=provider, quote_amount=Decimal('2500.00'), unit_price=Decimal('500.00'), quantity=Decimal('5.0'), proposed_schedule=datetime.date.today() + datetime.timedelta(days=5))

    results = []

    def check_result(test_id, description, expected_code, actual_code, passed):
        status_str = "PASS" if passed else "FAIL"
        print(f"[{status_str}] {test_id} - {description} | Expected: {expected_code}, Observed: {actual_code}")
        results.append({
            'test_id': test_id,
            'description': description,
            'expected': expected_code,
            'observed': actual_code,
            'status': status_str
        })

    # Test 1: Cross-user Farm Access (Farmer B trying to read/edit Farmer A's farm)
    client.force_login(farmer_b)
    res = client.get(f'/api/farm-projects/farms/{farm_a.id}/')
    check_result("SEC-01", "Cross-User Farm Access (Farmer B reading Farmer A's farm)", 404, res.status_code, res.status_code in [403, 404])

    res = client.patch(f'/api/farm-projects/farms/{farm_a.id}/', {'name': 'Hacked Farm'}, content_type='application/json')
    check_result("SEC-02", "Cross-User Farm Modification (Farmer B editing Farmer A's farm)", 404, res.status_code, res.status_code in [403, 404])

    # Test 2: Cross-user Project Access (Farmer B trying to read Farmer A's farm project)
    res = client.get(f'/api/farm-projects/projects/{project_a.id}/')
    check_result("SEC-03", "Cross-User Project Access (Farmer B reading Farmer A's project)", 404, res.status_code, res.status_code in [403, 404])

    # Test 3: Cross-user Financial Summary Access
    res = client.get(f'/api/farm-projects/projects/{project_a.id}/financial-summary/')
    check_result("SEC-04", "Cross-User Financial Summary Access (Farmer B reading Farmer A's financials)", 403, res.status_code, res.status_code == 403)

    # Test 4: Cross-user Expenses List
    res = client.get(f'/api/farm-projects/projects/{project_a.id}/expenses/')
    check_result("SEC-05", "Cross-User Expenses List Access (Farmer B reading Farmer A's expenses)", 403, res.status_code, res.status_code == 403)

    # Test 5: Unauthorized Quotation Acceptance (Farmer B trying to accept Farmer A's quote)
    res = client.post(f'/api/bookings/quotations/{quote_a.id}/accept/', {'expected_version': 1}, content_type='application/json')
    check_result("SEC-06", "Unauthorized Quotation Acceptance (Farmer B accepting Farmer A's quote)", 403, res.status_code, res.status_code == 403)

    # Test 6: Public Registration Self-Assigning Admin Role
    client.logout()
    res = client.post('/api/accounts/register/', {
        'username': 'synth_sec_fake_admin',
        'password': 'password123',
        'role': 'admin',
        'phone': '9876543299',
        'village': 'Daurala',
        'district': 'Meerut'
    }, content_type='application/json')
    check_result("SEC-07", "Public Registration Self-Assigning Admin Role", 400, res.status_code, res.status_code == 400)

    # Test 7: Non-Admin Access to Administrative Verification Desk
    client.force_login(farmer_a)
    res = client.get('/api/accounts/admin/verification/')
    check_result("SEC-08", "Non-Admin Access to Admin Verification Desk (Farmer)", 403, res.status_code, res.status_code == 403)

    client.force_login(provider)
    res = client.get('/api/accounts/admin/verification/')
    check_result("SEC-09", "Non-Admin Access to Admin Verification Desk (Provider)", 403, res.status_code, res.status_code == 403)

    # Test 8: Admin Access to Administrative Verification Desk
    client.force_login(admin)
    res = client.get('/api/accounts/admin/verification/')
    check_result("SEC-10", "Authorized Admin Access to Verification Desk", 200, res.status_code, res.status_code == 200)

    # Test 9: Suspended Provider attempting to submit a quotation (BOOK-15)
    client.force_login(suspended_provider)
    res = client.post('/api/bookings/quotations/', {
        'request': req_a.id,
        'unit_price': '600.00',
        'quantity': '5.00',
        'billing_unit': 'per_acre',
        'proposed_schedule': str(datetime.date.today() + datetime.timedelta(days=5))
    }, content_type='application/json')
    check_result("SEC-11", "Suspended Provider Quotation Submission (BOOK-15)", 403, res.status_code, res.status_code in [400, 403])

    # Test 10: Unauthenticated Visitor attempting sensitive operations
    client.logout()
    res = client.get('/api/bookings/')
    check_result("SEC-12", "Unauthenticated Visitor Access to Bookings Roster", 401, res.status_code, res.status_code in [401, 403])

    res = client.get('/api/farm-projects/projects/')
    check_result("SEC-13", "Unauthenticated Visitor Access to Farm Projects", 401, res.status_code, res.status_code in [401, 403])

    # Cleanup synthetic users
    User.objects.filter(username__startswith='synth_sec_').delete()
    print("-" * 80)
    total_passed = sum(1 for r in results if r['status'] == 'PASS')
    print(f"Total Security Checks: {len(results)}, Passed: {total_passed}, Failed: {len(results) - total_passed}")
    print("=" * 80)

if __name__ == '__main__':
    run_security_verification()
