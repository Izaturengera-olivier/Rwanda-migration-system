from rest_framework import serializers
from core.models import (
    User, Location, Dataset, PopulationData, MigrationData,
    EmploymentData, EducationData, HealthcareData, InfrastructureData,
    ModelVersion, ModelPrediction, AuditLog
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'organization', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = [
            'id', 'name', 'name_en', 'location_type', 'province', 'district',
            'sector', 'code', 'parent_location', 'population', 'area_sqkm',
            'is_study_area'
        ]


class DatasetSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Dataset
        fields = [
            'id', 'name', 'dataset_type', 'year', 'version', 'source',
            'uploaded_by', 'uploaded_by_name', 'file_path', 'file_size',
            'row_count', 'status', 'validation_errors', 'processing_log',
            'upload_date', 'processed_date', 'is_active', 'metadata',
            'download_url'
        ]
        read_only_fields = ['upload_date', 'processed_date']

    def get_download_url(self, obj):
        return f"/api/datasets/{obj.id}/download/"


class PopulationDataSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = PopulationData
        fields = [
            'id', 'location', 'location_name', 'dataset', 'year',
            'total_population', 'male_population', 'female_population',
            'youth_population_15_24', 'youth_population_15_35',
            'youth_percentage', 'household_count', 'avg_household_size',
            'population_density', 'urban_population', 'rural_population',
            'birth_rate', 'death_rate', 'metadata'
        ]


class MigrationDataSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = MigrationData
        fields = [
            'id', 'location', 'location_name', 'dataset', 'year',
            'migration_rate', 'out_migration_count', 'in_migration_count',
            'net_migration', 'youth_out_migration', 'migration_intent_percentage',
            'primary_destination', 'migration_reasons', 'return_migration_rate',
            'seasonal_migration', 'metadata'
        ]


class EmploymentDataSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = EmploymentData
        fields = [
            'id', 'location', 'location_name', 'dataset', 'year',
            'total_labor_force', 'employed_population', 'unemployed_population',
            'unemployment_rate', 'youth_unemployment_rate', 'agricultural_employment',
            'formal_sector_employment', 'informal_sector_employment',
            'avg_monthly_income', 'poverty_rate', 'business_count',
            'job_opportunities_index', 'metadata'
        ]


class EducationDataSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = EducationData
        fields = [
            'id', 'location', 'location_name', 'dataset', 'year',
            'primary_schools', 'secondary_schools', 'tertiary_institutions',
            'literacy_rate', 'youth_literacy_rate', 'school_enrollment_rate',
            'primary_enrollment', 'secondary_enrollment', 'student_teacher_ratio',
            'education_access_index', 'metadata'
        ]


class HealthcareDataSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = HealthcareData
        fields = [
            'id', 'location', 'location_name', 'dataset', 'year',
            'hospitals', 'health_centers', 'dispensaries', 'doctors',
            'nurses', 'hospital_beds', 'healthcare_access_index',
            'distance_to_nearest_hospital', 'maternal_mortality_rate',
            'infant_mortality_rate', 'vaccination_coverage', 'metadata'
        ]


class InfrastructureDataSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = InfrastructureData
        fields = [
            'id', 'location', 'location_name', 'dataset', 'year',
            'road_density', 'paved_road_length', 'unpaved_road_length',
            'electricity_coverage', 'electricity_access_rate', 'internet_coverage',
            'internet_access_rate', 'mobile_network_coverage', 'water_access_rate',
            'sanitation_coverage', 'public_transport_access',
            'infrastructure_gap_index', 'metadata'
        ]


class ModelVersionSerializer(serializers.ModelSerializer):
    trained_by_name = serializers.CharField(source='trained_by.username', read_only=True)
    training_dataset_name = serializers.CharField(source='training_dataset.name', read_only=True)

    class Meta:
        model = ModelVersion
        fields = [
            'id', 'name', 'version', 'algorithm', 'description',
            'training_dataset', 'training_dataset_name', 'trained_by',
            'trained_by_name', 'model_file_path', 'feature_importance',
            'hyperparameters', 'accuracy', 'precision', 'recall',
            'f1_score', 'confusion_matrix', 'training_date',
            'evaluation_date', 'status', 'is_active', 'notes'
        ]
        read_only_fields = ['training_date', 'evaluation_date']


class ModelPredictionSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)
    model_name = serializers.CharField(source='model_version.name', read_only=True)

    class Meta:
        model = ModelPrediction
        fields = [
            'id', 'location', 'location_name', 'model_version', 'model_name',
            'dataset', 'year', 'risk_score', 'risk_category',
            'probability_low', 'probability_moderate', 'probability_high',
            'probability_very_high', 'contributing_factors', 'feature_values',
            'prediction_date', 'confidence_interval'
        ]
        read_only_fields = ['prediction_date']


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'action', 'entity_type', 'entity_id',
            'description', 'ip_address', 'user_agent', 'changes', 'timestamp'
        ]
        read_only_fields = ['timestamp']


class ComparisonSerializer(serializers.Serializer):
    location_name = serializers.CharField()
    risk_score = serializers.FloatField()
    risk_category = serializers.CharField()
    infrastructure_gap_index = serializers.FloatField()
    unemployment_rate = serializers.FloatField()
    youth_unemployment_rate = serializers.FloatField()
    education_access_index = serializers.FloatField()
    healthcare_access_index = serializers.FloatField()


class DashboardStatsSerializer(serializers.Serializer):
    total_locations = serializers.IntegerField()
    high_risk_count = serializers.IntegerField()
    moderate_risk_count = serializers.IntegerField()
    low_risk_count = serializers.IntegerField()
    very_high_risk_count = serializers.IntegerField()
    infrastructure_priority_count = serializers.IntegerField()
    last_data_update = serializers.DateTimeField(allow_null=True, required=False)
    active_model_version = serializers.CharField(allow_null=True, required=False)
