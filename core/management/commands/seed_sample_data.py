from django.core.management.base import BaseCommand
from core.models import (Location, PopulationData, MigrationData, EmploymentData,
                         EducationData, HealthcareData, InfrastructureData, Dataset)
from django.utils import timezone

SAMPLE_DATA = {
    'Nyaruguru': {
        'population': {'total_population': 328000, 'youth_population_15_24': 72160, 'youth_population_15_35': 114800, 'youth_percentage': 22.0, 'population_density': 198.0, 'household_count': 65600, 'avg_household_size': 5.0},
        'migration': {'migration_rate': 8.5, 'out_migration_count': 2788, 'youth_out_migration': 1950, 'migration_intent_percentage': 34.2, 'primary_destination': 'Kigali', 'net_migration': -2100},
        'employment': {'unemployment_rate': 18.2, 'youth_unemployment_rate': 32.5, 'poverty_rate': 58.3, 'job_opportunities_index': 28.0, 'avg_monthly_income': 18000.0, 'business_count': 420},
        'education': {'literacy_rate': 71.2, 'youth_literacy_rate': 82.4, 'school_enrollment_rate': 78.5, 'education_access_index': 55.0, 'primary_schools': 48, 'secondary_schools': 12},
        'healthcare': {'hospitals': 1, 'health_centers': 14, 'healthcare_access_index': 42.0, 'distance_to_nearest_hospital': 18.5, 'vaccination_coverage': 88.0},
        'infrastructure': {'electricity_coverage': 22.0, 'internet_coverage': 8.5, 'water_access_rate': 68.0, 'road_density': 0.28, 'sanitation_coverage': 55.0, 'public_transport_access': 30.0, 'infrastructure_gap_index': 72.0},
    },
    'Gisagara': {
        'population': {'total_population': 341000, 'youth_population_15_24': 74020, 'youth_population_15_35': 119350, 'youth_percentage': 21.7, 'population_density': 312.0, 'household_count': 68200, 'avg_household_size': 5.0},
        'migration': {'migration_rate': 7.2, 'out_migration_count': 2455, 'youth_out_migration': 1718, 'migration_intent_percentage': 29.8, 'primary_destination': 'Kigali', 'net_migration': -1800},
        'employment': {'unemployment_rate': 15.8, 'youth_unemployment_rate': 28.4, 'poverty_rate': 52.1, 'job_opportunities_index': 34.0, 'avg_monthly_income': 21000.0, 'business_count': 580},
        'education': {'literacy_rate': 74.5, 'youth_literacy_rate': 85.2, 'school_enrollment_rate': 81.2, 'education_access_index': 60.0, 'primary_schools': 52, 'secondary_schools': 15},
        'healthcare': {'hospitals': 1, 'health_centers': 16, 'healthcare_access_index': 48.0, 'distance_to_nearest_hospital': 14.2, 'vaccination_coverage': 91.0},
        'infrastructure': {'electricity_coverage': 28.0, 'internet_coverage': 12.0, 'water_access_rate': 72.0, 'road_density': 0.35, 'sanitation_coverage': 60.0, 'public_transport_access': 38.0, 'infrastructure_gap_index': 65.0},
    },
    'Ngororero': {
        'population': {'total_population': 358000, 'youth_population_15_24': 78760, 'youth_population_15_35': 125300, 'youth_percentage': 22.0, 'population_density': 285.0, 'household_count': 71600, 'avg_household_size': 5.0},
        'migration': {'migration_rate': 9.1, 'out_migration_count': 3258, 'youth_out_migration': 2280, 'migration_intent_percentage': 38.5, 'primary_destination': 'Kigali', 'net_migration': -2500},
        'employment': {'unemployment_rate': 20.1, 'youth_unemployment_rate': 35.8, 'poverty_rate': 61.4, 'job_opportunities_index': 24.0, 'avg_monthly_income': 16500.0, 'business_count': 380},
        'education': {'literacy_rate': 68.9, 'youth_literacy_rate': 79.6, 'school_enrollment_rate': 75.8, 'education_access_index': 50.0, 'primary_schools': 55, 'secondary_schools': 11},
        'healthcare': {'hospitals': 1, 'health_centers': 15, 'healthcare_access_index': 38.0, 'distance_to_nearest_hospital': 22.0, 'vaccination_coverage': 85.0},
        'infrastructure': {'electricity_coverage': 18.0, 'internet_coverage': 6.5, 'water_access_rate': 62.0, 'road_density': 0.22, 'sanitation_coverage': 48.0, 'public_transport_access': 25.0, 'infrastructure_gap_index': 78.0},
    },
    'Rutsiro': {
        'population': {'total_population': 310000, 'youth_population_15_24': 67580, 'youth_population_15_35': 108500, 'youth_percentage': 21.8, 'population_density': 245.0, 'household_count': 62000, 'avg_household_size': 5.0},
        'migration': {'migration_rate': 7.8, 'out_migration_count': 2418, 'youth_out_migration': 1692, 'migration_intent_percentage': 31.5, 'primary_destination': 'Kigali', 'net_migration': -1900},
        'employment': {'unemployment_rate': 16.5, 'youth_unemployment_rate': 30.2, 'poverty_rate': 54.8, 'job_opportunities_index': 31.0, 'avg_monthly_income': 19500.0, 'business_count': 450},
        'education': {'literacy_rate': 72.8, 'youth_literacy_rate': 83.5, 'school_enrollment_rate': 79.4, 'education_access_index': 57.0, 'primary_schools': 46, 'secondary_schools': 13},
        'healthcare': {'hospitals': 1, 'health_centers': 13, 'healthcare_access_index': 44.0, 'distance_to_nearest_hospital': 16.8, 'vaccination_coverage': 89.0},
        'infrastructure': {'electricity_coverage': 25.0, 'internet_coverage': 10.0, 'water_access_rate': 70.0, 'road_density': 0.30, 'sanitation_coverage': 57.0, 'public_transport_access': 33.0, 'infrastructure_gap_index': 68.0},
    },
    'Gicumbi': {
        'population': {'total_population': 397000, 'youth_population_15_24': 87340, 'youth_population_15_35': 138950, 'youth_percentage': 22.0, 'population_density': 358.0, 'household_count': 79400, 'avg_household_size': 5.0},
        'migration': {'migration_rate': 6.5, 'out_migration_count': 2580, 'youth_out_migration': 1806, 'migration_intent_percentage': 26.4, 'primary_destination': 'Kigali', 'net_migration': -1600},
        'employment': {'unemployment_rate': 14.2, 'youth_unemployment_rate': 25.6, 'poverty_rate': 46.5, 'job_opportunities_index': 40.0, 'avg_monthly_income': 24000.0, 'business_count': 720},
        'education': {'literacy_rate': 78.2, 'youth_literacy_rate': 88.4, 'school_enrollment_rate': 84.6, 'education_access_index': 66.0, 'primary_schools': 62, 'secondary_schools': 18},
        'healthcare': {'hospitals': 2, 'health_centers': 18, 'healthcare_access_index': 55.0, 'distance_to_nearest_hospital': 11.5, 'vaccination_coverage': 93.0},
        'infrastructure': {'electricity_coverage': 35.0, 'internet_coverage': 18.0, 'water_access_rate': 78.0, 'road_density': 0.42, 'sanitation_coverage': 65.0, 'public_transport_access': 45.0, 'infrastructure_gap_index': 55.0},
    },
    'Kirehe': {
        'population': {'total_population': 345000, 'youth_population_15_24': 75900, 'youth_population_15_35': 120750, 'youth_percentage': 22.0, 'population_density': 198.0, 'household_count': 69000, 'avg_household_size': 5.0},
        'migration': {'migration_rate': 10.2, 'out_migration_count': 3519, 'youth_out_migration': 2463, 'migration_intent_percentage': 42.1, 'primary_destination': 'Kigali', 'net_migration': -2800},
        'employment': {'unemployment_rate': 22.4, 'youth_unemployment_rate': 38.9, 'poverty_rate': 64.2, 'job_opportunities_index': 20.0, 'avg_monthly_income': 15000.0, 'business_count': 320},
        'education': {'literacy_rate': 65.4, 'youth_literacy_rate': 76.8, 'school_enrollment_rate': 72.1, 'education_access_index': 45.0, 'primary_schools': 50, 'secondary_schools': 10},
        'healthcare': {'hospitals': 1, 'health_centers': 12, 'healthcare_access_index': 35.0, 'distance_to_nearest_hospital': 25.5, 'vaccination_coverage': 82.0},
        'infrastructure': {'electricity_coverage': 15.0, 'internet_coverage': 5.0, 'water_access_rate': 58.0, 'road_density': 0.18, 'sanitation_coverage': 42.0, 'public_transport_access': 20.0, 'infrastructure_gap_index': 82.0},
    },
}


class Command(BaseCommand):
    help = 'Seed sample data for all 6 study districts'

    def handle(self, *args, **options):
        year = 2023
        dataset, _ = Dataset.objects.get_or_create(
            name='Sample Data 2023', year=year, version='1.0',
            defaults={
                'dataset_type': 'other', 'source': 'Illustrative Sample Data',
                'status': 'processed', 'is_active': True,
                'processed_date': timezone.now(), 'row_count': 6,
            }
        )

        for district_name, data in SAMPLE_DATA.items():
            try:
                location = Location.objects.get(name=district_name, location_type='district')
            except Location.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  Skipping {district_name} — not found'))
                continue

            PopulationData.objects.update_or_create(location=location, year=year, dataset=dataset, defaults=data['population'])
            MigrationData.objects.update_or_create(location=location, year=year, dataset=dataset, defaults=data['migration'])
            EmploymentData.objects.update_or_create(location=location, year=year, dataset=dataset, defaults=data['employment'])
            EducationData.objects.update_or_create(location=location, year=year, dataset=dataset, defaults=data['education'])
            HealthcareData.objects.update_or_create(location=location, year=year, dataset=dataset, defaults=data['healthcare'])
            InfrastructureData.objects.update_or_create(location=location, year=year, dataset=dataset, defaults=data['infrastructure'])
            self.stdout.write(f'  Seeded: {district_name}')

        self.stdout.write(self.style.SUCCESS(f'\nDone. All 6 districts seeded for year {year}.'))
