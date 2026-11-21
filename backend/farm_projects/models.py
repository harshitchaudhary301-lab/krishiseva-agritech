from django.db import models
from django.conf import settings

class Farm(models.Model):
    farmer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='farms')
    name = models.CharField(max_length=150, help_text="e.g. Ganga Khet, North Farm")
    village = models.CharField(max_length=100, default='Daurala')
    district = models.CharField(max_length=100, default='Meerut')
    state = models.CharField(max_length=100, default='Uttar Pradesh')
    size_acres = models.DecimalField(max_digits=6, decimal_places=2, default=10.0)
    current_crops = models.CharField(max_length=255, default='Wheat')
    soil_type = models.CharField(max_length=100, blank=True, default='Alluvial Loam')
    irrigation_source = models.CharField(max_length=100, blank=True, default='Tubewell + Canal')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.size_acres} Acres) - {self.farmer.username}"


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
    name = models.CharField(max_length=200, help_text="e.g. Wheat Harvesting 2026")
    crop = models.CharField(max_length=100, default='Wheat')
    target_area_acres = models.DecimalField(max_digits=6, decimal_places=2, default=20.0)
    start_date = models.DateField()
    expected_completion_date = models.DateField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='planning')
    estimated_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    actual_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def update_project_status(self):
        """
        Calculates status & costs based on linked service requests and bookings:
        - Must NEVER be marked 'ready' if essential services are still unconfirmed.
        """
        services = self.project_services.all()
        if not services.exists():
            return

        total_est = 0
        total_act = 0
        all_confirmed = True
        all_completed = True
        any_in_progress = False

        for s in services:
            if s.service_request:
                req = s.service_request
                if hasattr(req, 'booking') and req.booking:
                    booking = req.booking
                    total_act += float(booking.agreed_amount)
                    total_est += float(booking.agreed_amount)
                    if booking.status in ['confirmed', 'scheduled']:
                        pass
                    elif booking.status == 'in_progress':
                        any_in_progress = True
                    elif booking.status == 'completed':
                        pass
                    else:
                        all_confirmed = False
                        all_completed = False
                elif req.budget_max:
                    total_est += float(req.budget_max)
                    all_confirmed = False
                    all_completed = False
                elif req.quotations.filter(status='pending').exists():
                    # Use lowest pending quotation as realistic estimate
                    lowest_quote = req.quotations.filter(status='pending').order_by('quote_amount').first()
                    total_est += float(lowest_quote.quote_amount)
                    all_confirmed = False
                    all_completed = False
                else:
                    all_confirmed = False
                    all_completed = False
            else:
                all_confirmed = False
                all_completed = False

        self.estimated_budget = total_est
        self.actual_cost = total_act

        if all_completed and services.count() > 0:
            self.status = 'completed'
        elif any_in_progress:
            self.status = 'in_progress'
        elif all_confirmed and services.count() > 0:
            self.status = 'ready'
        else:
            self.status = 'planning'

        self.save()

    def __str__(self):
        return f"{self.name} - {self.crop} ({self.target_area_acres} Acres) [{self.get_status_display()}]"


class ProjectService(models.Model):
    project = models.ForeignKey(FarmProject, on_delete=models.CASCADE, related_name='project_services')
    category = models.ForeignKey('services.ServiceCategory', on_delete=models.CASCADE)
    service_request = models.OneToOneField('bookings.ServiceRequest', on_delete=models.SET_NULL, null=True, blank=True, related_name='project_item')
    scope_description = models.CharField(max_length=255)
    target_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.name} -> {self.category.name_en}"
