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

    def test_adult_registration_requirement(self):
        """Compliance: Adult declaration is strictly required for workers and providers."""
        # 1. Worker fails without adult confirmation
        fail_payload = {
            'username': 'minor_worker',
            'email': 'minor_worker@test.com',
            'password': 'workerpassword123',
            'role': 'worker',
            'skills': 'Harvesting',
            'daily_wage_rate': '500.00',
            'confirm_adult': False,
        }
        res = self.client.post('/api/accounts/register/', fail_payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirm_adult', res.data)

        # 2. Provider fails without adult confirmation
        fail_prov = {
            'username': 'minor_provider',
            'email': 'minor_prov@test.com',
            'password': 'provpassword123',
            'role': 'provider',
            'business_name': 'Young Agro',
            'confirm_adult': False,
        }
        res_prov = self.client.post('/api/accounts/register/', fail_prov)
        self.assertEqual(res_prov.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirm_adult', res_prov.data)

        # 3. Adult worker succeeds and consent records is_adult_confirmed=True
        pass_payload = {
            'username': 'adult_worker_valid',
            'email': 'adult_worker@test.com',
            'password': 'workerpassword123',
            'role': 'worker',
            'skills': 'Harvesting, Threshing',
            'daily_wage_rate': '550.00',
            'confirm_adult': True,
        }
        res_pass = self.client.post('/api/accounts/register/', pass_payload)
        self.assertEqual(res_pass.status_code, status.HTTP_201_CREATED)
        worker_user = User.objects.get(username='adult_worker_valid')
        consent = UserConsent.objects.get(user=worker_user)
        self.assertTrue(consent.is_adult_confirmed)
        self.assertTrue(consent.terms_accepted)

    def test_password_recovery_and_token_revocation(self):
        """Security: Password recovery sends reset token, verifies it, resets password, and revokes prior tokens."""
        user = User.objects.create_user(
            username='reset_target_user',
            email='reset_target@krishiseva.in',
            password='InitialPassword@123',
            role='farmer'
        )
        from rest_framework.authtoken.models import Token
        initial_token = Token.objects.create(user=user)

        # 1. Request password reset
        req_res = self.client.post('/api/accounts/password-reset/request/', {
            'email': 'reset_target@krishiseva.in'
        })
        self.assertEqual(req_res.status_code, status.HTTP_200_OK)
        uid = req_res.data.get('dev_uid')
        token = req_res.data.get('dev_token')
        self.assertIsNotNone(uid)
        self.assertIsNotNone(token)

        # 2. Confirm reset with new password
        confirm_res = self.client.post('/api/accounts/password-reset/confirm/', {
            'uid': uid,
            'token': token,
            'new_password': 'UpdatedPassword@456'
        })
        self.assertEqual(confirm_res.status_code, status.HTTP_200_OK)
        fresh_token = confirm_res.data.get('token')
        self.assertNotEqual(initial_token.key, fresh_token)

        # Prior token should be deleted
        self.assertFalse(Token.objects.filter(key=initial_token.key).exists())

        # Old password cannot login, new password works
        old_login = self.client.post('/api/accounts/login/', {
            'username': 'reset_target_user',
            'password': 'InitialPassword@123'
        })
        self.assertEqual(old_login.status_code, status.HTTP_401_UNAUTHORIZED)

        new_login = self.client.post('/api/accounts/login/', {
            'username': 'reset_target_user',
            'password': 'UpdatedPassword@456'
        })
        self.assertEqual(new_login.status_code, status.HTTP_200_OK)

    def test_change_password_and_token_revocation(self):
        """Security: Authenticated password change revokes old credentials."""
        user = User.objects.create_user(
            username='changepw_user',
            email='changepw@test.com',
            password='OldPassword@123',
            role='farmer'
        )
        from rest_framework.authtoken.models import Token
        old_token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {old_token.key}')

        # Try with wrong old password
        bad_res = self.client.post('/api/accounts/change-password/', {
            'old_password': 'WrongPassword999',
            'new_password': 'BrandNewPassword@789'
        })
        self.assertEqual(bad_res.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid password change
        good_res = self.client.post('/api/accounts/change-password/', {
            'old_password': 'OldPassword@123',
            'new_password': 'BrandNewPassword@789'
        })
        self.assertEqual(good_res.status_code, status.HTTP_200_OK)
        fresh_token_key = good_res.data.get('token')
        self.assertNotEqual(old_token.key, fresh_token_key)

        # Old token is revoked
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {old_token.key}')
        me_check = self.client.get('/api/accounts/me/')
        self.assertEqual(me_check.status_code, status.HTTP_401_UNAUTHORIZED)

        # New token works
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {fresh_token_key}')
        me_pass = self.client.get('/api/accounts/me/')
        self.assertEqual(me_pass.status_code, status.HTTP_200_OK)

    def test_revoke_token_endpoint(self):
        """Security: Dedicated token revocation endpoint destroys active session."""
        from rest_framework.authtoken.models import Token
        token = Token.objects.create(user=self.farmer_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

        revoke_res = self.client.post('/api/accounts/revoke-token/')
        self.assertEqual(revoke_res.status_code, status.HTTP_200_OK)

        # Calling authenticated endpoint with revoked token fails
        after_check = self.client.get('/api/accounts/me/')
        self.assertEqual(after_check.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_suspended_provider_restricted_from_service_and_coverage(self):
        """Security: Suspended provider cannot add coverage areas or service offerings."""
        provider_user = User.objects.create_user(
            username='suspended_prov_user',
            password='provpassword123',
            role='provider'
        )
        profile = ProviderProfile.objects.create(
            user=provider_user,
            business_name='Suspended Agro Workshop',
            verification_status='suspended',
            suspension_reason='Regulatory inspection pending.'
        )
        self.client.force_authenticate(user=provider_user)

        # Try to configure coverage area
        cov_res = self.client.post('/api/services/provider/coverage/', {
            'coverage_level': 'district',
        })
        self.assertEqual(cov_res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Suspended', cov_res.data.get('error', ''))

        # Try to configure provider service
        srv_res = self.client.post('/api/services/provider/services/', {
            'category_id': 1,
            'title': 'Unauthorized Tractor Service',
            'price_amount': '1500.00'
        })
        self.assertEqual(srv_res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Suspended', srv_res.data.get('error', ''))

    def test_language_preference_persistence(self):
        """Localization: Hindi-English language preference persists on profile."""
        from .models import FarmerProfile
        FarmerProfile.objects.create(
            user=self.farmer_user,
            preferred_language='hi',
            total_land_acres='15.0'
        )
        self.client.force_authenticate(user=self.farmer_user)

        # Update language to English
        res = self.client.put('/api/accounts/me/', {
            'preferred_language': 'en'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get('preferred_language'), 'en')

        self.farmer_user.farmer_profile.refresh_from_db()
        self.assertEqual(self.farmer_user.farmer_profile.preferred_language, 'en')
