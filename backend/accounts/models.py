from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [
        ('farmer', 'Farmer'),
        ('worker', 'Agricultural Worker'),
        ('provider', 'Service Provider'),
        ('admin', 'Administrator'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='farmer')
    phone = models.CharField(max_length=15, blank=True)
    state = models.CharField(max_length=100, default='Uttar Pradesh')
    district = models.CharField(max_length=100, default='Meerut')
    village = models.CharField(max_length=100, default='Daurala')
    profile_complete = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_farmer(self):
        return self.role == 'farmer'

    def is_worker(self):
        return self.role == 'worker'

    def is_provider(self):
        return self.role == 'provider'

    def is_admin_role(self):
        return self.role == 'admin' or self.is_superuser

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"


class FarmerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='farmer_profile')
    preferred_language = models.CharField(max_length=10, default='hi', choices=[('hi', 'Hindi'), ('en', 'English')])
    total_land_acres = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    primary_crops = models.CharField(max_length=255, blank=True, help_text="e.g. Wheat, Sugarcane, Mustard")
    address = models.TextField(blank=True)

    def __str__(self):
        return f"Farmer Profile: {self.user.username}"


class WorkerProfile(models.Model):
    VERIFICATION_CHOICES = [
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='worker_profile')
    skills = models.TextField(blank=True, help_text="Comma-separated: Wheat Harvesting, Sowing, Weeding, Spraying")
    daily_wage_rate = models.DecimalField(max_digits=8, decimal_places=2, default=500.0)
    experience_years = models.IntegerField(default=3)
    is_available = models.BooleanField(default=True)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_CHOICES, default='verified')
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.8)
    completed_jobs_count = models.IntegerField(default=0)
    bio = models.TextField(blank=True)

    def __str__(self):
        return f"Worker Profile: {self.user.username}"


class ProviderProfile(models.Model):
    VERIFICATION_CHOICES = [
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='provider_profile')
    business_name = models.CharField(max_length=200, blank=True)
    service_categories = models.TextField(blank=True, help_text="Comma-separated category slugs: tractor_mechanic, machinery_rental, tubewell_repair")
    service_radius_km = models.IntegerField(default=25)
    service_villages = models.TextField(blank=True, help_text="Comma-separated: Daurala, Sardhana, Mawana, Meerut Rural")
    is_available = models.BooleanField(default=True)
    qualifications = models.TextField(blank=True, help_text="Certifications, ITI diploma, machinery licenses")
    machinery_details = models.TextField(blank=True, help_text="Tractors, Harvesters, Roto-seeders available")
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_CHOICES, default='verified')
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.9)
    completed_bookings_count = models.IntegerField(default=0)
    bio = models.TextField(blank=True)

    def __str__(self):
        return f"Provider Profile: {self.business_name or self.user.username}"
