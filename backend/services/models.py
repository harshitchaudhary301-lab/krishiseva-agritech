from django.db import models
from django.conf import settings
from django.utils import timezone


class DatasetVersion(models.Model):
    name = models.CharField(max_length=150, unique=True)
    source_url = models.CharField(max_length=500)
    download_date = models.DateField(default=timezone.localdate)
    dataset_version = models.CharField(max_length=50, default='LGD-2026-V1')
    licence = models.CharField(max_length=200, default='Government Open Data License – India')
    file_hash = models.CharField(max_length=100, blank=True)
    records_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.dataset_version})"


class State(models.Model):
    lgd_code = models.IntegerField(unique=True, db_index=True)
    name_en = models.CharField(max_length=150, db_index=True)
    name_local = models.CharField(max_length=150, blank=True)
    state_or_ut = models.CharField(max_length=10, default='State') # 'State' or 'UT'
    census_2001_code = models.CharField(max_length=20, blank=True)
    census_2011_code = models.CharField(max_length=20, blank=True)
    version = models.IntegerField(default=1)

    class Meta:
        ordering = ['name_en']
        indexes = [
            models.Index(fields=['name_en']),
            models.Index(fields=['lgd_code']),
        ]

    def __str__(self):
        return self.name_en


class District(models.Model):
    lgd_code = models.IntegerField(unique=True, db_index=True)
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='districts')
    name_en = models.CharField(max_length=150, db_index=True)
    name_local = models.CharField(max_length=150, blank=True)
    census_2001_code = models.CharField(max_length=20, blank=True)
    census_2011_code = models.CharField(max_length=20, blank=True)
    version = models.IntegerField(default=1)

    class Meta:
        ordering = ['name_en']
        indexes = [
            models.Index(fields=['state', 'name_en']),
            models.Index(fields=['lgd_code']),
        ]

    def __str__(self):
        return f"{self.name_en}, {self.state.name_en}"


class SubDistrict(models.Model):
    """
    Sub-district / Tehsil / Taluka / Mandal / Circle (Revenue hierarchy)
    """
    lgd_code = models.IntegerField(unique=True, db_index=True)
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='subdistricts')
    name_en = models.CharField(max_length=150, db_index=True)
    name_local = models.CharField(max_length=150, blank=True)
    census_2001_code = models.CharField(max_length=20, blank=True)
    census_2011_code = models.CharField(max_length=20, blank=True)
    version = models.IntegerField(default=1)

    class Meta:
        ordering = ['name_en']
        indexes = [
            models.Index(fields=['district', 'name_en']),
            models.Index(fields=['lgd_code']),
        ]

    def __str__(self):
        return f"{self.name_en}, {self.district.name_en}"


class DevelopmentBlock(models.Model):
    """
    Rural Development Block (Administrative / Planning hierarchy)
    """
    lgd_code = models.IntegerField(unique=True, db_index=True)
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='blocks')
    name_en = models.CharField(max_length=150, db_index=True)
    name_local = models.CharField(max_length=150, blank=True)
    version = models.IntegerField(default=1)

    class Meta:
        ordering = ['name_en']
        indexes = [
            models.Index(fields=['district', 'name_en']),
            models.Index(fields=['lgd_code']),
        ]

    def __str__(self):
        return f"{self.name_en} Block, {self.district.name_en}"


class LocalBody(models.Model):
    """
    Local Government hierarchy:
    Rural (Panchayati Raj): District Panchayat, Intermediate/Block Panchayat, Village Panchayat (Gram Panchayat)
    Urban: Municipal Corporation, Municipality, Town Panchayat / Nagar Panchayat
    Traditional: Traditional Local Body (TLB)
    """
    LOCAL_BODY_CATEGORIES = [
        ('urban', 'Urban Local Body'),
        ('rural', 'Rural Local Body (PRI)'),
        ('traditional', 'Traditional Local Body'),
    ]

    lgd_code = models.IntegerField(unique=True, db_index=True)
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='local_bodies')
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True, related_name='local_bodies')
    name_en = models.CharField(max_length=200, db_index=True)
    name_local = models.CharField(max_length=200, blank=True)
    local_body_type = models.CharField(max_length=30, choices=LOCAL_BODY_CATEGORIES, default='rural')
    local_body_type_code = models.IntegerField(null=True, blank=True)
    local_body_type_name = models.CharField(max_length=150, blank=True)
    parent_local_body_code = models.IntegerField(null=True, blank=True)
    census_2011_code = models.CharField(max_length=30, blank=True)
    version = models.IntegerField(default=1)

    class Meta:
        ordering = ['name_en']
        indexes = [
            models.Index(fields=['state', 'local_body_type']),
            models.Index(fields=['district', 'local_body_type']),
            models.Index(fields=['lgd_code']),
        ]

    def __str__(self):
        return f"{self.name_en} ({self.local_body_type_name or self.local_body_type})"


class Ward(models.Model):
    """
    Constituent wards within Urban and Rural Local Bodies
    """
    ward_code = models.CharField(max_length=60, unique=True, db_index=True)
    local_body = models.ForeignKey(LocalBody, on_delete=models.CASCADE, related_name='wards')
    ward_number = models.CharField(max_length=50)
    ward_name = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ['ward_number']
        indexes = [
            models.Index(fields=['local_body', 'ward_number']),
        ]

    def __str__(self):
        return f"Ward {self.ward_number} - {self.local_body.name_en}"


class Village(models.Model):
    name = models.CharField(max_length=150, db_index=True)
    name_local = models.CharField(max_length=150, blank=True)
    lgd_code = models.IntegerField(unique=True, null=True, blank=True, db_index=True)
    subdistrict = models.ForeignKey(SubDistrict, on_delete=models.SET_NULL, null=True, blank=True, related_name='villages')
    district_ref = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True, related_name='villages')
    state_ref = models.ForeignKey(State, on_delete=models.SET_NULL, null=True, blank=True, related_name='villages')
    district = models.CharField(max_length=150, db_index=True)
    state = models.CharField(max_length=150, default='Uttar Pradesh', db_index=True)
    pincode = models.CharField(max_length=10, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    village_status = models.CharField(max_length=50, default='Inhabitant')
    census_2001_code = models.CharField(max_length=30, blank=True)
    census_2011_code = models.CharField(max_length=30, blank=True)
    version = models.IntegerField(default=1)

    class Meta:
        ordering = ['district', 'name']
        indexes = [
            models.Index(fields=['state', 'district', 'name']),
            models.Index(fields=['subdistrict', 'name']),
            models.Index(fields=['lgd_code']),
        ]

    def __str__(self):
        return f"{self.name}, {self.district}"


class LocationMapping(models.Model):
    """
    Many-to-many village-to-panchayat, village-to-block, and ULB-to-village mappings
    """
    MAPPING_TYPES = [
        ('village_block', 'Village to Development Block'),
        ('village_gp', 'Village to Gram Panchayat'),
        ('village_ulb', 'Village to Urban Local Body'),
    ]

    mapping_type = models.CharField(max_length=30, choices=MAPPING_TYPES)
    village = models.ForeignKey(Village, on_delete=models.CASCADE, related_name='location_mappings')
    development_block = models.ForeignKey(DevelopmentBlock, on_delete=models.CASCADE, null=True, blank=True, related_name='village_mappings')
    local_body = models.ForeignKey(LocalBody, on_delete=models.CASCADE, null=True, blank=True, related_name='village_mappings')
    is_verified = models.BooleanField(default=True)
    source = models.CharField(max_length=100, default='LGD_OFFICIAL')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['mapping_type', 'village']),
            models.Index(fields=['development_block']),
            models.Index(fields=['local_body']),
        ]

    def __str__(self):
        return f"{self.mapping_type} -> Village: {self.village.name}"


class QuarantineLocationRecord(models.Model):
    """
    Quarantine conflicting records, unparseable lines, or invalid relationships for audit
    """
    source_file = models.CharField(max_length=150)
    raw_data = models.JSONField()
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quarantine [{self.source_file}]: {self.reason[:50]}"


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

