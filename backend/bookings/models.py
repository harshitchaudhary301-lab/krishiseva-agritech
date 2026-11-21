import uuid
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
    STATUS_CHOICES = [
        ('pending', 'Pending Farmer Review'),
        ('accepted', 'Accepted by Farmer'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]

    request = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE, related_name='quotations')
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submitted_quotations')
    quote_amount = models.DecimalField(max_digits=10, decimal_places=2)
    price_breakdown = models.TextField(blank=True, help_text="Details of charges, wage rate, machinery fuel, etc.")
    notes = models.TextField(blank=True)
    proposed_schedule = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['quote_amount', '-created_at']

    def __str__(self):
        return f"Quote ₹{self.quote_amount} by {self.provider.username} for REQ-{self.request_id}"


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending_confirmation', 'Pending Provider Confirmation'),
        ('confirmed', 'Confirmed'),
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled_by_farmer', 'Cancelled by Farmer'),
        ('cancelled_by_provider', 'Cancelled by Provider'),
    ]

    reference_id = models.CharField(max_length=30, unique=True, editable=False)
    request = models.OneToOneField(ServiceRequest, on_delete=models.CASCADE, related_name='booking')
    quotation = models.OneToOneField(Quotation, on_delete=models.CASCADE, related_name='booking')
    farmer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='farmer_bookings')
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='provider_bookings')
    agreed_amount = models.DecimalField(max_digits=10, decimal_places=2)
    scheduled_date = models.DateField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending_confirmation')
    cancellation_reason = models.TextField(blank=True)
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
        super().save(*args, **kwargs)

    @classmethod
    def check_double_booking(cls, provider_id, scheduled_date, exclude_booking_id=None):
        """
        Prevents double-booking: returns True if provider already has an active
        confirmed/scheduled/in_progress booking on the same date.
        """
        active_statuses = ['confirmed', 'scheduled', 'in_progress']
        query = cls.objects.filter(
            provider_id=provider_id,
            scheduled_date=scheduled_date,
            status__in=active_statuses
        )
        if exclude_booking_id:
            query = query.exclude(id=exclude_booking_id)
        return query.exists()

    def confirm_by_provider(self, actor_user):
        """
        Atomically confirms the booking by provider with double-booking check.
        """
        with transaction.atomic():
            locked = Booking.objects.select_for_update().get(id=self.id)
            if locked.provider_id != actor_user.id and not actor_user.is_superuser:
                raise ValidationError("Only the assigned provider can confirm this booking.")

            if Booking.check_double_booking(locked.provider_id, locked.scheduled_date, exclude_booking_id=locked.id):
                raise ValidationError(f"Double-booking conflict: Provider already has a confirmed booking on {locked.scheduled_date}.")

            from_status = locked.status
            locked.status = 'confirmed'
            locked.save()

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
                notes=f"Provider {actor_user.username} confirmed availability for {locked.scheduled_date}."
            )

            # Notify farmer
            Notification.objects.create(
                recipient=locked.farmer,
                title="Booking Confirmed!",
                message=f"Provider {actor_user.get_full_name() or actor_user.username} confirmed your booking {locked.reference_id} for {locked.scheduled_date}.",
                link_url=f"/farmer/bookings"
            )

            # Update farm project status if linked
            if locked.request.farm_project:
                locked.request.farm_project.update_project_status()

            self.status = locked.status
            return locked

    def cancel(self, actor_user, reason=""):
        """
        Handles cancellation by farmer or provider.
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

            # Reopen or cancel service request
            if is_provider:
                # Reopen request so farmer can choose another quote or get backup providers
                locked.request.status = 'open'
                locked.request.save()
                # Notify farmer
                Notification.objects.create(
                    recipient=locked.farmer,
                    title="Provider Cancelled Booking - Backup Options Available",
                    message=f"Provider {locked.provider.get_full_name() or locked.provider.username} cancelled booking {locked.reference_id}. Reason: {reason}. Alternative providers are available.",
                    link_url=f"/farmer/requests/{locked.request.id}"
                )
            else:
                locked.request.status = 'cancelled'
                locked.request.save()
                # Notify provider
                Notification.objects.create(
                    recipient=locked.provider,
                    title="Booking Cancelled by Farmer",
                    message=f"Farmer {locked.farmer.get_full_name() or locked.farmer.username} cancelled booking {locked.reference_id}. Reason: {reason}.",
                    link_url=f"/provider/bookings"
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
                locked.request.farm_project.update_project_status()

            self.status = locked.status
            return locked

    def __str__(self):
        return f"{self.reference_id} ({self.status}) - ₹{self.agreed_amount}"


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
