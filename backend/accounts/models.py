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
        ('suspended', 'Suspended'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='worker_profile')
    skills = models.TextField(blank=True, help_text="Comma-separated: Wheat Harvesting, Sowing, Weeding, Spraying")
    daily_wage_rate = models.DecimalField(max_digits=8, decimal_places=2, default=500.0)
    experience_years = models.IntegerField(default=3)
    is_available = models.BooleanField(default=True)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_CHOICES, default='pending')
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_workers')
    verification_notes = models.TextField(blank=True)
    suspended_at = models.DateTimeField(null=True, blank=True)
    suspension_reason = models.TextField(blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.8)
    completed_jobs_count = models.IntegerField(default=0)
    bio = models.TextField(blank=True)

    def is_verified(self):
        return self.verification_status == 'verified'

    def is_suspended(self):
        return self.verification_status == 'suspended'

    def __str__(self):
        return f"Worker Profile: {self.user.username} ({self.verification_status})"


class ProviderProfile(models.Model):
    VERIFICATION_CHOICES = [
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='provider_profile')
    business_name = models.CharField(max_length=200, blank=True)
    service_categories = models.TextField(blank=True, help_text="Comma-separated category slugs: tractor_mechanic, machinery_rental, tubewell_repair")
    service_radius_km = models.IntegerField(default=25)
    service_villages = models.TextField(blank=True, help_text="Comma-separated: Daurala, Sardhana, Mawana, Meerut Rural")
    is_available = models.BooleanField(default=True)
    qualifications = models.TextField(blank=True, help_text="Certifications, ITI diploma, machinery licenses")
    machinery_details = models.TextField(blank=True, help_text="Tractors, Harvesters, Roto-seeders available")
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_CHOICES, default='pending')
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_providers')
    verification_notes = models.TextField(blank=True)
    suspended_at = models.DateTimeField(null=True, blank=True)
    suspension_reason = models.TextField(blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.9)
    completed_bookings_count = models.IntegerField(default=0)
    bio = models.TextField(blank=True)

    def is_verified(self):
        return self.verification_status == 'verified'

    def is_suspended(self):
        return self.verification_status == 'suspended'

    def __str__(self):
        return f"Provider Profile: {self.business_name or self.user.username} ({self.verification_status})"


class UserConsent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consents')
    terms_accepted = models.BooleanField(default=True)
    privacy_accepted = models.BooleanField(default=True)
    is_adult_confirmed = models.BooleanField(default=True, help_text="Explicit confirmation that registrant is 18 years of age or older.")
    terms_version = models.CharField(max_length=20, default='v1.0')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Consent by {self.user.username} ({self.terms_version}) on {self.timestamp}"


class VerificationAuditLog(models.Model):
    ACTION_CHOICES = [
        ('verify', 'Verified'),
        ('reject', 'Rejected'),
        ('suspend', 'Suspended'),
        ('reinstate', 'Reinstated'),
    ]

    target_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_logs')
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verification_actions_performed')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    previous_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    reason = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.target_user.username}: {self.action} by {self.actor.username if self.actor else 'system'}"
