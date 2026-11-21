import datetime
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import FarmerProfile, ProviderProfile, WorkerProfile
from services.models import ServiceCategory, Village, ProviderService
from farm_projects.models import Farm, FarmProject, ProjectService
from bookings.models import ServiceRequest, Quotation, Booking, BookingEvent
from matching.matcher import find_matching_providers, find_backup_providers

User = get_user_model()

class KrishiSevaCoreTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Categories
        self.cat_labour = ServiceCategory.objects.create(
            slug='labour', name_en='Agricultural Labour', name_hi='कृषि श्रमिक', is_active=True
        )
        self.cat_mechanic = ServiceCategory.objects.create(
            slug='tractor_mechanic', name_en='Tractor Mechanic', name_hi='ट्रैक्टर मैकेनिक', is_active=True
        )

        # Village
        self.village = Village.objects.create(name='Daurala', district='Meerut', state='Uttar Pradesh')

        # Farmer
        self.farmer = User.objects.create_user(
            username='test_farmer', email='farmer@test.com', password='password123',
            role='farmer', village='Daurala', district='Meerut'
        )
        FarmerProfile.objects.create(user=self.farmer, total_land_acres=15.0)

        # Worker
        self.worker = User.objects.create_user(
            username='test_worker', email='worker@test.com', password='password123',
            role='worker', village='Daurala', district='Meerut'
        )
        WorkerProfile.objects.create(
            user=self.worker, skills='Wheat Harvesting', daily_wage_rate=500.0,
            is_available=True, verification_status='verified'
        )

        # Provider 1
        self.provider1 = User.objects.create_user(
            username='test_provider1', email='provider1@test.com', password='password123',
            role='provider', village='Daurala', district='Meerut'
        )
        ProviderProfile.objects.create(
            user=self.provider1, business_name='Provider 1 Agro',
            service_categories='tractor_mechanic', is_available=True, verification_status='verified'
        )
        ProviderService.objects.create(
            provider=self.provider1, category=self.cat_mechanic,
            title='Tractor Service', base_rate=800.0, is_active=True
        )

        # Provider 2 (Alternative for backup)
        self.provider2 = User.objects.create_user(
            username='test_provider2', email='provider2@test.com', password='password123',
            role='provider', village='Daurala', district='Meerut'
        )
        ProviderProfile.objects.create(
            user=self.provider2, business_name='Provider 2 Agro',
            service_categories='tractor_mechanic', is_available=True, verification_status='verified'
        )
        ProviderService.objects.create(
            provider=self.provider2, category=self.cat_mechanic,
            title='Emergency Repair', base_rate=850.0, is_active=True
        )

    def test_01_user_registration_and_login(self):
        """Test registration and login with token generation."""
        # Register new farmer
        res = self.client.post('/api/accounts/register/', {
            'username': 'new_farmer',
            'email': 'newfarmer@test.com',
            'password': 'safePassword123',
            'name': 'Gopal Sharma',
            'role': 'farmer',
            'phone': '9876500000',
            'village': 'Daurala',
            'land_acres': 10.5
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', res.data)
        self.assertEqual(res.data['user']['role'], 'farmer')

        # Login
        res_login = self.client.post('/api/accounts/login/', {
            'username': 'new_farmer',
            'password': 'safePassword123'
        })
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        self.assertIn('token', res_login.data)

    def test_02_service_request_creation_and_matching(self):
        """Test farmer creating a service request and smart rule matching."""
        self.client.force_authenticate(user=self.farmer)

        target_date = datetime.date.today() + datetime.timedelta(days=2)
        res = self.client.post('/api/bookings/requests/', {
            'category': self.cat_mechanic.id,
            'title': 'Emergency Clutch Repair',
            'description': 'Tractor clutch slipping under load.',
            'village': 'Daurala',
            'district': 'Meerut',
            'required_date': str(target_date),
            'scope_quantity': '1 Tractor'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        req_id = res.data['id']

        # Check smart matching
        res_match = self.client.get(f'/api/matching/providers/?request_id={req_id}')
        self.assertEqual(res_match.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(res_match.data['total_matches'], 2)
        top_match = res_match.data['matches'][0]
        self.assertIn('match_score', top_match)
        self.assertIn('match_reasons', top_match)

    def test_03_full_booking_quotation_workflow(self):
        """Test complete workflow: Request -> Quote -> Accept -> Provider Confirm -> Booked."""
        target_date = datetime.date.today() + datetime.timedelta(days=3)
        req = ServiceRequest.objects.create(
            farmer=self.farmer, category=self.cat_mechanic,
            title='Hydraulic Service', description='Lift valve leak',
            village='Daurala', district='Meerut', required_date=target_date,
            scope_quantity='1 Unit'
        )

        # Provider 1 submits quotation
        self.client.force_authenticate(user=self.provider1)
        res_quote = self.client.post('/api/bookings/quotations/', {
            'request': req.id,
            'quote_amount': 900.0,
            'price_breakdown': 'Labour 700 + Travel 200',
            'notes': 'Will bring replacement seal',
            'proposed_schedule': str(target_date)
        })
        self.assertEqual(res_quote.status_code, status.HTTP_201_CREATED)
        quote_id = res_quote.data['id']

        # Farmer accepts quotation
        self.client.force_authenticate(user=self.farmer)
        res_accept = self.client.post(f'/api/bookings/quotations/{quote_id}/accept/')
        self.assertEqual(res_accept.status_code, status.HTTP_200_OK)
        booking_data = res_accept.data['booking']
        booking_id = booking_data['id']
        self.assertEqual(booking_data['status'], 'pending_confirmation')

        # Farmer CANNOT unilaterally confirm provider's booking
        res_fake_confirm = self.client.post(f'/api/bookings/{booking_id}/confirm/')
        self.assertEqual(res_fake_confirm.status_code, status.HTTP_400_BAD_REQUEST)

        # Provider confirms booking
        self.client.force_authenticate(user=self.provider1)
        res_confirm = self.client.post(f'/api/bookings/{booking_id}/confirm/')
        self.assertEqual(res_confirm.status_code, status.HTTP_200_OK)
        self.assertEqual(res_confirm.data['booking']['status'], 'confirmed')

        # Verify request is now 'booked'
        req.refresh_from_db()
        self.assertEqual(req.status, 'booked')

    def test_04_double_booking_prevention(self):
        """Test that a provider cannot be double-booked on the same date."""
        target_date = datetime.date.today() + datetime.timedelta(days=4)

        # Create confirmed booking on target_date for provider1
        req1 = ServiceRequest.objects.create(
            farmer=self.farmer, category=self.cat_mechanic, title='Service 1',
            description='...', village='Daurala', district='Meerut', required_date=target_date,
            scope_quantity='1'
        )
        q1 = Quotation.objects.create(
            request=req1, provider=self.provider1, quote_amount=800.0, proposed_schedule=target_date, status='accepted'
        )
        b1 = Booking.objects.create(
            request=req1, quotation=q1, farmer=self.farmer, provider=self.provider1,
            agreed_amount=800.0, scheduled_date=target_date, status='confirmed'
        )

        # Attempt to confirm a second booking for provider1 on the EXACT SAME target_date
        req2 = ServiceRequest.objects.create(
            farmer=self.farmer, category=self.cat_mechanic, title='Service 2',
            description='...', village='Daurala', district='Meerut', required_date=target_date,
            scope_quantity='1'
        )
        q2 = Quotation.objects.create(
            request=req2, provider=self.provider1, quote_amount=850.0, proposed_schedule=target_date, status='accepted'
        )
        b2 = Booking.objects.create(
            request=req2, quotation=q2, farmer=self.farmer, provider=self.provider1,
            agreed_amount=850.0, scheduled_date=target_date, status='pending_confirmation'
        )

        self.client.force_authenticate(user=self.provider1)
        res = self.client.post(f'/api/bookings/{b2.id}/confirm/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Double-booking conflict', res.data['error'])

    def test_05_cancellation_and_backup_providers(self):
        """Test cancellation and backup provider recommendation."""
        target_date = datetime.date.today() + datetime.timedelta(days=5)
        req = ServiceRequest.objects.create(
            farmer=self.farmer, category=self.cat_mechanic, title='Brake Repair',
            description='...', village='Daurala', district='Meerut', required_date=target_date,
            scope_quantity='1'
        )
        q = Quotation.objects.create(
            request=req, provider=self.provider1, quote_amount=800.0, proposed_schedule=target_date, status='accepted'
        )
        booking = Booking.objects.create(
            request=req, quotation=q, farmer=self.farmer, provider=self.provider1,
            agreed_amount=800.0, scheduled_date=target_date, status='confirmed'
        )

        # Provider cancels
        self.client.force_authenticate(user=self.provider1)
        res_cancel = self.client.post(f'/api/bookings/{booking.id}/cancel/', {
            'reason': 'Emergency illness'
        })
        self.assertEqual(res_cancel.status_code, status.HTTP_200_OK)
        self.assertEqual(res_cancel.data['booking']['status'], 'cancelled_by_provider')

        # Farmer requests backup providers
        self.client.force_authenticate(user=self.farmer)
        res_backup = self.client.get(f'/api/bookings/{booking.id}/backup-providers/')
        self.assertEqual(res_backup.status_code, status.HTTP_200_OK)
        backups = res_backup.data['backup_providers']
        # Provider 1 must be excluded, Provider 2 should be included
        provider_ids = [b['provider_id'] for b in backups]
        self.assertNotIn(self.provider1.id, provider_ids)
        self.assertIn(self.provider2.id, provider_ids)

    def test_06_farm_project_cost_and_readiness(self):
        """Test Farm Project Manager tracking and readiness criteria."""
        self.client.force_authenticate(user=self.farmer)
        
        farm = Farm.objects.create(
            farmer=self.farmer, name='Kisan Khet', village='Daurala', size_acres=20.0
        )
        start_d = datetime.date.today() + datetime.timedelta(days=3)
        end_d = datetime.date.today() + datetime.timedelta(days=7)

        # Create project
        res_proj = self.client.post('/api/farm-projects/projects/', {
            'farm': farm.id,
            'name': 'Wheat Harvest 2026',
            'crop': 'Wheat',
            'target_area_acres': 20.0,
            'start_date': str(start_d),
            'expected_completion_date': str(end_d),
            'services': [
                {'category': self.cat_mechanic.id, 'scope_description': 'Pre-harvest inspection'}
            ]
        }, format='json')
        self.assertEqual(res_proj.status_code, status.HTTP_201_CREATED)
        proj_id = res_proj.data['id']

        proj = FarmProject.objects.get(id=proj_id)
        # Because services are not yet confirmed, status must NOT be 'ready'
        self.assertNotEqual(proj.status, 'ready')
        self.assertEqual(proj.status, 'planning')
