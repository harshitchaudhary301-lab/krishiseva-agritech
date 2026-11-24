from django.test import TestCase
from django.core.management import call_command
from rest_framework.test import APIClient
from rest_framework import status
from .models import (
    ServiceCategory, HistoricalMachineryRate,
    HistoricalAgriculturalWage, AgriculturalReferenceRecord
)
from accounts.models import User, ProviderProfile, WorkerProfile

class AgriculturalReferenceDataTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Seed reference data via management command
        call_command('import_agricultural_reference_data')

    def test_import_command_counts_and_idempotency(self):
        """Batch 03B: Verification of canonical reference data counts and idempotency."""
        self.assertEqual(HistoricalMachineryRate.objects.count(), 27)
        self.assertEqual(HistoricalAgriculturalWage.objects.count(), 22)
        self.assertEqual(AgriculturalReferenceRecord.objects.count(), 360)

        # Run command again - counts must remain identical (zero duplicates)
        call_command('import_agricultural_reference_data')
        self.assertEqual(HistoricalMachineryRate.objects.count(), 27)
        self.assertEqual(HistoricalAgriculturalWage.objects.count(), 22)
        self.assertEqual(AgriculturalReferenceRecord.objects.count(), 360)

    def test_strict_historical_separation_flags(self):
        """Rule 4.6: Historical rates and wages must be indicative only, never binding contracts."""
        for rate in HistoricalMachineryRate.objects.all():
            self.assertTrue(rate.is_indicative_only)
            self.assertIn("Historical", rate.disclaimer)

        for wage in HistoricalAgriculturalWage.objects.all():
            self.assertTrue(wage.is_indicative_only)
            self.assertIn("Historical", wage.disclaimer)

    def test_reference_data_api_endpoints(self):
        """API Contract: Read-only reference endpoints for planning."""
        res_machinery = self.client.get('/api/services/reference-data/machinery-rates/')
        self.assertEqual(res_machinery.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_machinery.data), 27)

        res_wages = self.client.get('/api/services/reference-data/wages/?year=2024-25')
        self.assertEqual(res_wages.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res_wages.data) > 0)
        for w in res_wages.data:
            self.assertEqual(w['reference_year'], '2024-25')

        res_records = self.client.get('/api/services/reference-data/records/?state=Uttar Pradesh')
        self.assertEqual(res_records.status_code, status.HTTP_200_OK)
        self.assertTrue(res_records.data['count'] > 0)

    def test_provider_directory_verification_filter(self):
        """Marketplace Discovery: Provider directory filters by verification status."""
        v_user = User.objects.create_user(username='verified_prov', password='password123', role='provider')
        ProviderProfile.objects.create(
            user=v_user, business_name='Verified Harvesters',
            verification_status='verified', service_categories='harvesting'
        )

        p_user = User.objects.create_user(username='pending_prov', password='password123', role='provider')
        ProviderProfile.objects.create(
            user=p_user, business_name='Unverified New Provider',
            verification_status='pending', service_categories='harvesting'
        )

        # Filter only verified
        res = self.client.get('/api/services/providers/?verification=verified&category=harvesting')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        usernames = [u['username'] for u in res.data]
        self.assertIn('verified_prov', usernames)
        self.assertNotIn('pending_prov', usernames)
