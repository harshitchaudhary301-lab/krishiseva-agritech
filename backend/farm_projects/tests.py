import datetime
from decimal import Decimal
from django.test import TestCase
from django.core.management import call_command
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from farm_projects.models import (
    Farm, Field, CropTemplate, FarmProject, ProjectOperation,
    ExpenseRecord, PaymentRecord, RevenueRecord, FinancialAdjustment
)
from bookings.models import ServiceRequest, Quotation, Booking
from services.models import ServiceCategory

class FarmProjectManagerTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        call_command('import_agricultural_reference_data')
        call_command('seed_crop_templates')

        self.farmer = User.objects.create_user(
            username='farmer_test_c',
            password='password123',
            role='farmer'
        )
        self.farm = Farm.objects.create(
            farmer=self.farmer,
            name='Kisan Green Farm',
            village='Daurala',
            district='Meerut',
            size_acres=20.0
        )
        self.field = Field.objects.create(
            farm=self.farm,
            name='Khasra 101 (North Field)',
            area_acres=10.0
        )
        self.client.force_authenticate(user=self.farmer)

    def test_all_six_crops_and_variants_exist(self):
        """Batch 03C: All 6 crop templates and required variants must exist."""
        required_slugs = [
            'wheat',
            'paddy_transplanted', 'paddy_dsr',
            'sugarcane_new', 'sugarcane_ratoon',
            'mustard',
            'maize_grain', 'maize_fodder',
            'potato'
        ]
        for slug in required_slugs:
            tmpl = CropTemplate.objects.filter(slug=slug).first()
            self.assertIsNotNone(tmpl, f"Crop template for {slug} must exist")
            self.assertTrue(tmpl.operations.count() > 0, f"{slug} must have operation templates")

    def test_project_creation_instantiates_operations_from_template(self):
        """Batch 03C: Creating a project with crop template generates sequence tasks."""
        wheat_tmpl = CropTemplate.objects.get(slug='wheat')
        start_date = datetime.date(2026, 11, 15)

        payload = {
            'farm': self.farm.id,
            'field': self.field.id,
            'crop_template_id': wheat_tmpl.id,
            'name': 'Rabi Wheat Project 2026',
            'crop': 'Wheat',
            'variant': 'High-Yielding',
            'target_area_acres': '10.00',
            'start_date': str(start_date),
            'expected_completion_date': str(start_date + datetime.timedelta(days=135)),
        }
        res = self.client.post('/api/farm-projects/projects/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        project_id = res.data['id']
        project = FarmProject.objects.get(id=project_id)
        self.assertEqual(project.template_version, wheat_tmpl.version)
        self.assertEqual(project.project_operations.count(), wheat_tmpl.operations.count())

        # Verify initial task status
        first_op = project.project_operations.get(sequence_order=1)
        self.assertEqual(first_op.status, 'ready')
        self.assertEqual(first_op.planned_start_date, start_date)

        second_op = project.project_operations.get(sequence_order=2)
        self.assertEqual(second_op.status, 'awaiting_prerequisite')
        self.assertEqual(second_op.prerequisite_operation, first_op)

    def test_circular_dependency_is_rejected(self):
        """Batch 03C: Circular task dependencies must be strictly rejected."""
        project = FarmProject.objects.create(
            farmer=self.farmer,
            farm=self.farm,
            name='Test Dep Project',
            crop='Wheat',
            target_area_acres=10.0,
            start_date=datetime.date(2026, 11, 1),
            expected_completion_date=datetime.date(2027, 3, 1)
        )
        op1 = ProjectOperation.objects.create(
            project=project,
            sequence_order=1,
            operation_name_en='Task 1',
            operation_name_hi='काम 1',
            stage='Prep',
            planned_start_date=datetime.date(2026, 11, 1),
            planned_end_date=datetime.date(2026, 11, 3)
        )
        op2 = ProjectOperation.objects.create(
            project=project,
            sequence_order=2,
            operation_name_en='Task 2',
            operation_name_hi='काम 2',
            stage='Sow',
            planned_start_date=datetime.date(2026, 11, 4),
            planned_end_date=datetime.date(2026, 11, 6),
            prerequisite_operation=op1
        )

        # Trying to make op1 depend on op2 (creating cycle op1 -> op2 -> op1)
        op1.prerequisite_operation = op2
        with self.assertRaises(ValidationError):
            op1.clean()

    def test_progress_calculation_rules(self):
        """
        Batch 03C Progress Rules:
        - Scheduling does NOT falsely increase completion.
        - Actual progress = completed / applicable.
        - Cancelled tasks do not distort progress.
        - No applicable tasks returns None / 'No applicable tasks available'.
        """
        project = FarmProject.objects.create(
            farmer=self.farmer,
            farm=self.farm,
            name='Progress Test Project',
            crop='Mustard',
            target_area_acres=5.0,
            start_date=datetime.date(2026, 10, 1),
            expected_completion_date=datetime.date(2027, 2, 1)
        )

        # 1. No applicable tasks
        prog = project.calculate_actual_progress()
        self.assertFalse(prog['has_progress'])
        self.assertIsNone(prog['percentage'])

        # 2. Add 3 tasks
        op1 = ProjectOperation.objects.create(
            project=project, sequence_order=1, operation_name_en='Tillage',
            operation_name_hi='जुताई', stage='Prep', status='planned',
            planned_start_date=datetime.date(2026, 10, 1), planned_end_date=datetime.date(2026, 10, 3)
        )
        op2 = ProjectOperation.objects.create(
            project=project, sequence_order=2, operation_name_en='Sowing',
            operation_name_hi='बुवाई', stage='Sow', status='scheduled',  # Scheduled booking does NOT complete operation!
            planned_start_date=datetime.date(2026, 10, 4), planned_end_date=datetime.date(2026, 10, 6)
        )
        op3 = ProjectOperation.objects.create(
            project=project, sequence_order=3, operation_name_en='Weeding',
            operation_name_hi='निराई', stage='Care', status='planned',
            planned_start_date=datetime.date(2026, 10, 20), planned_end_date=datetime.date(2026, 10, 22)
        )

        prog = project.calculate_actual_progress()
        self.assertTrue(prog['has_progress'])
        self.assertEqual(prog['completed_count'], 0)  # Scheduled task is NOT counted as completed
        self.assertEqual(prog['percentage'], 0.0)

        # 3. Mark op1 completed
        op1.status = 'completed'
        op1.save()
        prog = project.calculate_actual_progress()
        self.assertEqual(prog['completed_count'], 1)
        self.assertEqual(prog['total_applicable'], 3)
        self.assertEqual(prog['percentage'], 33.3)

        # 4. Cancel op3 (e.g. weedless field, bypassed)
        op3.status = 'cancelled'
        op3.save()
        prog = project.calculate_actual_progress()
        # Cancelled task excluded from denominator: applicable = 2, completed = 1 => 50%
        self.assertEqual(prog['completed_count'], 1)
        self.assertEqual(prog['total_applicable'], 2)
        self.assertEqual(prog['percentage'], 50.0)


class FinancialPlannerTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.farmer = User.objects.create_user(
            username='farmer_fin',
            password='password123',
            role='farmer',
            first_name='Ramesh',
            last_name='Kumar',
            phone='9876543201',
            village='Daurala',
            district='Meerut'
        )
        self.provider = User.objects.create_user(
            username='provider_fin',
            password='password123',
            role='provider',
            first_name='Suresh',
            last_name='Singh',
            phone='9876543202',
            village='Daurala',
            district='Meerut'
        )
        self.farm = Farm.objects.create(
            farmer=self.farmer,
            name='Kisan Green Farm',
            village='Daurala',
            district='Meerut',
            size_acres=10.0
        )
        self.project = FarmProject.objects.create(
            farmer=self.farmer,
            farm=self.farm,
            name='Rabi Wheat 2026',
            crop='Wheat',
            target_area_acres=10.0,
            start_date=datetime.date(2026, 11, 1),
            expected_completion_date=datetime.date(2027, 3, 15)
        )
        self.category, _ = ServiceCategory.objects.get_or_create(
            slug='land-preparation',
            defaults={
                'name_en': 'Land Preparation',
                'name_hi': 'खेत की तैयारी'
            }
        )
        self.client.force_authenticate(user=self.farmer)

    def test_mandatory_synthetic_fixture_fin_01_to_06(self):
        """
        MANDATORY SYNTHETIC FIXTURE (Section 10 & FIN-01 to FIN-06):
        - Planned estimate: ₹5,000
        - Confirmed commitment: ₹3,000
        - Advance payment: ₹500
        - Final incurred expense approved: ₹2,800
        - Outstanding balance payable: ₹2,300 (₹2,800 - ₹500)
        - Advance payment must NOT increase incurred expenditure.
        - Previous commitment must be marked fulfilled and excluded from active commitments.
        """
        # 1. Planned estimate ₹5,000 (FIN-01)
        ExpenseRecord.objects.create(
            project=self.project,
            category='machinery',
            record_type='estimate',
            title='Planned Land Prep Estimate',
            amount=Decimal('5000.00'),
            status='active'
        )

        # 2. Confirmed commitment ₹3,000 (FIN-02)
        commitment = ExpenseRecord.objects.create(
            project=self.project,
            category='machinery',
            record_type='commitment',
            title='Contracted Tillage Service',
            amount=Decimal('3000.00'),
            status='active'
        )

        summary_pre = self.project.get_financial_summary()
        self.assertEqual(summary_pre['planned_estimates'], '5000.00')
        self.assertEqual(summary_pre['confirmed_commitments'], '3000.00')
        self.assertEqual(summary_pre['incurred_expenditure'], '0.00')
        self.assertEqual(summary_pre['total_recorded_payments'], '0.00')
        self.assertEqual(summary_pre['outstanding_balance'], '0.00')

        # 3. Advance payment ₹500 recorded (FIN-04)
        PaymentRecord.objects.create(
            project=self.project,
            payer=self.farmer,
            payee=self.provider,
            payment_type='advance',
            amount=Decimal('500.00')
        )

        summary_adv = self.project.get_financial_summary()
        self.assertEqual(summary_adv['recorded_advance_payments'], '500.00')
        # Advance payment must NOT increase incurred expenditure!
        self.assertEqual(summary_adv['incurred_expenditure'], '0.00')
        self.assertEqual(summary_adv['overpayment_balance'], '500.00')

        # 4. Service completed and approved at final incurred ₹2,800 (FIN-03)
        # Commitment transitions to fulfilled (FIN-02, FIN-08)
        commitment.status = 'fulfilled'
        commitment.save()

        ExpenseRecord.objects.create(
            project=self.project,
            category='machinery',
            record_type='incurred',
            title='Completed Tillage',
            amount=Decimal('2800.00'),
            status='active'
        )

        # 5. Check final outstanding balance (FIN-06)
        summary_final = self.project.get_financial_summary()
        self.assertEqual(summary_final['planned_estimates'], '5000.00')
        self.assertEqual(summary_final['confirmed_commitments'], '0.00')
        self.assertEqual(summary_final['incurred_expenditure'], '2800.00')
        self.assertEqual(summary_final['recorded_advance_payments'], '500.00')
        self.assertEqual(summary_final['net_recorded_payments'], '500.00')
        self.assertEqual(summary_final['outstanding_balance'], '2300.00')  # Exactly ₹2,800 - ₹500 = ₹2,300
        self.assertEqual(summary_final['overpayment_balance'], '0.00')

    def test_overpayment_and_refund_lifecycle_fin_07_fin_11(self):
        """
        FIN-07 & FIN-11:
        - Overpayment when payments exceed incurred liability.
        - Refund reduces net payments made and restores outstanding balance.
        """
        # Incurred expense ₹1,000
        ExpenseRecord.objects.create(
            project=self.project,
            category='labour',
            record_type='incurred',
            title='Weeding Labour',
            amount=Decimal('1000.00'),
            status='active'
        )

        # Farmer paid ₹1,200 (overpayment ₹200)
        PaymentRecord.objects.create(
            project=self.project,
            payer=self.farmer,
            payee=self.provider,
            payment_type='final',
            amount=Decimal('1200.00')
        )

        summary1 = self.project.get_financial_summary()
        self.assertEqual(summary1['outstanding_balance'], '0.00')
        self.assertEqual(summary1['overpayment_balance'], '200.00')

        # Provider issues ₹200 refund
        PaymentRecord.objects.create(
            project=self.project,
            payer=self.provider,
            payee=self.farmer,
            payment_type='refund',
            amount=Decimal('200.00')
        )

        summary2 = self.project.get_financial_summary()
        self.assertEqual(summary2['refunds'], '200.00')
        self.assertEqual(summary2['net_recorded_payments'], '1000.00')
        self.assertEqual(summary2['outstanding_balance'], '0.00')
        self.assertEqual(summary2['overpayment_balance'], '0.00')

    def test_cancellation_releases_commitment_fin_08(self):
        """
        FIN-08: Booking cancellation releases confirmed commitment from financial obligations.
        """
        future_date = datetime.date.today() + datetime.timedelta(days=5)
        service_req = ServiceRequest.objects.create(
            farmer=self.farmer,
            category=self.category,
            farm_project=self.project,
            title='Need Rotavator',
            village='Daurala',
            district='Meerut',
            required_date=future_date,
            scope_quantity='10 Acres'
        )
        quote = Quotation.objects.create(
            request=service_req,
            provider=self.provider,
            unit_price=Decimal('800.00'),
            quantity=Decimal('10.00'),
            billing_unit='per_acre',
            quote_amount=Decimal('8000.00'),
            proposed_schedule=future_date,
            expiry_date=future_date + datetime.timedelta(days=2)
        )
        # Farmer accepts quote via API
        res = self.client.post(f'/api/bookings/quotations/{quote.id}/accept/', {
            'expected_version': 1
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        booking_id = res.data['booking_id']

        # Verify commitment is active
        summary1 = self.project.get_financial_summary()
        self.assertEqual(summary1['confirmed_commitments'], '8000.00')

        # Cancel booking
        self.client.force_authenticate(user=self.farmer)
        cancel_res = self.client.post(f'/api/bookings/{booking_id}/cancel/', {
            'reason': 'Heavy rain predicted; operation cancelled.'
        })
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)

        # Commitment must now be released (FIN-08)
        summary2 = self.project.get_financial_summary()
        self.assertEqual(summary2['confirmed_commitments'], '0.00')

    def test_authorized_adjustment_fin_09(self):
        """
        FIN-09: Financial adjustments (penalties, rework deductions) adjust incurred expense.
        """
        incurred = ExpenseRecord.objects.create(
            project=self.project,
            category='machinery',
            record_type='incurred',
            title='Harvester Service',
            amount=Decimal('3000.00'),
            status='active'
        )
        # Add deduction adjustment of -₹300
        res = self.client.post(f'/api/farm-projects/expenses/{incurred.id}/adjustments/', {
            'amount': '-300.00',
            'reason': 'Field boundary damaged; rework discount agreed.'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        summary = self.project.get_financial_summary()
        # Incurred expenditure = ₹3,000 - ₹300 = ₹2,700
        self.assertEqual(summary['incurred_expenditure'], '2700.00')

    def test_revenue_and_project_surplus_fin_12(self):
        """
        FIN-12: Harvest revenue records and net surplus calculation.
        """
        # Incurred expenses ₹2,000
        ExpenseRecord.objects.create(
            project=self.project,
            category='machinery',
            record_type='incurred',
            title='Tillage and Sowing',
            amount=Decimal('2000.00'),
            status='active'
        )

        # Record crop sale: 50 quintals @ ₹300/quintal = ₹15,000
        rev_res = self.client.post(f'/api/farm-projects/projects/{self.project.id}/revenues/', {
            'crop': 'Wheat',
            'quantity_quintals': '50.00',
            'rate_per_quintal': '300.00',
            'buyer_name': 'Meerut Grain Mandi',
            'sale_date': '2027-03-20'
        })
        self.assertEqual(rev_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(rev_res.data['total_realized_revenue'], '15000.00')

        summary = self.project.get_financial_summary()
        self.assertEqual(summary['realized_revenue'], '15000.00')
        self.assertEqual(summary['incurred_expenditure'], '2000.00')
        # Surplus = ₹15,000 - ₹2,000 = ₹13,000
        self.assertEqual(summary['recorded_surplus'], '13000.00')
        # Area = 10 acres, cost per acre = ₹2,000 / 10 = ₹200.00
        self.assertEqual(summary['cost_per_acre'], '200.00')

