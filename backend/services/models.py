from django.db import models
from django.conf import settings
from django.utils import timezone

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


class AgriculturalReferenceRecord(models.Model):
    """
    Canonical statistical reference record from official and audited agricultural datasets.
    Stores metadata, publisher provenance, evidence classification, and verification status.
    Historical reference data is strictly separated from live operational bookings.
    """
    EVIDENCE_CHOICES = [
        ('VERIFIED', 'Verified'),
        ('TESTED', 'Tested'),
        ('PARTIALLY_VERIFIED', 'Partially Verified'),
        ('ESTIMATED', 'Estimated'),
        ('UNVERIFIED', 'Unverified'),
        ('RESTRICTED', 'Restricted'),
        ('UNAVAILABLE', 'Unavailable'),
    ]

    record_id = models.CharField(max_length=120, unique=True, db_index=True)
    dataset = models.CharField(max_length=150)
    indicator = models.CharField(max_length=150)
    original_value = models.CharField(max_length=100, null=True, blank=True)
    numeric_value = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    unit = models.CharField(max_length=50, blank=True)
    state = models.CharField(max_length=100, db_index=True)
    district = models.CharField(max_length=100, blank=True, db_index=True)
    crop = models.CharField(max_length=100, blank=True)
    reference_period = models.CharField(max_length=60, blank=True)
    publication_date = models.CharField(max_length=60, blank=True)
    source_publisher = models.CharField(max_length=255, blank=True)
    source_url = models.URLField(max_length=500, blank=True)
    table_page_ref = models.CharField(max_length=120, blank=True)
    evidence_classification = models.CharField(max_length=50, choices=EVIDENCE_CHOICES, default='ESTIMATED')
    verification_status = models.CharField(max_length=120, blank=True)
    licensing_status = models.CharField(max_length=120, blank=True)
    import_timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['state', 'indicator', 'record_id']

    def __str__(self):
        return f"{self.record_id} | {self.state} - {self.indicator}: {self.original_value} {self.unit}"


class HistoricalMachineryRate(models.Model):
    """
    Historical machinery rental benchmark comparisons for agricultural planning.
    STRICT RULE: Historical rates are purely reference benchmarks and must NEVER become confirmed provider quotations.
    """
    equipment_type = models.CharField(max_length=150, help_text="e.g. Combine Harvester, Tractor 45-55 HP, Laser Land Leveler")
    operation = models.CharField(max_length=150, help_text="e.g. Harvesting, Tillage, Laser Leveling")
    state = models.CharField(max_length=100, default='Uttar Pradesh')
    district = models.CharField(max_length=100, default='Meerut')
    historical_rate_min = models.DecimalField(max_digits=10, decimal_places=2)
    historical_rate_max = models.DecimalField(max_digits=10, decimal_places=2)
    rate_unit = models.CharField(max_length=50, default='Per Acre')
    reference_year = models.CharField(max_length=50, default='2023-24')
    source_reference = models.CharField(max_length=255, default='World Bank UP Machinery Assessment / Mechanization Portal')
    is_indicative_only = models.BooleanField(default=True, help_text="Must remain True. Historical data only.")
    disclaimer = models.TextField(default="Historical planning reference only. Actual provider quotations depend on seasonal demand, field conditions, and direct provider quotation.")

    class Meta:
        ordering = ['operation', 'equipment_type']

    def __str__(self):
        return f"{self.equipment_type} ({self.operation}): ₹{self.historical_rate_min}-₹{self.historical_rate_max} {self.rate_unit} [{self.reference_year}]"


class HistoricalAgriculturalWage(models.Model):
    """
    Historical wage observations across years for planning and budgeting.
    STRICT RULE: Historical wage observations must NEVER become agreed worker payments.
    """
    state = models.CharField(max_length=100, default='Uttar Pradesh')
    district = models.CharField(max_length=100, default='Meerut')
    operation = models.CharField(max_length=100, help_text="e.g. Harvesting & Threshing, Sowing, Weeding")
    daily_wage_rate = models.DecimalField(max_digits=8, decimal_places=2)
    gender_category = models.CharField(max_length=20, default='All')
    reference_year = models.CharField(max_length=20, help_text="e.g. 2024-25, 2023-24")
    source_reference = models.CharField(max_length=255, default='RBI Rural Wages in India / Labour Bureau')
    is_indicative_only = models.BooleanField(default=True, help_text="Must remain True.")
    disclaimer = models.TextField(default="Historical wage observation for planning references. Actual payments are determined by direct farmer-worker agreement.")

    class Meta:
        ordering = ['-reference_year', 'operation']

    def __str__(self):
        return f"{self.state} - {self.operation} ({self.reference_year}): ₹{self.daily_wage_rate}/day"


class InstitutionalResource(models.Model):
    """
    Module 12: Government & Institutional Connect
    Maintains verified directories of central and state agricultural schemes,
    ICAR research institutes, Krishi Vigyan Kendras (KVKs), and registered FPOs.
    """
    CATEGORY_CHOICES = [
        ('central_scheme', 'Central Government Scheme (केन्द्रीय योजना)'),
        ('state_scheme', 'State Government Scheme (राज्य योजना)'),
        ('icar_institute', 'ICAR Research Institute (अनुसंधान संस्थान)'),
        ('kvk', 'Krishi Vigyan Kendra (कृषि विज्ञान केंद्र)'),
        ('fpo', 'Farmer Producer Organization (एफपीओ)'),
        ('portal', 'Official Information Portal (आधिकारिक पोर्टल)'),
    ]

    name_en = models.CharField(max_length=200)
    name_hi = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='central_scheme')
    description_en = models.TextField(blank=True)
    description_hi = models.TextField(blank=True)
    official_url = models.URLField(max_length=300)
    geographic_coverage = models.CharField(max_length=150, default='All India / Pan-India')
    implementing_agency = models.CharField(max_length=200, blank=True)
    contact_info = models.CharField(max_length=200, blank=True)
    is_verified = models.BooleanField(default=True)
    last_reviewed_date = models.DateField(default=timezone.localdate)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', 'category', 'name_en']

    def __str__(self):
        return f"{self.name_en} ({self.get_category_display()})"

