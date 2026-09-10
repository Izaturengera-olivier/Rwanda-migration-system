"""
Database models for Rwanda Migration Risk Mapping System.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
import json


class User(AbstractUser):
    """Custom user model with role-based access."""
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('researcher', 'Researcher'),
        ('viewer', 'Viewer'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    organization = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'


class Location(models.Model):
    """Geographic locations (provinces, districts, sectors)."""
    LOCATION_TYPE_CHOICES = [
        ('province', 'Province'),
        ('district', 'District'),
        ('sector', 'Sector'),
    ]
    
    PROVINCE_CHOICES = [
        ('Northern', 'Northern'),
        ('Southern', 'Southern'),
        ('Eastern', 'Eastern'),
        ('Western', 'Western'),
        ('Kigali', 'Kigali'),
    ]
    
    STUDY_DISTRICTS = [
        'Nyaruguru', 'Gisagara', 'Ngororero', 'Rutsiro', 'Gicumbi', 'Kirehe'
    ]
    
    name = models.CharField(max_length=200)
    name_en = models.CharField(max_length=200, blank=True)
    location_type = models.CharField(max_length=20, choices=LOCATION_TYPE_CHOICES)
    province = models.CharField(max_length=50, choices=PROVINCE_CHOICES)
    district = models.CharField(max_length=100, blank=True)
    sector = models.CharField(max_length=100, blank=True)
    code = models.CharField(max_length=50, unique=True, blank=True)
    parent_location = models.ForeignKey('self', models.CASCADE, null=True, blank=True, related_name='children')
    geometry_json = models.TextField(blank=True, null=True)  # Store GeoJSON as text for SQLite
    population = models.IntegerField(blank=True, null=True)
    area_sqkm = models.FloatField(blank=True, null=True)
    is_study_area = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'locations'
        unique_together = [['name', 'location_type', 'district', 'sector']]
        indexes = [
            models.Index(fields=['location_type']),
            models.Index(fields=['province']),
            models.Index(fields=['district']),
            models.Index(fields=['is_study_area']),
        ]

    def __str__(self):
        return f"{self.name} ({self.location_type})"


class Dataset(models.Model):
    """Dataset metadata and versioning."""
    DATASET_TYPE_CHOICES = [
        ('population', 'Population Data'),
        ('migration', 'Migration Data'),
        ('employment', 'Employment Data'),
        ('education', 'Education Data'),
        ('healthcare', 'Healthcare Data'),
        ('infrastructure', 'Infrastructure Data'),
        ('gis', 'GIS/Boundary Data'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('uploaded', 'Uploaded'),
        ('validated', 'Validated'),
        ('processed', 'Processed'),
        ('active', 'Active'),
        ('archived', 'Archived'),
        ('error', 'Error'),
    ]
    
    name = models.CharField(max_length=200)
    dataset_type = models.CharField(max_length=50, choices=DATASET_TYPE_CHOICES)
    year = models.IntegerField()
    version = models.CharField(max_length=50)
    source = models.CharField(max_length=200, blank=True)
    uploaded_by = models.ForeignKey(User, models.SET_NULL, null=True, related_name='uploaded_datasets')
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.BigIntegerField(blank=True, null=True)
    row_count = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded')
    validation_errors = models.TextField(blank=True)
    processing_log = models.TextField(blank=True)
    upload_date = models.DateTimeField(auto_now_add=True)
    processed_date = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'datasets'
        unique_together = [['name', 'year', 'version']]
        ordering = ['-year', '-upload_date']
        indexes = [
            models.Index(fields=['dataset_type']),
            models.Index(fields=['year']),
            models.Index(fields=['status']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.year} v{self.version})"


class PopulationData(models.Model):
    """Population and demographic indicators."""
    location = models.ForeignKey(Location, models.CASCADE, related_name='population_data')
    dataset = models.ForeignKey(Dataset, models.SET_NULL, null=True, related_name='population_records')
    year = models.IntegerField()
    total_population = models.IntegerField(blank=True, null=True)
    male_population = models.IntegerField(blank=True, null=True)
    female_population = models.IntegerField(blank=True, null=True)
    youth_population_15_24 = models.IntegerField(blank=True, null=True)
    youth_population_15_35 = models.IntegerField(blank=True, null=True)
    youth_percentage = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    household_count = models.IntegerField(blank=True, null=True)
    avg_household_size = models.FloatField(blank=True, null=True)
    population_density = models.FloatField(blank=True, null=True)
    urban_population = models.IntegerField(blank=True, null=True)
    rural_population = models.IntegerField(blank=True, null=True)
    birth_rate = models.FloatField(blank=True, null=True)
    death_rate = models.FloatField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'population_data'
        unique_together = [['location', 'year', 'dataset']]
        indexes = [
            models.Index(fields=['location', 'year']),
            models.Index(fields=['year']),
        ]

    def __str__(self):
        return f"{self.location.name} - {self.year}"


class MigrationData(models.Model):
    """Migration-related indicators."""
    location = models.ForeignKey(Location, models.CASCADE, related_name='migration_data')
    dataset = models.ForeignKey(Dataset, models.SET_NULL, null=True, related_name='migration_records')
    year = models.IntegerField()
    migration_rate = models.FloatField(blank=True, null=True)
    out_migration_count = models.IntegerField(blank=True, null=True)
    in_migration_count = models.IntegerField(blank=True, null=True)
    net_migration = models.IntegerField(blank=True, null=True)
    youth_out_migration = models.IntegerField(blank=True, null=True)
    migration_intent_percentage = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    primary_destination = models.CharField(max_length=200, blank=True)
    migration_reasons = models.JSONField(default=list, blank=True)
    return_migration_rate = models.FloatField(blank=True, null=True)
    seasonal_migration = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'migration_data'
        unique_together = [['location', 'year', 'dataset']]
        indexes = [
            models.Index(fields=['location', 'year']),
            models.Index(fields=['year']),
        ]

    def __str__(self):
        return f"{self.location.name} - {self.year}"


class EmploymentData(models.Model):
    """Employment and economic indicators."""
    location = models.ForeignKey(Location, models.CASCADE, related_name='employment_data')
    dataset = models.ForeignKey(Dataset, models.SET_NULL, null=True, related_name='employment_records')
    year = models.IntegerField()
    total_labor_force = models.IntegerField(blank=True, null=True)
    employed_population = models.IntegerField(blank=True, null=True)
    unemployed_population = models.IntegerField(blank=True, null=True)
    unemployment_rate = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    youth_unemployment_rate = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    agricultural_employment = models.IntegerField(blank=True, null=True)
    formal_sector_employment = models.IntegerField(blank=True, null=True)
    informal_sector_employment = models.IntegerField(blank=True, null=True)
    avg_monthly_income = models.FloatField(blank=True, null=True)
    poverty_rate = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    business_count = models.IntegerField(blank=True, null=True)
    job_opportunities_index = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'employment_data'
        unique_together = [['location', 'year', 'dataset']]
        indexes = [
            models.Index(fields=['location', 'year']),
            models.Index(fields=['year']),
        ]

    def __str__(self):
        return f"{self.location.name} - {self.year}"


class EducationData(models.Model):
    """Education access and indicators."""
    location = models.ForeignKey(Location, models.CASCADE, related_name='education_data')
    dataset = models.ForeignKey(Dataset, models.SET_NULL, null=True, related_name='education_records')
    year = models.IntegerField()
    primary_schools = models.IntegerField(blank=True, null=True)
    secondary_schools = models.IntegerField(blank=True, null=True)
    tertiary_institutions = models.IntegerField(blank=True, null=True)
    literacy_rate = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    youth_literacy_rate = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    school_enrollment_rate = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    primary_enrollment = models.IntegerField(blank=True, null=True)
    secondary_enrollment = models.IntegerField(blank=True, null=True)
    student_teacher_ratio = models.FloatField(blank=True, null=True)
    education_access_index = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'education_data'
        unique_together = [['location', 'year', 'dataset']]
        indexes = [
            models.Index(fields=['location', 'year']),
            models.Index(fields=['year']),
        ]

    def __str__(self):
        return f"{self.location.name} - {self.year}"


class HealthcareData(models.Model):
    """Healthcare facilities and access indicators."""
    location = models.ForeignKey(Location, models.CASCADE, related_name='healthcare_data')
    dataset = models.ForeignKey(Dataset, models.SET_NULL, null=True, related_name='healthcare_records')
    year = models.IntegerField()
    hospitals = models.IntegerField(blank=True, null=True)
    health_centers = models.IntegerField(blank=True, null=True)
    dispensaries = models.IntegerField(blank=True, null=True)
    doctors = models.IntegerField(blank=True, null=True)
    nurses = models.IntegerField(blank=True, null=True)
    hospital_beds = models.IntegerField(blank=True, null=True)
    healthcare_access_index = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    distance_to_nearest_hospital = models.FloatField(blank=True, null=True)
    maternal_mortality_rate = models.FloatField(blank=True, null=True)
    infant_mortality_rate = models.FloatField(blank=True, null=True)
    vaccination_coverage = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'healthcare_data'
        unique_together = [['location', 'year', 'dataset']]
        indexes = [
            models.Index(fields=['location', 'year']),
            models.Index(fields=['year']),
        ]

    def __str__(self):
        return f"{self.location.name} - {self.year}"


class InfrastructureData(models.Model):
    """Infrastructure indicators (roads, electricity, internet, water, etc)."""
    location = models.ForeignKey(Location, models.CASCADE, related_name='infrastructure_data')
    dataset = models.ForeignKey(Dataset, models.SET_NULL, null=True, related_name='infrastructure_records')
    year = models.IntegerField()
    road_density = models.FloatField(blank=True, null=True)
    paved_road_length = models.FloatField(blank=True, null=True)
    unpaved_road_length = models.FloatField(blank=True, null=True)
    electricity_coverage = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    electricity_access_rate = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    internet_coverage = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    internet_access_rate = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    mobile_network_coverage = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    water_access_rate = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    sanitation_coverage = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    public_transport_access = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    infrastructure_gap_index = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'infrastructure_data'
        unique_together = [['location', 'year', 'dataset']]
        indexes = [
            models.Index(fields=['location', 'year']),
            models.Index(fields=['year']),
        ]

    def __str__(self):
        return f"{self.location.name} - {self.year}"


class ModelVersion(models.Model):
    """ML model versioning and metadata."""
    STATUS_CHOICES = [
        ('training', 'Training'),
        ('trained', 'Trained'),
        ('evaluated', 'Evaluated'),
        ('active', 'Active'),
        ('deprecated', 'Deprecated'),
        ('error', 'Error'),
    ]
    
    ALGORITHM_CHOICES = [
        ('logistic_regression', 'Logistic Regression'),
        ('decision_tree', 'Decision Tree'),
        ('random_forest', 'Random Forest'),
        ('gradient_boosting', 'Gradient Boosting'),
        ('svm', 'Support Vector Machine'),
        ('neural_network', 'Neural Network'),
        ('ensemble', 'Ensemble'),
    ]
    
    name = models.CharField(max_length=200)
    version = models.CharField(max_length=50)
    algorithm = models.CharField(max_length=50, choices=ALGORITHM_CHOICES)
    description = models.TextField(blank=True)
    training_dataset = models.ForeignKey(Dataset, models.SET_NULL, null=True, related_name='trained_models')
    trained_by = models.ForeignKey(User, models.SET_NULL, null=True, related_name='trained_models')
    model_file_path = models.CharField(max_length=500, blank=True)
    feature_importance = models.JSONField(default=dict, blank=True)
    hyperparameters = models.JSONField(default=dict, blank=True)
    accuracy = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(1)])
    precision = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(1)])
    recall = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(1)])
    f1_score = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(1)])
    confusion_matrix = models.JSONField(default=dict, blank=True)
    training_date = models.DateTimeField(auto_now_add=True)
    evaluation_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='training')
    is_active = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'model_versions'
        unique_together = [['name', 'version']]
        ordering = ['-training_date']
        indexes = [
            models.Index(fields=['algorithm']),
            models.Index(fields=['status']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} v{self.version} ({self.algorithm})"


class ModelPrediction(models.Model):
    """Migration risk predictions by location."""
    RISK_CATEGORY_CHOICES = [
        ('low', 'Low Risk'),
        ('moderate', 'Moderate Risk'),
        ('high', 'High Risk'),
        ('very_high', 'Very High Risk'),
    ]
    
    location = models.ForeignKey(Location, models.CASCADE, related_name='predictions')
    model_version = models.ForeignKey(ModelVersion, models.CASCADE, related_name='predictions')
    dataset = models.ForeignKey(Dataset, models.SET_NULL, null=True, related_name='predictions')
    year = models.IntegerField()
    risk_score = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(1)])
    risk_category = models.CharField(max_length=20, choices=RISK_CATEGORY_CHOICES)
    probability_low = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(1)])
    probability_moderate = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(1)])
    probability_high = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(1)])
    probability_very_high = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(1)])
    contributing_factors = models.JSONField(default=list, blank=True)
    feature_values = models.JSONField(default=dict, blank=True)
    prediction_date = models.DateTimeField(auto_now_add=True)
    confidence_interval = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'model_predictions'
        unique_together = [['location', 'model_version', 'year']]
        indexes = [
            models.Index(fields=['location', 'year']),
            models.Index(fields=['risk_category']),
            models.Index(fields=['risk_score']),
            models.Index(fields=['model_version']),
        ]

    def __str__(self):
        return f"{self.location.name} - {self.year}: {self.risk_category}"


class AuditLog(models.Model):
    """Audit trail for important system actions."""
    ACTION_CHOICES = [
        ('data_upload', 'Data Upload'),
        ('data_validation', 'Data Validation'),
        ('data_processing', 'Data Processing'),
        ('model_training', 'Model Training'),
        ('model_activation', 'Model Activation'),
        ('prediction_generation', 'Prediction Generation'),
        ('user_login', 'User Login'),
        ('user_logout', 'User Logout'),
        ('settings_change', 'Settings Change'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    entity_type = models.CharField(max_length=100, blank=True)
    entity_id = models.IntegerField(blank=True, null=True)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    changes = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['action']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['entity_type', 'entity_id']),
        ]

    def __str__(self):
        return f"{self.action} by {self.user} at {self.timestamp}"
