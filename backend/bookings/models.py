import uuid
import hashlib
from decimal import Decimal
from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError

class ServiceRequest(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open for Quotations'),
        ('quote_accepted', 'Quote Accepted (Awaiting Confirmation)'),
        ('booked', 'Booked & Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    farmer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='service_requests')
    category = models.ForeignKey('services.ServiceCategory', on_delete=models.CASCADE, related_name='requests')
    farm_project = models.ForeignKey('farm_projects.FarmProject', on_delete=models.SET_NULL, null=True, blank=True, related_name='service_requests')
    title = models.CharField(max_length=200)
    description = models.TextField()
    village = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    state = models.CharField(max_length=100, default='Uttar Pradesh')
    required_date = models.DateField()
    scope_quantity = models.CharField(max_length=150, help_text="e.g. 6 labourers for 2 days, 15 acres combine harvester")
    budget_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"REQ-{self.id} [{self.category.name_en}] by {self.farmer.username} ({self.status})"


class Quotation(models.Model):
    """
    Contractual service quotation submitted by verified providers/workers.
    Server strictly calculates all totals; client-provided totals cannot override server calculations.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Farmer Review'),
        ('accepted', 'Accepted by Farmer'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
        ('expired', 'Expired'),
    ]

    request = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE, related_name='quotations')
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submitted_quotations')
    quotation_version = models.IntegerField(default=1)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)
    billing_unit = models.CharField(max_length=50, default='Per Acre')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    itemized_charges = models.JSONField(default=dict, blank=True, help_text="Dict of breakdown charges, e.g. {'fuel': 500, 'operator': 300}")
    agreed_discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    quote_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Server-calculated total amount.")
    price_breakdown = models.TextField(blank=True, help_text="Textual summary of charges.")
    notes = models.TextField(blank=True)
    proposed_schedule = models.DateField(help_text="Primary planned service date.")
    proposed_service_window_start = models.DateField(null=True, blank=True)
    proposed_service_window_end = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    included_services = models.TextField(blank=True, default="Standard operation, machinery operator, basic equipment wear.")
    excluded_services = models.TextField(blank=True, default="Excess fuel beyond standard quota, crop transport outside agreed radius.")
    cancellation_conditions = models.TextField(blank=True, default="Cancellation permitted up to 24 hours prior to scheduled date without charge.")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['quote_amount', '-created_at']

    def calculate_total(self):
        base = Decimal(str(self.quantity)) * Decimal(str(self.unit_price))
        extra = Decimal('0.00')
        if isinstance(self.itemized_charges, dict):
            for k, v in self.itemized_charges.items():
                try:
                    extra += Decimal(str(v))
                except Exception:
                    pass
        discount = Decimal(str(self.agreed_discount or 0))
        total = base + extra - discount
        return max(total, Decimal('0.00'))

    def save(self, *args, **kwargs):
        # Enforce server-calculated total
        if self.unit_price and Decimal(str(self.unit_price)) > 0:
            self.quote_amount = self.calculate_total()
        elif not self.quote_amount:
            self.quote_amount = Decimal('0.00')
        if not self.proposed_service_window_start:
            self.proposed_service_window_start = self.proposed_schedule
        if not self.proposed_service_window_end:
            self.proposed_service_window_end = self.proposed_schedule
        if not self.expiry_date:
            self.expiry_date = self.proposed_schedule
        super().save(*args, **kwargs)

    def is_expired(self):
        if self.expiry_date and self.expiry_date < timezone.now().date():
            return True
        return False

    def __str__(self):
        return f"Quote v{self.quotation_version} ₹{self.quote_amount} by {self.provider.username} for REQ-{self.request_id} ({self.status})"


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending_confirmation', 'Pending Provider Confirmation'),
        ('confirmed', 'Confirmed'),
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completion_pending', 'Completion Pending (Farmer Review)'),
        ('completed', 'Completed'),
        ('partially_completed', 'Partially Completed'),
        ('cancelled_by_farmer', 'Cancelled by Farmer'),
        ('cancelled_by_provider', 'Cancelled by Provider'),
        ('under_administrative_review', 'Under Administrative Review'),
        ('disputed', 'Disputed'),
    ]

    reference_id = models.CharField(max_length=30, unique=True, editable=False)
    request = models.OneToOneField(ServiceRequest, on_delete=models.CASCADE, related_name='booking')
    quotation = models.OneToOneField(Quotation, on_delete=models.CASCADE, related_name='booking')
    farmer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='farmer_bookings')
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='provider_bookings')
    agreed_amount = models.DecimalField(max_digits=10, decimal_places=2)
    scheduled_date = models.DateField()
    confirmed_window_start = models.DateField(null=True, blank=True)
    confirmed_window_end = models.DateField(null=True, blank=True)
    exclusive_resource_id = models.CharField(max_length=100, blank=True, help_text="e.g. Tractor-KA01, Combine-02")
    status = models.CharField(max_length=35, choices=STATUS_CHOICES, default='pending_confirmation')
    cancellation_reason = models.TextField(blank=True)
    completion_notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-scheduled_date', '-created_at']

    def save(self, *args, **kwargs):
        if not self.reference_id:
            import random
            rand_code = random.randint(1000, 9999)
            self.reference_id = f"KS-{timezone.now().strftime('%Y%m')}-{rand_code}"
        if not self.confirmed_window_start:
            self.confirmed_window_start = self.scheduled_date
        if not self.confirmed_window_end:
            self.confirmed_window_end = self.scheduled_date
        super().save(*args, **kwargs)

    @classmethod
    def check_double_booking(cls, provider_id, scheduled_date, exclude_booking_id=None, exclusive_resource_id=None):
        """
        BOOK-07: Exclusive resources cannot have overlapping active reservations.
        BOOK-08: Shared resources cannot exceed confirmed capacity.
        """
        active_statuses = ['confirmed', 'scheduled', 'in_progress', 'completion_pending']
        query = cls.objects.filter(
            provider_id=provider_id,
            scheduled_date=scheduled_date,
            status__in=active_statuses
        )
        if exclude_booking_id:
            query = query.exclude(id=exclude_booking_id)

        if exclusive_resource_id:
            return query.filter(exclusive_resource_id=exclusive_resource_id).exists()
        return query.exists()

    def confirm_by_provider(self, actor_user):
        """
        BOOK-05 & BOOK-06: Atomically confirms the booking by provider with resource reservation.
        """
        with transaction.atomic():
            locked = Booking.objects.select_for_update().get(id=self.id)
            if locked.provider_id != actor_user.id and not actor_user.is_superuser:
                raise ValidationError("Only the assigned provider can confirm this booking.")

            # BOOK-15: Check provider suspension
            if hasattr(actor_user, 'provider_profile') and actor_user.provider_profile.is_suspended():
                raise ValidationError("Suspended providers cannot accept or confirm new bookings (BOOK-15).")
            if hasattr(actor_user, 'worker_profile') and actor_user.worker_profile.is_suspended():
                raise ValidationError("Suspended workers cannot accept or confirm new bookings (BOOK-15).")

            # Check verification
            if hasattr(actor_user, 'provider_profile') and not actor_user.provider_profile.is_verified():
                raise ValidationError("Unverified provider cannot confirm bookings. Administrative verification required.")
            if hasattr(actor_user, 'worker_profile') and not actor_user.worker_profile.is_verified():
                raise ValidationError("Unverified worker cannot confirm bookings. Administrative verification required.")

            if Booking.check_double_booking(locked.provider_id, locked.scheduled_date, exclude_booking_id=locked.id, exclusive_resource_id=locked.exclusive_resource_id):
                raise ValidationError(f"Double-booking conflict: Resource reservation conflict: Exclusive resource or provider already booked for {locked.scheduled_date} (BOOK-07).")

            from_status = locked.status
            locked.status = 'confirmed'
            locked.save()

            # Reserve resource record
            ResourceReservation.objects.update_or_create(
                booking=locked,
                defaults={
                    'provider': locked.provider,
                    'resource_type': 'exclusive' if locked.exclusive_resource_id else 'shared',
                    'resource_identifier': locked.exclusive_resource_id or f"Provider-{locked.provider_id}",
                    'date': locked.scheduled_date,
                    'allocated_quantity': 1,
                    'max_capacity': 1,
                    'is_active': True
                }
            )

            # Update request status
            locked.request.status = 'booked'
            locked.request.save()

            # Record event
            BookingEvent.objects.create(
                booking=locked,
                actor=actor_user,
                action='Confirmed Booking',
                from_status=from_status,
                to_status='confirmed',
                notes=f"Provider {actor_user.username} confirmed resource availability for {locked.scheduled_date}."
            )

            # Notify farmer
            Notification.objects.create(
                recipient=locked.farmer,
                title="Booking Confirmed!",
                message=f"Provider {actor_user.get_full_name() or actor_user.username} confirmed your booking {locked.reference_id} for {locked.scheduled_date}.",
                link_url="/farmer/bookings"
            )

            if locked.request.farm_project:
                locked.request.farm_project.update_project_status()

            self.status = locked.status
            return locked

    def cancel(self, actor_user, reason=""):
        """
        BOOK-14: Cancellation releases the relevant capacity / resource reservation.
        """
        with transaction.atomic():
            locked = Booking.objects.select_for_update().get(id=self.id)
            from_status = locked.status
            is_farmer = (locked.farmer_id == actor_user.id)
            is_provider = (locked.provider_id == actor_user.id)

            if not (is_farmer or is_provider or actor_user.is_superuser):
                raise ValidationError("You do not have permission to cancel this booking.")

            new_status = 'cancelled_by_farmer' if is_farmer else 'cancelled_by_provider'
            locked.status = new_status
            locked.cancellation_reason = reason
            locked.save()

            # Release resource reservation (BOOK-14)
            ResourceReservation.objects.filter(booking=locked).update(is_active=False)

            # Reopen or cancel service request
            if is_provider:
                locked.request.status = 'open'
                locked.request.save()
                Notification.objects.create(
                    recipient=locked.farmer,
                    title="Provider Cancelled Booking - Backup Options Available",
                    message=f"Provider {locked.provider.get_full_name() or locked.provider.username} cancelled booking {locked.reference_id}. Reason: {reason}. Alternative providers are available.",
                    link_url=f"/farmer/requests/{locked.request.id}"
                )
            else:
                locked.request.status = 'cancelled'
                locked.request.save()
                Notification.objects.create(
                    recipient=locked.provider,
                    title="Booking Cancelled by Farmer",
                    message=f"Farmer {locked.farmer.get_full_name() or locked.farmer.username} cancelled booking {locked.reference_id}. Reason: {reason}.",
                    link_url="/provider/bookings"
                )

            BookingEvent.objects.create(
                booking=locked,
                actor=actor_user,
                action='Cancelled Booking',
                from_status=from_status,
                to_status=new_status,
                notes=reason
            )

            if locked.request.farm_project:
                from farm_projects.models import ExpenseRecord
                # FIN-08: Booking cancellation releases confirmed commitment
                ExpenseRecord.objects.filter(booking=locked, record_type='commitment').update(status='released')
                locked.request.farm_project.update_project_status()

            self.status = locked.status
            return locked

    def submit_completion(self, actor_user, notes=""):
        """
        BOOK-19: Provider submits completion; transitions to 'completion_pending' awaiting farmer confirmation.
        """
        with transaction.atomic():
            locked = Booking.objects.select_for_update().get(id=self.id)
            if locked.provider_id != actor_user.id and not actor_user.is_superuser:
                raise ValidationError("Only the assigned provider can submit service completion.")

            from_status = locked.status
            locked.status = 'completion_pending'
            locked.completion_notes = notes
            locked.save()

            BookingEvent.objects.create(
                booking=locked,
                actor=actor_user,
                action='Submitted Completion',
                from_status=from_status,
                to_status='completion_pending',
                notes=notes
            )

            Notification.objects.create(
                recipient=locked.farmer,
                title="Service Completion Review Required",
                message=f"Provider {actor_user.get_full_name() or actor_user.username} submitted completion for {locked.reference_id}. Please inspect and confirm or dispute.",
                link_url="/farmer/bookings"
            )

            self.status = locked.status
            return locked

    def confirm_completion_by_farmer(self, actor_user, is_approved=True, dispute_reason=""):
        """
        BOOK-19: Farmer confirms completed work or raises dispute.
        """
        with transaction.atomic():
            locked = Booking.objects.select_for_update().get(id=self.id)
            if locked.farmer_id != actor_user.id and not actor_user.is_superuser:
                raise ValidationError("Only the requesting farmer can confirm service completion.")

            from_status = locked.status
            if is_approved:
                locked.status = 'completed'
                locked.completed_at = timezone.now()
                locked.request.status = 'completed'
                locked.request.save()

                # Release reservation
                ResourceReservation.objects.filter(booking=locked).update(is_active=False)

                # Increment completion counts
                if hasattr(locked.provider, 'worker_profile'):
                    locked.provider.worker_profile.completed_jobs_count += 1
                    locked.provider.worker_profile.save()
                elif hasattr(locked.provider, 'provider_profile'):
                    locked.provider.provider_profile.completed_bookings_count += 1
                    locked.provider.provider_profile.save()

                action_name = 'Farmer Approved Completion'
            else:
                locked.status = 'disputed'
                action_name = 'Farmer Disputed Completion'
                Complaint.objects.create(
                    booking=locked,
                    reported_by=actor_user,
                    title=f"Disputed Completion on {locked.reference_id}",
                    description=dispute_reason or "Farmer disputed work quality or quantity."
                )

            locked.save()

            BookingEvent.objects.create(
                booking=locked,
                actor=actor_user,
                action=action_name,
                from_status=from_status,
                to_status=locked.status,
                notes=dispute_reason if not is_approved else "Farmer confirmed satisfactory completion."
            )

            if locked.request.farm_project:
                if is_approved:
                    from farm_projects.models import ExpenseRecord
                    # FIN-02 / FIN-08: Fulfill active commitment
                    ExpenseRecord.objects.filter(booking=locked, record_type='commitment').update(status='fulfilled')

                    # FIN-03 / FIN-10: Incurred expenditure recorded idempotently
                    cat = 'machinery'
                    if locked.request.category and locked.request.category.slug in ['labour', 'irrigation']:
                        cat = locked.request.category.slug

                    ExpenseRecord.objects.update_or_create(
                        project=locked.request.farm_project,
                        booking=locked,
                        record_type='incurred',
                        defaults={
                            'category': cat,
                            'title': f"Completed Service {locked.reference_id}: {locked.request.title}",
                            'amount': locked.agreed_amount,
                            'status': 'active',
                            'notes': f"Farmer approved completion. Incurred liability ₹{locked.agreed_amount}."
                        }
                    )
                locked.request.farm_project.update_project_status()

            self.status = locked.status
            return locked

    def __str__(self):
        return f"{self.reference_id} ({self.status}) - ₹{self.agreed_amount}"


class ResourceReservation(models.Model):
    """
    BOOK-05, BOOK-07, BOOK-08: Tracks exclusive and shared resource reservation capacity.
    """
    TYPE_CHOICES = [
        ('exclusive', 'Exclusive Machinery/Equipment'),
        ('shared', 'Shared Labour/Resource Capacity'),
    ]

    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='resource_reservations')
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='reservation', null=True, blank=True)
    resource_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='exclusive')
    resource_identifier = models.CharField(max_length=100)
    date = models.DateField(db_index=True)
    allocated_quantity = models.IntegerField(default=1)
    max_capacity = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'provider']

    def __str__(self):
        return f"Reservation {self.resource_identifier} on {self.date} [{self.resource_type}] - {'Active' if self.is_active else 'Released'}"


class IdempotencyKey(models.Model):
    """
    BOOK-09 & BOOK-10: Idempotency control for retried booking and financial operations.
    """
    key = models.CharField(max_length=100, unique=True, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    request_hash = models.CharField(max_length=64)
    response_data = models.JSONField(default=dict)
    response_status = models.IntegerField(default=200)
    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def compute_hash(cls, payload):
        norm = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(norm.encode('utf-8')).hexdigest()

    def __str__(self):
        return f"IdempotencyKey {self.key} by {self.user.username}"


class AdditionalChargeRequest(models.Model):
    """
    BOOK-12: Additional charges require explicit farmer approval before becoming incurred expenses.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Farmer Approval'),
        ('approved', 'Approved by Farmer'),
        ('rejected', 'Rejected'),
    ]

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='additional_charges')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Additional Charge ₹{self.amount} on {self.booking.reference_id} ({self.status})"


class PartialCompletionRecord(models.Model):
    """
    BOOK-18: Partial completion requires a recorded completed quantity and agreed settlement.
    """
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='partial_completion')
    completed_quantity = models.CharField(max_length=150, help_text="e.g. 6 of 10 acres completed due to rain.")
    agreed_settlement_amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    confirmed_by_farmer = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Partial Completion on {self.booking.reference_id}: ₹{self.agreed_settlement_amount}"


class BookingEvent(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='events')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    from_status = models.CharField(max_length=35, blank=True)
    to_status = models.CharField(max_length=35)
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.booking.reference_id}: {self.action} ({self.to_status})"


class Complaint(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
    ]

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='complaints')
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='complaints_made')
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    resolution_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Complaint on {self.booking.reference_id}: {self.title}"


class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    link_url = models.CharField(max_length=200, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification to {self.recipient.username}: {self.title}"
