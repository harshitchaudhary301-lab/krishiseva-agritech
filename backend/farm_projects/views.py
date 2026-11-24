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
    ExpenseRecord, PaymentRecord, RevenueRecord, FinancialAdjustment
)
from .serializers import (
    FarmSerializer, FieldSerializer, CropTemplateSerializer,
    FarmProjectSerializer, ProjectOperationSerializer, ProjectServiceSerializer,
    ExpenseRecordSerializer, PaymentRecordSerializer, RevenueRecordSerializer, FinancialAdjustmentSerializer
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

