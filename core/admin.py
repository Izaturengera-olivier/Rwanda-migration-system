from django.contrib import admin
# from django.contrib.gis.admin import GISModelAdmin  # Commented for SQLite
from .models import (
    User, Location, Dataset, PopulationData, MigrationData,
    EmploymentData, EducationData, HealthcareData, InfrastructureData,
    ModelVersion, ModelPrediction, AuditLog, Notification, NotificationRead
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'organization', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['username', 'email', 'organization']


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'location_type', 'province', 'district', 'sector', 'is_study_area']
    list_filter = ['location_type', 'province', 'is_study_area']
    search_fields = ['name', 'district', 'sector']


@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display = ['name', 'dataset_type', 'year', 'version', 'status', 'is_active', 'upload_date']
    list_filter = ['dataset_type', 'year', 'status', 'is_active']
    search_fields = ['name', 'source']
    readonly_fields = ['upload_date', 'processed_date']


@admin.register(PopulationData)
class PopulationDataAdmin(admin.ModelAdmin):
    list_display = ['location', 'year', 'total_population', 'youth_population_15_24', 'youth_percentage']
    list_filter = ['year', 'dataset']
    search_fields = ['location__name']


@admin.register(MigrationData)
class MigrationDataAdmin(admin.ModelAdmin):
    list_display = ['location', 'year', 'migration_rate', 'out_migration_count', 'migration_intent_percentage']
    list_filter = ['year', 'dataset']
    search_fields = ['location__name']


@admin.register(EmploymentData)
class EmploymentDataAdmin(admin.ModelAdmin):
    list_display = ['location', 'year', 'unemployment_rate', 'youth_unemployment_rate', 'poverty_rate']
    list_filter = ['year', 'dataset']
    search_fields = ['location__name']


@admin.register(EducationData)
class EducationDataAdmin(admin.ModelAdmin):
    list_display = ['location', 'year', 'literacy_rate', 'school_enrollment_rate', 'education_access_index']
    list_filter = ['year', 'dataset']
    search_fields = ['location__name']


@admin.register(HealthcareData)
class HealthcareDataAdmin(admin.ModelAdmin):
    list_display = ['location', 'year', 'healthcare_access_index', 'hospitals', 'health_centers']
    list_filter = ['year', 'dataset']
    search_fields = ['location__name']


@admin.register(InfrastructureData)
class InfrastructureDataAdmin(admin.ModelAdmin):
    list_display = ['location', 'year', 'infrastructure_gap_index', 'electricity_coverage', 'internet_coverage']
    list_filter = ['year', 'dataset']
    search_fields = ['location__name']


@admin.register(ModelVersion)
class ModelVersionAdmin(admin.ModelAdmin):
    list_display = ['name', 'version', 'algorithm', 'status', 'is_active', 'accuracy', 'training_date']
    list_filter = ['algorithm', 'status', 'is_active']
    search_fields = ['name', 'version']
    readonly_fields = ['training_date', 'evaluation_date']


@admin.register(ModelPrediction)
class ModelPredictionAdmin(admin.ModelAdmin):
    list_display = ['location', 'year', 'risk_category', 'risk_score', 'model_version', 'prediction_date']
    list_filter = ['risk_category', 'year', 'model_version']
    search_fields = ['location__name']
    readonly_fields = ['prediction_date']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'user', 'entity_type', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['user__username', 'description']
    readonly_fields = ['timestamp']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'infrastructure_sector', 'location', 'sent_by', 'created_at']
    list_filter = ['infrastructure_sector', 'created_at']
    search_fields = ['title', 'message', 'sent_by__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(NotificationRead)
class NotificationReadAdmin(admin.ModelAdmin):
    list_display = ['notification', 'user', 'read_at']
    list_filter = ['read_at']
    search_fields = ['user__username', 'notification__title']
    readonly_fields = ['read_at']
