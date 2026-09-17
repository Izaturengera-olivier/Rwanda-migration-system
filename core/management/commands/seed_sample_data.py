from django.core.management.base import BaseCommand
from core.models import (Location, PopulationData, MigrationData, EmploymentData,
                         EducationData, HealthcareData, InfrastructureData, Dataset)
from django.utils import timezone

SAMPLE_DATA = {
    'Gisagara': {
        'population': {'total_population': 341000, 'youth_population_15_24': 74020, 'youth_population_15_35': 119350, 'youth_percentage': 21.7, 'population_density': 312.0, 'household_count': 68200, 'avg_household_size': 5.0},
        'migration': {'migration_rate': 7.2, 'out_migration_count': 2455, 'youth_out_migration': 1718, 'migration_intent_percentage': 29.8, 'primary_destination': 'Kigali', 'net_migration': -1800},
        'employment': {'unemployment_rate': 15.8, 'youth_unemployment_rate': 28.4, 'poverty_rate': 52.1, 'job_opportunities_index': 34.0, 'avg_monthly_income': 21000.0, 'business_count': 580},
        'education': {'literacy_rate': 74.5, 'youth_literacy_rate': 85.2, 'school_enrollment_rate': 81.2, 'education_access_index': 60.0, 'primary_schools': 52, 'secondary_schools': 15},
        'healthcare': {'hospitals': 1, 'health_centers': 16, 'healthcare_access_index': 48.0, 'distance_to_nearest_hospital': 14.2, 'vaccination_coverage': 91.0},
        'infrastructure': {'electricity_coverage': 28.0, 'internet_coverage': 12.0, 'water_access_rate': 72.0, 'road_density': 0.35, 'sanitation_coverage': 60.0, 'public_transport_access': 38.0, 'infrastructure_gap_index': 65.0},
    },
}


class Command(BaseCommand):
    help = 'Seed sample data for Gisagara district'

    def handle(self, *args, **options):
        year = 2023
        dataset, _ = Dataset.objects.get_or_create(
            name='Sample Data 2023', year=year, version='1.0',
            defaults={
                'dataset_type': 'other', 'source': 'Illustrative Sample Data',
                'status': 'processed', 'is_active': True,
                'processed_date': timezone.now(), 'row_count': 1,
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

        self.stdout.write(self.style.SUCCESS(f'\nDone. Gisagara district seeded for year {year}.'))
