from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import WorkerProfile, ProviderProfile, UserConsent, VerificationAuditLog

User = get_user_model()

class SecurityAndVerificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username='admin_test',
            email='admin@test.com',
            password='adminpassword123',
            role='admin'
        )
        self.farmer_user = User.objects.create_user(
            username='farmer_test',
            email='farmer@test.com',
            password='farmerpassword123',
            role='farmer'
        )

    def test_cannot_register_as_admin(self):
        """Security: Ordinary registration must reject 'admin' role."""
        payload = {
            'username': 'malicious_admin',
            'email': 'bad@test.com',
            'password': 'password123',
            'role': 'admin'
        }
        response = self.client.post('/api/accounts/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('role', response.data)
        self.assertFalse(User.objects.filter(username='malicious_admin').exists())

    def test_provider_registration_defaults_to_pending(self):
        """Security: Newly registered providers must remain pending verification."""
        payload = {
            'username': 'new_provider',
            'email': 'provider@test.com',
            'password': 'providerpassword123',
            'role': 'provider',
            'business_name': 'Kisan Harvester Services',
            'service_categories': 'machinery_rental',
            'village': 'Daurala',
            'district': 'Meerut'
        }
        response = self.client.post('/api/accounts/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        provider = User.objects.get(username='new_provider')
        self.assertEqual(provider.role, 'provider')
        self.assertTrue(hasattr(provider, 'provider_profile'))
        self.assertEqual(provider.provider_profile.verification_status, 'pending')
        self.assertFalse(provider.provider_profile.is_verified())

        # Check consent
        self.assertTrue(UserConsent.objects.filter(user=provider).exists())

    def test_worker_registration_defaults_to_pending(self):
        """Security: Newly registered workers must remain pending verification."""
        payload = {
            'username': 'new_worker',
            'email': 'worker@test.com',
            'password': 'workerpassword123',
            'role': 'worker',
            'skills': 'Wheat Harvesting',
            'daily_wage_rate': '550.00',
            'village': 'Daurala',
            'district': 'Meerut'
        }
        response = self.client.post('/api/accounts/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        worker = User.objects.get(username='new_worker')
        self.assertEqual(worker.role, 'worker')
        self.assertTrue(hasattr(worker, 'worker_profile'))
        self.assertEqual(worker.worker_profile.verification_status, 'pending')
        self.assertFalse(worker.worker_profile.is_verified())

    def test_non_admin_cannot_access_verification_endpoint(self):
        """Authorization: Farmers and Providers cannot access administrative verification."""
        self.client.force_authenticate(user=self.farmer_user)
        response = self.client.get('/api/accounts/admin/verification/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        post_response = self.client.post('/api/accounts/admin/verification/', {
            'user_id': self.farmer_user.id,
            'action': 'verify',
            'reason': 'Self verification attempt'
        })
        self.assertEqual(post_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_verify_and_suspend_provider_with_audit(self):
        """Audit: Admin can verify and suspend providers with actor and reason recorded."""
        provider = User.objects.create_user(
            username='pending_prov',
            password='provpassword123',
            role='provider'
        )
        ProviderProfile.objects.create(
            user=provider,
            business_name='Test Agri Services',
            verification_status='pending'
        )

        self.client.force_authenticate(user=self.admin_user)
        
        # 1. Admin verifies provider
        verify_res = self.client.post('/api/accounts/admin/verification/', {
            'user_id': provider.id,
            'action': 'verify',
            'reason': 'Verified via authorized physical inspection and document check.'
        })
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        
        provider.provider_profile.refresh_from_db()
        self.assertEqual(provider.provider_profile.verification_status, 'verified')
        self.assertEqual(provider.provider_profile.verified_by, self.admin_user)
        self.assertIsNotNone(provider.provider_profile.verified_at)

        # Verify audit log
        log = VerificationAuditLog.objects.filter(target_user=provider).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.action, 'verify')
        self.assertEqual(log.actor, self.admin_user)
        self.assertIn('physical inspection', log.reason)

        # 2. Admin suspends provider
        suspend_res = self.client.post('/api/accounts/admin/verification/', {
            'user_id': provider.id,
            'action': 'suspend',
            'reason': 'Repeated non-performance complaint under active investigation.'
        })
        self.assertEqual(suspend_res.status_code, status.HTTP_200_OK)
        provider.provider_profile.refresh_from_db()
        self.assertEqual(provider.provider_profile.verification_status, 'suspended')
        self.assertIsNotNone(provider.provider_profile.suspended_at)
        self.assertEqual(provider.provider_profile.suspension_reason, 'Repeated non-performance complaint under active investigation.')

        # Second audit log
        logs = VerificationAuditLog.objects.filter(target_user=provider)
        self.assertEqual(logs.count(), 2)
