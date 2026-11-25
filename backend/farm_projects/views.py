import json
import datetime
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import (
    Farm, Field, CropTemplate, CropOperationTemplate,
    FarmProject, ProjectOperation, ProjectService,
    ExpenseRecord, PaymentRecord, RevenueRecord, FinancialAdjustment,
    SoilReport, SeedProcurementRecord, CropObservation, PostHarvestRecord
)
from .serializers import (
    FarmSerializer, FieldSerializer, CropTemplateSerializer,
    FarmProjectSerializer, ProjectOperationSerializer, ProjectServiceSerializer,
    ExpenseRecordSerializer, PaymentRecordSerializer, RevenueRecordSerializer, FinancialAdjustmentSerializer,
    SoilReportSerializer, SeedProcurementRecordSerializer, CropObservationSerializer, PostHarvestRecordSerializer
)
from bookings.models import ServiceRequest
from services.models import ServiceCategory
from accounts.permissions import IsAdminRole

class CropTemplateListView(generics.ListAPIView):
    """
    Standardized crop workflow templates for the 6 core crops and variants:
    Wheat, Paddy (Transplanted & DSR), Sugarcane (New & Ratoon), Mustard, Maize (Grain & Fodder), Potato.
    """
    permission_classes = [permissions.AllowAny]
    queryset = CropTemplate.objects.filter(is_active=True).prefetch_related('operations')
    serializer_class = CropTemplateSerializer
    pagination_class = None


class CropTemplateDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = CropTemplate.objects.filter(is_active=True).prefetch_related('operations')
    serializer_class = CropTemplateSerializer
    lookup_field = 'slug'


class FarmListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        farms = Farm.objects.filter(farmer=request.user).prefetch_related('fields').order_by('-created_at')
        serializer = FarmSerializer(farms, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_farmer() and not request.user.is_superuser:
            return Response({'error': 'Only farmers can register farms.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = FarmSerializer(data=request.data)
        if serializer.is_valid():
            farm = serializer.save(farmer=request.user)
            return Response(FarmSerializer(farm).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FarmDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FarmSerializer

    def get_queryset(self):
        return Farm.objects.filter(farmer=self.request.user)


class FieldListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, farm_pk):
        farm = get_object_or_404(Farm, pk=farm_pk, farmer=request.user)
        fields = farm.fields.all()
        return Response(FieldSerializer(fields, many=True).data)

    def post(self, request, farm_pk):
        farm = get_object_or_404(Farm, pk=farm_pk, farmer=request.user)
        serializer = FieldSerializer(data=request.data)
        if serializer.is_valid():
            field = serializer.save(farm=farm)
            return Response(FieldSerializer(field).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FarmProjectListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_farmer():
            projects = FarmProject.objects.filter(farmer=user).prefetch_related('project_operations', 'project_services').order_by('-created_at')
        elif user.is_admin_role():
            projects = FarmProject.objects.all().prefetch_related('project_operations', 'project_services').order_by('-created_at')
        else:
            # Providers & workers see only projects where they have a linked booking
            projects = FarmProject.objects.filter(
                project_operations__booking__provider=user
            ).distinct().prefetch_related('project_operations', 'project_services').order_by('-created_at')

        serializer = FarmProjectSerializer(projects, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_farmer() and not request.user.is_superuser:
            return Response({'error': 'Only registered farmers can create farm projects.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = FarmProjectSerializer(data=request.data)
        if serializer.is_valid():
            # Check crop template
            template_id = request.data.get('crop_template_id') or request.data.get('crop_template')
            crop_template = None
            if template_id:
                crop_template = CropTemplate.objects.filter(id=template_id).first()
            if not crop_template:
                # Fallback: match by crop slug or name
                crop_str = request.data.get('crop', '').lower()
                crop_template = CropTemplate.objects.filter(slug__iexact=crop_str).first()

            template_version = crop_template.version if crop_template else 'v1.0'

            project = serializer.save(
                farmer=request.user,
                crop_template=crop_template,
                template_version=template_version
            )

            # Automatically instantiate ProjectOperation tasks from CropTemplate if present
            if crop_template and crop_template.operations.exists():
                op_map = {}
                start_dt = project.start_date
                for tmpl_op in crop_template.operations.all():
                    op_start = start_dt + datetime.timedelta(days=tmpl_op.offset_start_days)
                    op_end = op_start + datetime.timedelta(days=tmpl_op.offset_duration_days)

                    prereq = None
                    if tmpl_op.sequence_order > 1 and (tmpl_op.sequence_order - 1) in op_map:
                        prereq = op_map[tmpl_op.sequence_order - 1]

                    proj_op = ProjectOperation.objects.create(
                        project=project,
                        sequence_order=tmpl_op.sequence_order,
                        operation_name_en=tmpl_op.operation_name_en,
                        operation_name_hi=tmpl_op.operation_name_hi,
                        stage=tmpl_op.stage,
                        service_category=tmpl_op.default_service_category,
                        status='ready' if tmpl_op.sequence_order == 1 else 'awaiting_prerequisite',
                        planned_start_date=op_start,
                        planned_end_date=op_end,
                        is_mandatory=tmpl_op.is_mandatory,
                        is_manual=False,
                        prerequisite_operation=prereq,
                        notes=tmpl_op.description
                    )
                    op_map[tmpl_op.sequence_order] = proj_op

            project.update_project_status()
            return Response(FarmProjectSerializer(project).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FarmProjectDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FarmProjectSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_farmer():
            return FarmProject.objects.filter(farmer=user).prefetch_related('project_operations', 'project_services')
        if user.is_admin_role():
            return FarmProject.objects.all().prefetch_related('project_operations', 'project_services')
        # Providers only see if linked
        return FarmProject.objects.filter(project_operations__booking__provider=user).distinct().prefetch_related('project_operations', 'project_services')


class ProjectOperationListCreateView(APIView):
    """
    Lists and creates custom manual operations within a FarmProject.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_pk):
        project = get_object_or_404(FarmProject, pk=project_pk)
        if project.farmer != request.user and not request.user.is_admin_role():
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        ops = project.project_operations.all()
        return Response(ProjectOperationSerializer(ops, many=True).data)

    def post(self, request, project_pk):
        project = get_object_or_404(FarmProject, pk=project_pk, farmer=request.user)
        serializer = ProjectOperationSerializer(data=request.data)
        if serializer.is_valid():
            op = serializer.save(project=project)
            project.update_project_status()
            return Response(ProjectOperationSerializer(op).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectOperationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    View or update an individual agricultural task/operation.
    Allows changing status (e.g. marking completed), dates, notes, and manual mode.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectOperationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_admin_role():
            return ProjectOperation.objects.all()
        return ProjectOperation.objects.filter(project__farmer=user)

    def perform_update(self, serializer):
        op = serializer.save()
        if op.status == 'completed' and not op.actual_completion_date:
            op.actual_completion_date = timezone.now().date()
            op.save()
            # If next operations depend on this, mark them 'ready' if awaiting
            for dependent in op.dependent_operations.filter(status='awaiting_prerequisite'):
                dependent.status = 'ready'
                dependent.save()
        op.project.update_project_status()


class ProjectAddServiceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        project = get_object_or_404(FarmProject, pk=pk, farmer=request.user)
        category_id = request.data.get('category')
        scope = request.data.get('scope_description', '')
        target_date = request.data.get('target_date', project.start_date)

        category = get_object_or_404(ServiceCategory, pk=category_id)

        ps = ProjectService.objects.create(
            project=project,
            category=category,
            scope_description=scope,
            target_date=target_date
        )

        # Create linked ServiceRequest automatically if requested
        auto_create_request = request.data.get('create_request', False)
        if auto_create_request:
            req = ServiceRequest.objects.create(
                farmer=request.user,
                category=category,
                farm_project=project,
                title=f"{category.name_en} - {project.name}",
                description=scope or f"Required for {project.crop} project on {project.target_area_acres} acres.",
                village=request.user.village,
                district=request.user.district,
                required_date=target_date,
                scope_quantity=f"{project.target_area_acres} Acres / {scope}",
                budget_max=request.data.get('budget_max')
            )
            ps.service_request = req
            ps.save()

        project.update_project_status()
        return Response(FarmProjectSerializer(project).data)


class ProjectFinancialSummaryView(APIView):
    """
    FINANCIAL PLANNER SUMMARY (Section 10, FIN-01 to FIN-12):
    Returns real-time computed financial summary for the project:
    estimates, commitments, incurred expenditure, advance payments,
    partial payments, refunds, outstanding balances, overpayment balances,
    budget variance, realized revenue, net surplus, and cost per acre.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        project = get_object_or_404(FarmProject, pk=pk)
        if not (request.user.is_admin_role() or project.farmer == request.user or project.project_operations.filter(booking__provider=request.user).exists()):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(project.get_financial_summary())


class ExpenseRecordListCreateView(APIView):
    """
    FIN-01, FIN-02, FIN-03:
    Lists or records planned estimates, confirmed commitments, or incurred expenses.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_pk):
        project = get_object_or_404(FarmProject, pk=project_pk)
        if not (request.user.is_admin_role() or project.farmer == request.user or project.project_operations.filter(booking__provider=request.user).exists()):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        expenses = project.expenses.all().prefetch_related('adjustments')
        return Response(ExpenseRecordSerializer(expenses, many=True).data)

    def post(self, request, project_pk):
        project = get_object_or_404(FarmProject, pk=project_pk)
        if project.farmer != request.user and not request.user.is_admin_role():
            return Response({'error': 'Only the farm project owner or admin can record expenses.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ExpenseRecordSerializer(data=request.data)
        if serializer.is_valid():
            expense = serializer.save(project=project)
            return Response(ExpenseRecordSerializer(expense).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PaymentRecordListCreateView(APIView):
    """
    FIN-04, FIN-05, FIN-06, FIN-11:
    Lists and records payments (advance, partial, final, refund) against a farm project or specific expense.
    Platform ledger recording only; live banking disabled.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_pk):
        project = get_object_or_404(FarmProject, pk=project_pk)
        if not (request.user.is_admin_role() or project.farmer == request.user or project.project_operations.filter(booking__provider=request.user).exists()):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        payments = project.payments.all()
        return Response(PaymentRecordSerializer(payments, many=True).data)

    def post(self, request, project_pk):
        project = get_object_or_404(FarmProject, pk=project_pk)
        if project.farmer != request.user and not request.user.is_admin_role() and not project.project_operations.filter(booking__provider=request.user).exists():
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = PaymentRecordSerializer(data=request.data)
        if serializer.is_valid():
            payer = request.user
            payment = serializer.save(project=project, payer=payer)
            return Response(PaymentRecordSerializer(payment).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RevenueRecordListCreateView(APIView):
    """
    FIN-12:
    Lists and records crop harvest sales revenues for the farm project.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_pk):
        project = get_object_or_404(FarmProject, pk=project_pk)
        if not (request.user.is_admin_role() or project.farmer == request.user):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        revenues = project.revenues.all()
        return Response(RevenueRecordSerializer(revenues, many=True).data)

    def post(self, request, project_pk):
        project = get_object_or_404(FarmProject, pk=project_pk)
        if project.farmer != request.user and not request.user.is_admin_role():
            return Response({'error': 'Only project owner can record revenue.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = RevenueRecordSerializer(data=request.data)
        if serializer.is_valid():
            rev = serializer.save(project=project)
            return Response(RevenueRecordSerializer(rev).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FinancialAdjustmentCreateView(APIView):
    """
    FIN-09:
    Creates an authorized adjustment against an expense record (penalties, rework credits, deductions).
    Requires authorized reviewer (project owner or admin) and explicit reason.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, expense_pk):
        expense = get_object_or_404(ExpenseRecord, pk=expense_pk)
        if expense.project.farmer != request.user and not request.user.is_admin_role():
            return Response({'error': 'Only project owner or admin can authorize adjustments.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = FinancialAdjustmentSerializer(data=request.data)
        if serializer.is_valid():
            adj = serializer.save(expense=expense, approved_by=request.user)
            return Response(FinancialAdjustmentSerializer(adj).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SoilReportListCreateView(APIView):
    """
    Module 02: Soil Intelligence
    Lists and records laboratory soil reports and Soil Health Card records.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        farm_id = request.query_params.get('farm')
        qs = SoilReport.objects.filter(farmer=request.user).select_related('farm', 'field')
        if farm_id:
            qs = qs.filter(farm_id=farm_id)
        serializer = SoilReportSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        farm_id = request.data.get('farm')
        farm = get_object_or_404(Farm, pk=farm_id, farmer=request.user)
        field_id = request.data.get('field')
        field = None
        if field_id:
            field = get_object_or_404(Field, pk=field_id, farm=farm)

        serializer = SoilReportSerializer(data=request.data)
        if serializer.is_valid():
            report = serializer.save(farmer=request.user, farm=farm, field=field)
            return Response(SoilReportSerializer(report).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SoilReportDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        report = get_object_or_404(SoilReport, pk=pk, farmer=request.user)
        return Response(SoilReportSerializer(report).data)

    def delete(self, request, pk):
        report = get_object_or_404(SoilReport, pk=pk, farmer=request.user)
        report.delete()
        return Response({'message': 'Soil report deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


class SeedProcurementRecordListCreateView(APIView):
    """
    Module 04: Seed Intelligence
    Lists and records seed variety selection, procurement, and expenditure.
    When seed cost > 0, automatically creates a linked commitment/incurred expense record.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_pk):
        project = get_object_or_404(FarmProject, pk=project_pk)
        if project.farmer != request.user and not request.user.is_admin_role():
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        records = project.seed_records.all()
        return Response(SeedProcurementRecordSerializer(records, many=True).data)

    def post(self, request, project_pk):
        project = get_object_or_404(FarmProject, pk=project_pk)
        if project.farmer != request.user and not request.user.is_admin_role():
            return Response({'error': 'Only project owner can record seed procurement.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = SeedProcurementRecordSerializer(data=request.data)
        if serializer.is_valid():
            seed_rec = serializer.save(project=project)
            cost = serializer.validated_data.get('recorded_cost', 0)
            if cost and float(cost) > 0:
                # Connect directly to Farm Financial Planner (FIN-03)
                ExpenseRecord.objects.create(
                    project=project,
                    title=f"Seed: {seed_rec.variety_name} ({seed_rec.required_quantity} {seed_rec.quantity_unit})",
                    category='seeds',
                    record_type='incurred' if seed_rec.procurement_status in ['procured', 'treated', 'sown'] else 'estimate',
                    amount=cost,
                    status='active',
                    notes=f"Supplier: {seed_rec.supplier_name or 'Local Dealer'} | Lot: {seed_rec.lot_number or 'N/A'}"
                )
                project.update_project_status()

            return Response(SeedProcurementRecordSerializer(seed_rec).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CropObservationListCreateView(APIView):
    """
    Module 09: Crop Monitoring
    Lists and records manual crop observation notes, growth stages, and field concerns.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_pk):
        project = get_object_or_404(FarmProject, pk=project_pk)
        if project.farmer != request.user and not request.user.is_admin_role():
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        observations = project.observations.select_related('operation').all()
        return Response(CropObservationSerializer(observations, many=True).data)

    def post(self, request, project_pk):
        project = get_object_or_404(FarmProject, pk=project_pk)
        if project.farmer != request.user and not request.user.is_admin_role():
            return Response({'error': 'Only project owner can add observations.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = CropObservationSerializer(data=request.data)
        if serializer.is_valid():
            obs = serializer.save(project=project)
            return Response(CropObservationSerializer(obs).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PostHarvestRecordListCreateView(APIView):
    """
    Module 10: Post-Harvest Management
    Tracks harvested produce volume, grading, storage facility status, and related transportation.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_pk):
        project = get_object_or_404(FarmProject, pk=project_pk)
        if project.farmer != request.user and not request.user.is_admin_role():
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        records = project.post_harvest_records.all()
        return Response(PostHarvestRecordSerializer(records, many=True).data)

    def post(self, request, project_pk):
        project = get_object_or_404(FarmProject, pk=project_pk)
        if project.farmer != request.user and not request.user.is_admin_role():
            return Response({'error': 'Only project owner can record post-harvest activities.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = PostHarvestRecordSerializer(data=request.data)
        if serializer.is_valid():
            ph_rec = serializer.save(project=project)

            # Record storage or transport costs into financial planner if present
            storage_cost = serializer.validated_data.get('storage_cost_inr', 0)
            if storage_cost and float(storage_cost) > 0:
                ExpenseRecord.objects.create(
                    project=project,
                    title=f"Post-Harvest Storage: {ph_rec.get_storage_type_display()} ({ph_rec.storage_duration_days} days)",
                    category='storage',
                    record_type='incurred',
                    amount=storage_cost,
                    status='active'
                )

            transport_cost = serializer.validated_data.get('transport_cost_inr', 0)
            if transport_cost and float(transport_cost) > 0:
                ExpenseRecord.objects.create(
                    project=project,
                    title=f"Post-Harvest Transport: {ph_rec.produce_quantity} {ph_rec.quantity_unit} to {ph_rec.storage_location or 'Facility'}",
                    category='transportation',
                    record_type='incurred',
                    amount=transport_cost,
                    status='active'
                )

            project.update_project_status()
            return Response(PostHarvestRecordSerializer(ph_rec).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectOperationManualCompleteView(APIView):
    """
    Module 08: Farm Project Manager
    Allows farmer to manually record an operation completed without purchasing an external service.
    Unlocks dependent stages from 'awaiting_prerequisite' to 'ready'.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        operation = get_object_or_404(ProjectOperation, pk=pk)
        if operation.project.farmer != request.user and not request.user.is_admin_role():
            return Response({'error': 'Only project owner can record manual task completion.'}, status=status.HTTP_403_FORBIDDEN)

        notes = request.data.get('notes', 'Completed manually by farmer.')
        updated_op = operation.mark_completed_manually(notes=notes)
        return Response({
            'message': f"Operation '{updated_op.operation_name_en}' marked as completed manually.",
            'operation': ProjectOperationSerializer(updated_op).data,
            'progress': updated_op.project.calculate_actual_progress()
        })


class FarmAnalyticsView(APIView):
    """
    Module 11: Farm Analytics
    Provides descriptive operational and financial summaries aggregated across all farmer projects.
    Uses authoritative database models as single source of truth (no duplicate calculation logic).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from decimal import Decimal
        user = request.user
        projects_qs = FarmProject.objects.filter(farmer=user)
        total_projects = projects_qs.count()
        active_projects = projects_qs.filter(status__in=['planning', 'ready', 'in_progress']).count()
        completed_projects = projects_qs.filter(status='completed').count()

        all_operations = ProjectOperation.objects.filter(project__farmer=user)
        total_ops = all_operations.count()
        completed_ops = all_operations.filter(status='completed').count()
        ready_ops = all_operations.filter(status='ready').count()
        today = timezone.localdate()
        overdue_ops = all_operations.filter(
            planned_end_date__lt=today
        ).exclude(status__in=['completed', 'cancelled']).count()

        # Cumulative Financials across all projects
        cum_planned = Decimal('0.00')
        cum_committed = Decimal('0.00')
        cum_incurred = Decimal('0.00')
        cum_payments = Decimal('0.00')
        cum_outstanding = Decimal('0.00')
        cum_revenue = Decimal('0.00')
        cum_surplus = Decimal('0.00')
        total_acres = Decimal('0.00')

        project_summaries = []
        crop_breakdown = {}

        for p in projects_qs:
            fin = p.get_financial_summary()
            cum_planned += Decimal(fin['planned_estimates'])
            cum_committed += Decimal(fin['confirmed_commitments'])
            cum_incurred += Decimal(fin['incurred_expenditure'])
            cum_payments += Decimal(fin['net_recorded_payments'])
            cum_outstanding += Decimal(fin['outstanding_balance'])
            cum_revenue += Decimal(fin['realized_revenue'])
            cum_surplus += Decimal(fin['recorded_surplus'])

            area = Decimal(str(p.target_area_acres or 0))
            total_acres += area

            prog = p.calculate_actual_progress()
            project_summaries.append({
                'id': p.id,
                'name': p.name,
                'crop': p.crop,
                'variant': p.variant,
                'status': p.status,
                'progress_percentage': prog.get('percentage'),
                'target_area_acres': str(area),
                'incurred_expenditure': fin['incurred_expenditure'],
                'realized_revenue': fin['realized_revenue'],
                'recorded_surplus': fin['recorded_surplus']
            })

            crop_key = p.crop or 'Other'
            if crop_key not in crop_breakdown:
                crop_breakdown[crop_key] = {
                    'project_count': 0,
                    'total_acres': Decimal('0.00'),
                    'incurred': Decimal('0.00'),
                    'revenue': Decimal('0.00'),
                    'surplus': Decimal('0.00')
                }
            crop_breakdown[crop_key]['project_count'] += 1
            crop_breakdown[crop_key]['total_acres'] += area
            crop_breakdown[crop_key]['incurred'] += Decimal(fin['incurred_expenditure'])
            crop_breakdown[crop_key]['revenue'] += Decimal(fin['realized_revenue'])
            crop_breakdown[crop_key]['surplus'] += Decimal(fin['recorded_surplus'])

        # Format crop breakdown
        formatted_crop_breakdown = {}
        for c_name, c_data in crop_breakdown.items():
            formatted_crop_breakdown[c_name] = {
                'project_count': c_data['project_count'],
                'total_acres': str(c_data['total_acres']),
                'incurred': str(c_data['incurred']),
                'revenue': str(c_data['revenue']),
                'surplus': str(c_data['surplus'])
            }

        return Response({
            'overview': {
                'total_projects': total_projects,
                'active_projects': active_projects,
                'completed_projects': completed_projects,
                'total_cultivated_acres': str(total_acres),
                'total_operations': total_ops,
                'completed_operations': completed_ops,
                'ready_operations': ready_ops,
                'overdue_operations': overdue_ops
            },
            'financial_totals': {
                'planned_estimates': str(cum_planned),
                'confirmed_commitments': str(cum_committed),
                'incurred_expenditure': str(cum_incurred),
                'net_recorded_payments': str(cum_payments),
                'outstanding_balance': str(cum_outstanding),
                'realized_revenue': str(cum_revenue),
                'recorded_surplus': str(cum_surplus),
                'economic_disclaimer': 'Descriptive operational and financial summary based on platform records; not a certified financial audit.'
            },
            'projects': project_summaries,
            'crop_breakdown': formatted_crop_breakdown
        })


class ProjectOperationRequestServiceView(APIView):
    """
    Step 9: Connects agricultural operation to the Service Matching Engine.
    Allows farmer to select an operation, validate that it has no conflicting or duplicate
    active service request / booking, and generate a linked ServiceRequest.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        op = get_object_or_404(ProjectOperation, pk=pk)
        project = op.project

        if project.farmer != request.user and not request.user.is_admin_role():
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        # Check existing active request or booking (prevent duplicate fulfillments)
        if op.service_request and op.service_request.status in ['open', 'quote_accepted', 'booked']:
            return Response({
                'error': f"Operation '{op.operation_name_en}' already has an active Service Request (REQ-{op.service_request_id}).",
                'service_request_id': op.service_request_id
            }, status=status.HTTP_400_BAD_REQUEST)

        if op.booking and op.booking.status in ['confirmed', 'scheduled', 'in_progress', 'completion_pending']:
            return Response({
                'error': f"Operation '{op.operation_name_en}' already has an active Confirmed Booking ({op.booking.reference_id}).",
                'booking_id': op.booking_id
            }, status=status.HTTP_400_BAD_REQUEST)

        category = op.service_category
        if not category:
            cat_id = request.data.get('category_id') or request.data.get('category')
            if cat_id:
                category = get_object_or_404(ServiceCategory, pk=cat_id)
            else:
                return Response({'error': 'A service category must be selected for this operation.'}, status=status.HTTP_400_BAD_REQUEST)

        # Extract delivery location from field and farm
        field = project.field
        farm = project.farm
        village = farm.village if farm else request.user.village
        district = farm.district if farm else request.user.district
        state = farm.state if farm else request.user.state

        title = request.data.get('title') or f"{op.operation_name_en} — {project.name}"
        field_note = f" [Field: {field.name} (Khasra: {field.khasra_number or 'N/A'}, {field.area_acres} Acres)]" if field else ""
        desc = request.data.get('description') or f"Required for {project.crop} operation '{op.operation_name_en}' in {project.name}.{field_note}"
        scope = request.data.get('scope_quantity') or f"{field.area_acres if field else project.target_area_acres} Acres / {op.operation_name_en}"
        req_date = request.data.get('required_date') or op.planned_start_date or timezone.localdate()

        from bookings.models import ServiceRequest
        srv_req = ServiceRequest.objects.create(
            farmer=request.user,
            category=category,
            farm_project=project,
            title=title,
            description=desc,
            village=village,
            district=district,
            state=state,
            required_date=req_date,
            scope_quantity=scope,
            budget_max=request.data.get('budget_max')
        )

        op.service_category = category
        op.service_request = srv_req
        op.status = 'service_requested'
        op.save()

        project.update_project_status()

        from bookings.serializers import ServiceRequestSerializer
        return Response({
            'message': f"Linked service request created for operation '{op.operation_name_en}'.",
            'service_request': ServiceRequestSerializer(srv_req).data,
            'operation_id': op.id,
            'operation_status': op.status
        }, status=status.HTTP_201_CREATED)



