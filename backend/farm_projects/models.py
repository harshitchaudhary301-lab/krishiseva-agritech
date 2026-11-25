from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone

class Farm(models.Model):
    TENURE_CHOICES = [
        ('owned', 'Owner Cultivator'),
        ('leased', 'Leased In'),
        ('sharecropped', 'Sharecropped'),
    ]

    farmer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='farms')
    name = models.CharField(max_length=150, help_text="e.g. Ganga Khet, North Farm")
    village = models.CharField(max_length=100, default='Daurala')
    block = models.CharField(max_length=100, blank=True, default='Daurala')
    district = models.CharField(max_length=100, default='Meerut')
    state = models.CharField(max_length=100, default='Uttar Pradesh')
    lgd_code = models.CharField(max_length=50, blank=True, default='', help_text="Local Government Directory administrative code")
    land_tenure = models.CharField(max_length=50, choices=TENURE_CHOICES, default='owned')
    size_acres = models.DecimalField(max_digits=6, decimal_places=2, default=10.0, help_text="Standardized area in acres")
    original_area_unit = models.CharField(max_length=50, default='acre', help_text="Original measurement unit (Acre, Bigha, Hectare)")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="Consented farm center coordinate")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="Consented farm center coordinate")
    current_crops = models.CharField(max_length=255, default='Wheat')
    soil_type = models.CharField(max_length=100, blank=True, default='Alluvial Loam')
    irrigation_source = models.CharField(max_length=100, blank=True, default='Tubewell + Canal')
    history_notes = models.TextField(blank=True, default='', help_text="Historical cropping and soil management notes")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.size_acres} Acres) - {self.farmer.username}"


class Field(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='fields')
    name = models.CharField(max_length=150, help_text="e.g. North Plot, Tubewell Khet, Khasra 402")
    khasra_number = models.CharField(max_length=100, blank=True, default='', help_text="Official parcel identifier / survey number")
    area_acres = models.DecimalField(max_digits=6, decimal_places=2, default=5.0)
    original_area_value = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="Original area value as entered by farmer")
    original_area_unit = models.CharField(max_length=50, default='acre', help_text="Original measurement unit (Acre, Bigha, Hectare)")
    land_tenure = models.CharField(max_length=50, choices=Farm.TENURE_CHOICES, blank=True, default='owned')
    soil_type = models.CharField(max_length=100, blank=True, default='Alluvial Loam')
    irrigation_status = models.CharField(max_length=100, blank=True, default='Tubewell Irrigated')
    history_notes = models.TextField(blank=True, default='', help_text="Historical parcel notes")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.area_acres} Acres) - {self.farm.name}"


class CropTemplate(models.Model):
    """
    Standardized, editable crop operation workflow templates for the 6 core crops and variants:
    1. Wheat
    2. Paddy: transplanted and direct-seeded (DSR)
    3. Sugarcane: new planting and ratoon
    4. Mustard
    5. Maize: grain and fodder
    6. Potato
    """
    slug = models.SlugField(max_length=50, unique=True)
    crop_name_en = models.CharField(max_length=100)
    crop_name_hi = models.CharField(max_length=100)
    variant_name_en = models.CharField(max_length=100, blank=True)
    variant_name_hi = models.CharField(max_length=100, blank=True)
    season = models.CharField(max_length=50, choices=[
        ('Rabi', 'Rabi (Winter)'),
        ('Kharif', 'Kharif (Monsoon)'),
        ('Zaid', 'Zaid (Summer)'),
        ('Annual', 'Annual / Multi-season'),
    ])
    typical_duration_days = models.IntegerField(default=120)
    version = models.CharField(max_length=20, default='v1.0')
    source_institution = models.CharField(max_length=200, blank=True, default='', help_text="e.g. ICAR-IIWBR, ICAR-IIRR, ICAR-IISR")
    source_url = models.URLField(max_length=300, blank=True, default='', help_text="Official institution reference link")
    description_en = models.TextField(blank=True)
    description_hi = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        v = f" ({self.variant_name_en})" if self.variant_name_en else ""
        return f"{self.crop_name_en}{v} [{self.season}] - {self.version}"


class CropOperationTemplate(models.Model):
    crop_template = models.ForeignKey(CropTemplate, on_delete=models.CASCADE, related_name='operations')
    sequence_order = models.IntegerField(default=1)
    operation_name_en = models.CharField(max_length=150)
    operation_name_hi = models.CharField(max_length=150)
    stage = models.CharField(max_length=100)
    default_service_category = models.ForeignKey(
        'services.ServiceCategory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    offset_start_days = models.IntegerField(default=0, help_text="Days from project start date")
    offset_duration_days = models.IntegerField(default=3)
    is_mandatory = models.BooleanField(default=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['crop_template', 'sequence_order']

    def __str__(self):
        return f"{self.crop_template.crop_name_en} #{self.sequence_order}: {self.operation_name_en}"


class FarmProject(models.Model):
    STATUS_CHOICES = [
        ('planning', 'Planning & Quotation'),
        ('ready', 'Services Confirmed (Ready)'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    farmer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects')
    farm = models.ForeignKey(Farm, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    field = models.ForeignKey(Field, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    crop_template = models.ForeignKey(CropTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    template_version = models.CharField(max_length=20, default='v1.0', help_text="Preserves template version at project creation time.")
    name = models.CharField(max_length=200, help_text="e.g. Wheat Harvesting 2026")
    crop = models.CharField(max_length=100, default='Wheat')
    variant = models.CharField(max_length=100, blank=True)
    target_area_acres = models.DecimalField(max_digits=6, decimal_places=2, default=20.0)
    start_date = models.DateField()
    expected_completion_date = models.DateField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='planning')
    estimated_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    actual_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_actual_progress(self):
        """
        Progress calculation rule:
        - Confirmed service bookings DO NOT complete agricultural operations.
        - Actual progress = completed applicable tasks / total applicable tasks.
        - Cancelled tasks are excluded from denominator so they do not distort calculations.
        - When no applicable tasks exist, returns None (displays 'no progress available' rather than 0% or 100%).
        """
        applicable_tasks = self.project_operations.exclude(status='cancelled')
        total_count = applicable_tasks.count()
        if total_count == 0:
            return {
                'completed_count': 0,
                'total_applicable': 0,
                'percentage': None,
                'has_progress': False,
                'label': 'No applicable tasks available'
            }

        completed_count = applicable_tasks.filter(status='completed').count()
        percentage = round((completed_count / total_count) * 100, 1)
        return {
            'completed_count': completed_count,
            'total_applicable': total_count,
            'percentage': percentage,
            'has_progress': True,
            'label': f"{completed_count}/{total_count} tasks completed ({percentage}%)"
        }

    def update_project_status(self):
        """
        Calculates status & costs based on operations and linked service requests/bookings.
        """
        # Calculate from operations
        prog = self.calculate_actual_progress()
        if prog['has_progress']:
            if prog['completed_count'] == prog['total_applicable'] and prog['total_applicable'] > 0:
                self.status = 'completed'
            elif prog['completed_count'] > 0 or self.project_operations.filter(status__in=['in_progress', 'scheduled']).exists():
                self.status = 'in_progress'

        # Financial cost calculation from linked bookings and expenses using Decimal
        total_act = Decimal('0.00')
        total_est = Decimal('0.00')
        for op in self.project_operations.all():
            if op.booking and op.booking.agreed_amount:
                total_act += Decimal(str(op.booking.agreed_amount))
                total_est += Decimal(str(op.booking.agreed_amount))
            elif op.service_request:
                req = op.service_request
                if hasattr(req, 'booking') and req.booking and req.booking.agreed_amount:
                    total_act += Decimal(str(req.booking.agreed_amount))
                    total_est += Decimal(str(req.booking.agreed_amount))
                elif req.budget_max:
                    total_est += Decimal(str(req.budget_max))

        self.estimated_budget = total_est
        self.actual_cost = total_act
        self.save()

    def get_financial_summary(self):
        """
        FINANCIAL PLANNER CALCULATION CONTRACT (Section 10, FIN-01 to FIN-12):
        Separates estimates, commitments, incurred expenses, advance payments,
        partial payments, refunds, outstanding balances, overpayments, and revenue.
        Never combines estimates, commitments, and incurred expenses into a single total.
        """
        from decimal import Decimal

        # 1. Planned estimates (FIN-01)
        active_estimates = self.expenses.filter(record_type='estimate', status='active')
        planned_estimates = sum([Decimal(str(e.amount)) for e in active_estimates], Decimal('0.00'))

        # 2. Confirmed commitments (FIN-02)
        active_commitments = self.expenses.filter(record_type='commitment', status='active')
        confirmed_commitments = sum([Decimal(str(c.amount)) for c in active_commitments], Decimal('0.00'))

        # 3. Incurred expenditure (FIN-03 & FIN-09)
        active_incurred = self.expenses.filter(record_type='incurred', status='active')
        incurred_base = sum([Decimal(str(i.amount)) for i in active_incurred], Decimal('0.00'))

        # Include adjustments
        adjustments_total = Decimal('0.00')
        for inc in active_incurred:
            for adj in inc.adjustments.all():
                adjustments_total += Decimal(str(adj.amount))
        incurred_expenditure = max(incurred_base + adjustments_total, Decimal('0.00'))

        # 4. Payments (FIN-04, FIN-05, FIN-06, FIN-11)
        project_payments = self.payments.all()
        advances = sum([Decimal(str(p.amount)) for p in project_payments.filter(payment_type='advance')], Decimal('0.00'))
        partials = sum([Decimal(str(p.amount)) for p in project_payments.filter(payment_type__in=['partial', 'final'])], Decimal('0.00'))
        total_payments = advances + partials
        refunds = sum([Decimal(str(p.amount)) for p in project_payments.filter(payment_type='refund')], Decimal('0.00'))
        net_recorded_payments = max(total_payments - refunds, Decimal('0.00'))

        # 5. Outstanding balance & Overpayment
        # Outstanding balance = max(0, incurred_expenditure - net_recorded_payments)
        outstanding_balance = max(Decimal('0.00'), incurred_expenditure - net_recorded_payments)
        # Overpayment or refundable balance = max(0, net_recorded_payments - incurred_expenditure)
        overpayment_balance = max(Decimal('0.00'), net_recorded_payments - incurred_expenditure)

        # 6. Budget variance = Incurred - Planned
        budget_variance = incurred_expenditure - planned_estimates

        # 7. Realized revenue
        revenues = self.revenues.all()
        realized_revenue = sum([Decimal(str(r.total_realized_revenue)) for r in revenues], Decimal('0.00'))

        # 8. Recorded surplus = Revenue - Incurred
        recorded_surplus = realized_revenue - incurred_expenditure

        # 9. Cost per acre
        area = Decimal(str(self.target_area_acres or 0))
        cost_per_acre = Decimal('0.00')
        if area > Decimal('0.00'):
            cost_per_acre = round(incurred_expenditure / area, 2)

        return {
            'planned_estimates': str(planned_estimates),
            'confirmed_commitments': str(confirmed_commitments),
            'incurred_expenditure': str(incurred_expenditure),
            'recorded_advance_payments': str(advances),
            'recorded_partial_payments': str(partials),
            'total_recorded_payments': str(total_payments),
            'refunds': str(refunds),
            'net_recorded_payments': str(net_recorded_payments),
            'outstanding_balance': str(outstanding_balance),
            'overpayment_balance': str(overpayment_balance),
            'budget_variance': str(budget_variance),
            'realized_revenue': str(realized_revenue),
            'recorded_surplus': str(recorded_surplus),
            'cultivated_area_acres': str(area),
            'cost_per_acre': str(cost_per_acre),
            'economic_disclaimer': 'Recorded surplus reflects platform operational records; not a certified comprehensive economic audit.'
        }

    def __str__(self):
        return f"{self.name} - {self.crop} ({self.target_area_acres} Acres) [{self.get_status_display()}]"


class ProjectOperation(models.Model):
    """
    Discrete operational agricultural task within a FarmProject.
    Can be performed manually by the farmer or fulfilled by linked agricultural service bookings.
    Supports operation dependency tracking and status lifecycle.
    """
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('awaiting_prerequisite', 'Awaiting Prerequisite'),
        ('ready', 'Ready'),
        ('service_requested', 'Service Requested'),
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completion_pending', 'Completion Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    project = models.ForeignKey(FarmProject, on_delete=models.CASCADE, related_name='project_operations')
    sequence_order = models.IntegerField(default=1)
    operation_name_en = models.CharField(max_length=150)
    operation_name_hi = models.CharField(max_length=150)
    stage = models.CharField(max_length=100)
    service_category = models.ForeignKey(
        'services.ServiceCategory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    service_request = models.ForeignKey(
        'bookings.ServiceRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='linked_operations'
    )
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='linked_operations'
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='planned')
    planned_start_date = models.DateField()
    planned_end_date = models.DateField()
    actual_start_date = models.DateField(null=True, blank=True)
    actual_completion_date = models.DateField(null=True, blank=True)
    is_mandatory = models.BooleanField(default=True)
    is_manual = models.BooleanField(default=False, help_text="True if farmer conducts task directly without service booking.")
    prerequisite_operation = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dependent_operations'
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['project', 'sequence_order', 'planned_start_date']

    def clean(self):
        # Prevent circular dependency
        if self.prerequisite_operation:
            if self.prerequisite_operation_id == self.id:
                raise ValidationError("An operation cannot depend on itself.")
            
            # Check ancestor chain
            visited = {self.id} if self.id else set()
            curr = self.prerequisite_operation
            while curr:
                if curr.id in visited:
                    raise ValidationError(f"Circular task dependency detected: cycle involving '{curr.operation_name_en}'.")
                visited.add(curr.id)
                curr = curr.prerequisite_operation

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def mark_completed_manually(self, notes=''):
        """
        Allows farmer to manually record an operation completed without purchasing an external service.
        Updates dependent operations from 'awaiting_prerequisite' to 'ready'.
        """
        self.status = 'completed'
        self.is_manual = True
        self.actual_completion_date = timezone.localdate()
        if not self.actual_start_date:
            self.actual_start_date = self.planned_start_date or timezone.localdate()
        if notes:
            self.notes = f"{self.notes}\n[Manual Completion] {notes}".strip()
        self.save()

        # Update dependent operations
        for dep in self.dependent_operations.filter(status='awaiting_prerequisite'):
            dep.status = 'ready'
            dep.save()

        self.project.update_project_status()
        return self

    def __str__(self):
        return f"{self.project.name} | #{self.sequence_order} {self.operation_name_en} ({self.get_status_display()})"


class ProjectService(models.Model):
    project = models.ForeignKey(FarmProject, on_delete=models.CASCADE, related_name='project_services')
    category = models.ForeignKey('services.ServiceCategory', on_delete=models.CASCADE)
    service_request = models.OneToOneField('bookings.ServiceRequest', on_delete=models.SET_NULL, null=True, blank=True, related_name='project_item')
    scope_description = models.CharField(max_length=255)
    target_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.name} -> {self.category.name_en}"


class ExpenseRecord(models.Model):
    """
    FIN-01, FIN-02, FIN-03: Tracks planned estimates, confirmed commitments, and incurred expenses separately.
    """
    CATEGORY_CHOICES = [
        ('seeds', 'Seed and Planting Material'),
        ('inputs', 'Agricultural Inputs'),
        ('labour', 'Hired Labour'),
        ('machinery', 'Machinery Rental'),
        ('irrigation', 'Irrigation'),
        ('transportation', 'Transportation'),
        ('storage', 'Storage'),
        ('repair_maintenance', 'Repair and Maintenance'),
        ('land_rent', 'Land Rent'),
        ('expert_services', 'Expert and Other Services'),
    ]

    TYPE_CHOICES = [
        ('estimate', 'Planned Estimate (Quotation/Budget)'),
        ('commitment', 'Confirmed Commitment (Confirmed Booking)'),
        ('incurred', 'Incurred Expense (Approved Completed Service)'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('released', 'Released / Cancelled'),
        ('settled', 'Settled'),
        ('fulfilled', 'Fulfilled'),
    ]

    project = models.ForeignKey(FarmProject, on_delete=models.CASCADE, related_name='expenses')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='labour')
    record_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='estimate')
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL, null=True, blank=True, related_name='booking_expenses')
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project.name} | {self.get_record_type_display()}: ₹{self.amount} [{self.category}]"


class FinancialAdjustment(models.Model):
    """
    FIN-09: Approved corrections create adjustment records rather than silently replacing original amounts.
    """
    expense = models.ForeignKey(ExpenseRecord, on_delete=models.CASCADE, related_name='adjustments')
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Adjustment delta (positive or negative).")
    reason = models.TextField()
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Adjustment ₹{self.amount} on {self.expense.title}: {self.reason}"


class PaymentRecord(models.Model):
    """
    FIN-04, FIN-05, FIN-06, FIN-11:
    Tracks advance payments, partial payments, final settlements, and refunds.
    Payments reduce outstanding balances, but never increase incurred expenses.
    Platform ledger only; live banking transfers disabled in MVP.
    """
    PAYMENT_TYPE_CHOICES = [
        ('advance', 'Advance Payment'),
        ('partial', 'Partial Payment'),
        ('final', 'Final Settlement'),
        ('refund', 'Refund'),
    ]

    project = models.ForeignKey(FarmProject, on_delete=models.CASCADE, related_name='payments')
    expense = models.ForeignKey(ExpenseRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    payer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments_made')
    payee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments_received')
    payment_type = models.CharField(max_length=30, choices=PAYMENT_TYPE_CHOICES, default='advance')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_mode = models.CharField(max_length=50, default='Direct UPI / Cash (Platform Ledger Recording)')
    transaction_reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    payment_date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f"Payment {self.get_payment_type_display()}: ₹{self.amount} for {self.project.name}"


class RevenueRecord(models.Model):
    """
    Tracks realized farm revenue from crop sales for surplus and gross margin calculation.
    """
    project = models.ForeignKey(FarmProject, on_delete=models.CASCADE, related_name='revenues')
    crop = models.CharField(max_length=100)
    quantity_quintals = models.DecimalField(max_digits=10, decimal_places=2)
    rate_per_quintal = models.DecimalField(max_digits=10, decimal_places=2)
    total_realized_revenue = models.DecimalField(max_digits=12, decimal_places=2)
    buyer_name = models.CharField(max_length=200, blank=True, help_text="e.g. APMC Meerut Mandi Trader, Daurala Sugar Mill")
    mandi_or_mill = models.CharField(max_length=200, blank=True)
    sale_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sale_date']

    def save(self, *args, **kwargs):
        if not self.total_realized_revenue and self.quantity_quintals and self.rate_per_quintal:
            self.total_realized_revenue = self.quantity_quintals * self.rate_per_quintal
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.project.name} | Revenue: ₹{self.total_realized_revenue} ({self.quantity_quintals} Qtl @ ₹{self.rate_per_quintal})"


class SoilReport(models.Model):
    """
    Module 02: Soil Intelligence
    Farmer-entered laboratory soil test and Soil Health Card records.
    Associated with farm and optional field parcel.
    """
    farmer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='soil_reports')
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='soil_reports')
    field = models.ForeignKey(Field, on_delete=models.SET_NULL, null=True, blank=True, related_name='soil_reports')
    sampling_date = models.DateField(default=timezone.localdate)
    report_date = models.DateField(null=True, blank=True)
    lab_name = models.CharField(max_length=200, help_text="e.g. District Soil Testing Lab Meerut / KVK / ICAR")
    sample_id = models.CharField(max_length=100, blank=True, help_text="Sample identifier or Soil Health Card number")
    soil_texture = models.CharField(max_length=100, blank=True, default='Loam', help_text="e.g. Alluvial Loam, Sandy Loam, Clay Loam")
    ph = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, help_text="Soil pH (e.g. 7.20)")
    ec = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Electrical Conductivity dS/m")
    organic_carbon_percent = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, help_text="Organic Carbon %")
    nitrogen_kg_ha = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Available Nitrogen (N) kg/ha")
    phosphorus_kg_ha = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Available Phosphorus (P) kg/ha")
    potassium_kg_ha = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Available Potassium (K) kg/ha")
    zinc_ppm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Available Zinc (ppm)")
    iron_ppm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Available Iron (ppm)")
    document_reference = models.CharField(max_length=255, blank=True, help_text="SHC Reference / Document Token")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sampling_date', '-created_at']

    def __str__(self):
        fld = f" - {self.field.name}" if self.field else ""
        return f"Soil Report: {self.farm.name}{fld} ({self.sampling_date})"


class SeedProcurementRecord(models.Model):
    """
    Module 04: Seed Intelligence
    Tracks variety selection, procurement status, seed source, quantity, and cost.
    Automatically connects to farm project and creates/updates financial records.
    """
    PROCUREMENT_STATUS_CHOICES = [
        ('planned', 'Planned / Required'),
        ('procured', 'Procured / In Stock'),
        ('treated', 'Seed Treated'),
        ('sown', 'Sown in Field'),
    ]

    UNIT_CHOICES = [
        ('kg', 'Kilograms (kg)'),
        ('quintal', 'Quintals (qtl)'),
        ('packet', 'Packets'),
        ('seedling', 'Seedlings / Tubers'),
    ]

    project = models.ForeignKey(FarmProject, on_delete=models.CASCADE, related_name='seed_records')
    operation = models.ForeignKey(ProjectOperation, on_delete=models.SET_NULL, null=True, blank=True, related_name='seed_records')
    expense = models.OneToOneField(ExpenseRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='seed_procurement')
    crop = models.CharField(max_length=100)
    variety_name = models.CharField(max_length=150, help_text="e.g. HD-2967, PBW-343, Co-0238, Pusa Mustard 25")
    source_breeder = models.CharField(max_length=150, blank=True, help_text="e.g. ICAR-IIWBR, National Seeds Corp, State Seed Dept")
    required_quantity = models.DecimalField(max_digits=8, decimal_places=2)
    quantity_unit = models.CharField(max_length=30, choices=UNIT_CHOICES, default='kg')
    procurement_status = models.CharField(max_length=30, choices=PROCUREMENT_STATUS_CHOICES, default='planned')
    supplier_name = models.CharField(max_length=200, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    lot_number = models.CharField(max_length=100, blank=True)
    recorded_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.crop} - {self.variety_name} ({self.required_quantity} {self.quantity_unit}) [{self.get_procurement_status_display()}]"


class CropObservation(models.Model):
    """
    Module 09: Crop Monitoring
    Manual field observation records entered by the farmer.
    Integrated into Farm Project Manager timeline.
    """
    CONDITION_CHOICES = [
        ('excellent', 'Excellent (उत्कृष्ट)'),
        ('good', 'Good (अच्छा)'),
        ('fair', 'Fair / Average (सामान्य)'),
        ('poor', 'Poor (कमजोर)'),
        ('stressed', 'Stressed / Needs Attention (तनावग्रस्त)'),
    ]

    FOLLOW_UP_CHOICES = [
        ('none', 'No Action Required (कोई कार्रवाई नहीं)'),
        ('monitoring', 'Active Monitoring (सक्रिय निगरानी)'),
        ('action_required', 'Field Action Required (कार्रवाई आवश्यक)'),
        ('resolved', 'Resolved (समाधान किया गया)'),
    ]

    project = models.ForeignKey(FarmProject, on_delete=models.CASCADE, related_name='observations')
    field = models.ForeignKey(Field, on_delete=models.SET_NULL, null=True, blank=True, related_name='crop_observations')
    operation = models.ForeignKey(ProjectOperation, on_delete=models.SET_NULL, null=True, blank=True, related_name='observations')
    observation_date = models.DateField(default=timezone.localdate)
    growth_stage = models.CharField(max_length=100, help_text="e.g. Crown Root Initiation, Tillering, Flowering, Grain Filling")
    crop_condition = models.CharField(max_length=50, choices=CONDITION_CHOICES, default='good')
    field_notes = models.TextField(help_text="Farmer field observations, canopy status, moisture condition")
    reported_concerns = models.CharField(max_length=200, blank=True, help_text="e.g. Minor yellowing, lodging risk, waterlogging")
    follow_up_status = models.CharField(max_length=50, choices=FOLLOW_UP_CHOICES, default='monitoring')
    photo_reference = models.CharField(max_length=255, blank=True, help_text="Secure photographic reference token")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-observation_date', '-created_at']

    def __str__(self):
        return f"{self.project.name} | {self.growth_stage} ({self.observation_date}) - {self.get_crop_condition_display()}"


class PostHarvestRecord(models.Model):
    """
    Module 10: Post-Harvest Management
    Tracks harvest completion, produce volume, quality grading, on-farm/commercial storage,
    and connects to marketplace for transportation/storage requests and finance for revenues.
    """
    UNIT_CHOICES = [
        ('quintal', 'Quintals (qtl)'),
        ('ton', 'Metric Tons'),
        ('bag', 'Bags (50kg)'),
        ('crate', 'Crates'),
    ]

    GRADE_CHOICES = [
        ('Grade A', 'Grade A (FAQ - Fair Average Quality)'),
        ('Grade B', 'Grade B (Secondary)'),
        ('Grade C', 'Grade C (Under-grade / Processing)'),
        ('Premium', 'Premium Grade'),
    ]

    STORAGE_TYPE_CHOICES = [
        ('on_farm', 'On-Farm Covered Shed'),
        ('commercial_warehouse', 'Registered Warehouse (CWC / SWC)'),
        ('cold_storage', 'Cold Storage Facility'),
        ('direct_mandi', 'Directly Dispatched to Mandi / Mill'),
    ]

    SALE_STATUS_CHOICES = [
        ('unsold', 'Unsold / In Storage'),
        ('partially_sold', 'Partially Sold'),
        ('sold', 'Completely Sold'),
    ]

    project = models.ForeignKey(FarmProject, on_delete=models.CASCADE, related_name='post_harvest_records')
    harvest_date = models.DateField(default=timezone.localdate)
    produce_quantity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Harvested yield quantity")
    quantity_unit = models.CharField(max_length=30, choices=UNIT_CHOICES, default='quintal')
    quality_grade = models.CharField(max_length=50, choices=GRADE_CHOICES, default='Grade A')
    moisture_content_percent = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, help_text="Reported grain/produce moisture %")
    storage_type = models.CharField(max_length=50, choices=STORAGE_TYPE_CHOICES, default='on_farm')
    storage_location = models.CharField(max_length=200, blank=True, help_text="Warehouse / facility address or on-farm shed")
    storage_duration_days = models.IntegerField(default=0)
    storage_cost_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    transport_required = models.BooleanField(default=False)
    transport_cost_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    sale_status = models.CharField(max_length=30, choices=SALE_STATUS_CHOICES, default='unsold')
    transport_service_request = models.ForeignKey('bookings.ServiceRequest', on_delete=models.SET_NULL, null=True, blank=True, related_name='transport_post_harvest')
    storage_service_request = models.ForeignKey('bookings.ServiceRequest', on_delete=models.SET_NULL, null=True, blank=True, related_name='storage_post_harvest')
    storage_expense = models.OneToOneField(ExpenseRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='storage_post_harvest')
    transport_expense = models.OneToOneField(ExpenseRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='transport_post_harvest')
    revenue_record = models.OneToOneField(RevenueRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='post_harvest_record')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-harvest_date', '-created_at']

    def __str__(self):
        return f"{self.project.name} Harvest: {self.produce_quantity} {self.quantity_unit} ({self.quality_grade}) [{self.get_sale_status_display()}]"


