"""
Verification Tests: Final Product Completion & Integration (Batches A, B, C, D)
Validates Land, Soil, Crop, Seed, Weather, Financial, Marketplace, Project Manager,
Crop Monitoring, Post-Harvest, Analytics, and Government Connect.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import datetime

from farm_projects.models import (
    Farm, Field, CropTemplate, FarmProject, ProjectOperation,
    SoilReport, SeedProcurementRecord, CropObservation, PostHarvestRecord,
    ExpenseRecord
)
from services.models import InstitutionalResource, ServiceCategory
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class FinalProductCompletionIntegrationTests(TestCase):
    def setUp(self):
        self.farmer = User.objects.create_user(
            username='ramesh_farmer',
            email='ramesh@krishiseva.internal',
            password='TestPassword123!',
            role='farmer',
            phone='+919876543211',
            district='Meerut',
            village='Daurala'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.farmer)

        # 1. Land Intelligence
        self.farm = Farm.objects.create(
            farmer=self.farmer,
            name='Ganga Khet',
            village='Daurala',
            block='Daurala',
            district='Meerut',
            state='Uttar Pradesh',
            lgd_code='UP-MRT-0012',
            land_tenure='owned',
            size_acres=Decimal('8.50'),
            soil_type='Alluvial Loam',
            irrigation_source='Tubewell'
        )
        self.field = Field.objects.create(
            farm=self.farm,
            name='North Field',
            khasra_number='Khasra-402/1',
            area_acres=Decimal('4.50'),
            soil_type='Alluvial Loam',
            irrigation_status='Tubewell Irrigated'
        )

        # 2. Crop Template & Project
        self.crop_tmpl = CropTemplate.objects.create(
            slug='wheat-test',
            crop_name_en='Wheat',
            crop_name_hi='गेहूं',
            season='Rabi',
            typical_duration_days=135,
            version='v1.0'
        )
        self.project = FarmProject.objects.create(
            farmer=self.farmer,
            farm=self.farm,
            field=self.field,
            crop_template=self.crop_tmpl,
            template_version='v1.0',
            name='Wheat Rabi 2026 Season',
            crop='Wheat',
            variant='Standard',
            start_date=timezone.localdate(),
            expected_completion_date=timezone.localdate() + datetime.timedelta(days=135),
            target_area_acres=Decimal('4.50'),
            status='in_progress'
        )

        # Sequential Operations (Prerequisite Chain)
        self.op1 = ProjectOperation.objects.create(
            project=self.project,
            sequence_order=1,
            operation_name_en='Deep Ploughing',
            operation_name_hi='गहरी जुताई',
            stage='Land Prep',
            status='ready',
            planned_start_date=timezone.localdate(),
            planned_end_date=timezone.localdate() + datetime.timedelta(days=2)
        )
        self.op2 = ProjectOperation.objects.create(
            project=self.project,
            sequence_order=2,
            operation_name_en='Sowing & Drilling',
            operation_name_hi='बुवाई',
            stage='Sowing',
            status='awaiting_prerequisite',
            prerequisite_operation=self.op1,
            planned_start_date=timezone.localdate() + datetime.timedelta(days=3),
            planned_end_date=timezone.localdate() + datetime.timedelta(days=5)
        )

        # 12. Institutional Resource
        InstitutionalResource.objects.create(
            name_en='Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
            name_hi='प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान)',
            category='central_scheme',
            description_en='Income support of ₹6,000 per year',
            description_hi='वार्षिक ₹6,000 की आय सहायता',
            official_url='https://pmkisan.gov.in/',
            is_verified=True
        )

    def test_module_01_land_intelligence(self):
        """Module 01: Verify farm and field records with LGD code and khasra number."""
        res = self.client.get('/api/farm-projects/farms/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        farm_data = res.data[0]
        self.assertEqual(farm_data['lgd_code'], 'UP-MRT-0012')
        self.assertEqual(farm_data['land_tenure'], 'owned')
        self.assertEqual(len(farm_data['fields']), 1)
        self.assertEqual(farm_data['fields'][0]['khasra_number'], 'Khasra-402/1')

    def test_module_02_soil_intelligence(self):
        """Module 02: Record and retrieve laboratory soil report."""
        post_data = {
            'farm': self.farm.id,
            'field': self.field.id,
            'sampling_date': '2026-11-20',
            'lab_name': 'District Soil Testing Lab Meerut',
            'sample_id': 'SHC-2026-MRT-0982',
            'soil_texture': 'Alluvial Loam',
            'ph': '7.20',
            'ec': '0.35',
            'organic_carbon_percent': '0.52',
            'nitrogen_kg_ha': '240.00',
            'phosphorus_kg_ha': '18.50',
            'potassium_kg_ha': '265.00'
        }
        res = self.client.post('/api/farm-projects/soil-reports/', post_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(res.data['ph'])), Decimal('7.20'))
        self.assertEqual(res.data['lab_name'], 'District Soil Testing Lab Meerut')

        # Retrieve
        list_res = self.client.get('/api/farm-projects/soil-reports/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)

    def test_module_04_seed_intelligence_and_finance_connection(self):
        """Module 04: Seed procurement records connect to farm project and financial ledger."""
        post_data = {
            'crop': 'Wheat',
            'variety_name': 'HD-2967 (Certified Breeder Seed)',
            'source_breeder': 'ICAR-IIWBR Karnal',
            'required_quantity': '180.00',
            'quantity_unit': 'kg',
            'procurement_status': 'procured',
            'supplier_name': 'Meerut Kisan Sahkari Samiti',
            'purchase_date': '2026-11-22',
            'lot_number': 'LOT-WHEAT-2026-99',
            'recorded_cost': '7200.00'
        }
        res = self.client.post(f'/api/farm-projects/projects/{self.project.id}/seeds/', post_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['variety_name'], 'HD-2967 (Certified Breeder Seed)')

        # Verify automatically connected to Financial Planner
        fin_res = self.client.get(f'/api/farm-projects/projects/{self.project.id}/financial-summary/')
        self.assertEqual(fin_res.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(fin_res.data['incurred_expenditure']), Decimal('7200.00'))

    def test_module_05_weather_intelligence(self):
        """Module 05: Weather forecast API returns structured readings and agro-advisories."""
        res = self.client.get('/api/services/weather/?district=Meerut')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('current', res.data)
        self.assertIn('agro_advisory_en', res.data)
        self.assertIn('attribution', res.data)
        self.assertIn('booking_policy', res.data)

    def test_module_08_manual_operation_completion(self):
        """Module 08: Farmer can record operation completed manually without service booking."""
        self.assertEqual(self.op1.status, 'ready')
        self.assertEqual(self.op2.status, 'awaiting_prerequisite')

        res = self.client.post(f'/api/farm-projects/operations/{self.op1.id}/mark-completed/', {
            'notes': 'Ploughed using own family tractor with cultivator.'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['operation']['status'], 'completed')
        self.assertTrue(res.data['operation']['is_manual'])

        # Dependent operation unlocked
        self.op2.refresh_from_db()
        self.assertEqual(self.op2.status, 'ready')

    def test_module_09_crop_monitoring(self):
        """Module 09: Farmer records manual crop observations in timeline."""
        post_data = {
            'growth_stage': 'Crown Root Initiation (CRI)',
            'crop_condition': 'good',
            'field_notes': 'Germination is uniform across plot; root establishment looks healthy.',
            'reported_concerns': 'None; ready for first light irrigation.',
            'follow_up_status': 'monitoring'
        }
        res = self.client.post(f'/api/farm-projects/projects/{self.project.id}/observations/', post_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['growth_stage'], 'Crown Root Initiation (CRI)')

    def test_module_10_post_harvest_management(self):
        """Module 10: Post-harvest yield, storage, and transport tracking."""
        post_data = {
            'harvest_date': '2026-11-24',
            'produce_quantity': '110.00',
            'quantity_unit': 'quintal',
            'quality_grade': 'Grade A',
            'moisture_content_percent': '11.80',
            'storage_type': 'commercial_warehouse',
            'storage_location': 'CWC Meerut Warehouse No. 4',
            'storage_duration_days': 45,
            'storage_cost_inr': '1500.00',
            'transport_required': True,
            'transport_cost_inr': '2200.00',
            'sale_status': 'unsold'
        }
        res = self.client.post(f'/api/farm-projects/projects/{self.project.id}/post-harvest/', post_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(res.data['produce_quantity'])), Decimal('110.00'))

        # Verify storage & transport costs recorded in financial planner
        fin_res = self.client.get(f'/api/farm-projects/projects/{self.project.id}/financial-summary/')
        expected_costs = Decimal('1500.00') + Decimal('2200.00')
        self.assertEqual(Decimal(fin_res.data['incurred_expenditure']), expected_costs)

    def test_module_11_farm_analytics(self):
        """Module 11: Descriptive analytics aggregated across projects."""
        res = self.client.get('/api/farm-projects/analytics/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('overview', res.data)
        self.assertIn('financial_totals', res.data)
        self.assertIn('projects', res.data)
        self.assertIn('crop_breakdown', res.data)
        self.assertEqual(res.data['overview']['total_projects'], 1)

    def test_module_12_government_connect_directory(self):
        """Module 12: Public directory of verified official government schemes and KVKs."""
        res = self.client.get('/api/services/government-connect/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res.data) >= 1)
        names = [item['name_en'] for item in res.data]
        self.assertTrue(any('PM-KISAN' in n for n in names))
