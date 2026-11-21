from django.db import models
from django.conf import settings

class Village(models.Model):
    name = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    state = models.CharField(max_length=100, default='Uttar Pradesh')
    pincode = models.CharField(max_length=10, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    class Meta:
        unique_together = ('name', 'district', 'state')
        ordering = ['district', 'name']

    def __str__(self):
        return f"{self.name}, {self.district}"


class ServiceCategory(models.Model):
    slug = models.SlugField(max_length=50, unique=True)
    name_en = models.CharField(max_length=100)
    name_hi = models.CharField(max_length=100)
    description_en = models.TextField(blank=True)
    description_hi = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='Wrench') # Lucide icon name
    is_active = models.BooleanField(default=True, help_text="True for MVP live categories, False for upcoming categories")
    base_unit = models.CharField(max_length=50, default='Per Day / Per Job')
    typical_price_range = models.CharField(max_length=100, default='₹500 - ₹2,000')
    display_order = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = 'Service Categories'
        ordering = ['display_order', 'id']

    def __str__(self):
        return f"{self.name_en} ({self.name_hi}) - {'Active' if self.is_active else 'Upcoming'}"


class ProviderService(models.Model):
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='services')
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='provider_services')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    base_rate = models.DecimalField(max_digits=10, decimal_places=2)
    rate_unit = models.CharField(max_length=50, default='per day') # per acre, per day, per hour, per machine
    equipment_models = models.CharField(max_length=255, blank=True, help_text="e.g. Mahindra 575 DI, John Deere 5050D")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.provider.username} - {self.category.name_en}: {self.title}"


class Review(models.Model):
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews_given')
    target_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews_received')
    rating = models.IntegerField(default=5) # 1 to 5
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review ({self.rating}★) for {self.target_user.username} by {self.reviewer.username}"
