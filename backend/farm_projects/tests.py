import datetime
from django.test import TestCase
from django.core.management import call_command
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from farm_projects.models import Farm, Field, CropTemplate, FarmProject, ProjectOperation

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
