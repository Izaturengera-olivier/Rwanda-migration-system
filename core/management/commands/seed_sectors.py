import json
import math
import random
from django.core.management.base import BaseCommand
from core.models import (
    Location, Dataset, PopulationData, MigrationData, EmploymentData,
    EducationData, HealthcareData, InfrastructureData, ModelVersion
)
from ml_service.models import train_model_for_dataset, generate_predictions
from django.utils import timezone

SECTOR_DATA = {
    'Nyaruguru': {
        'province': 'Southern',
        'bounds': [29.38, -3.05, 29.82, -2.71],
        'sectors': [
            'Busanze', 'Cyahinda', 'Kibeho', 'Kivu', 'Mata', 'Muganza',
            'Mukingo', 'Munini', 'Ngera', 'Ngoma', 'Nyabimata', 'Nyagisozi',
            'Ruheru', 'Ruramba'
        ]
    },
    'Gisagara': {
        'province': 'Southern',
        'bounds': [29.57, -2.75, 29.95, -2.50],
        'sectors': [
            'Gikonko', 'Gishubi', 'Kansi', 'Kibirizi', 'Kigembe', 'Mamba',
            'Muganza', 'Mugombwa', 'Mukindo', 'Musha', 'Ndora', 'Nyanza', 'Save'
        ]
    },
    'Ngororero': {
        'province': 'Western',
        'bounds': [29.35, -2.08, 29.72, -1.78],
        'sectors': [
            'Bwira', 'Gatumba', 'Hindiro', 'Kabaya', 'Kageyo', 'Kavumu',
            'Matyazo', 'Muhanda', 'Muhororo', 'Ndaro', 'Ngororero', 'Sovu'
        ]
    },
    'Rutsiro': {
        'province': 'Western',
        'bounds': [29.12, -2.10, 29.45, -1.80],
        'sectors': [
            'Boneza', 'Gihango', 'Kigeyo', 'Kivumu', 'Manihira', 'Mukura',
            'Murunda', 'Musasa', 'Ruhango', 'Rusebeya'
        ]
    },
    'Gicumbi': {
        'province': 'Northern',
        'bounds': [29.87, -1.65, 30.28, -1.32],
        'sectors': [
            'Bukure', 'Bwisige', 'Byumba', 'Cyumba', 'Giti', 'Kaniga',
            'Manyagiro', 'Miyove', 'Kageyo', 'Mukarange', 'Muko', 'Mutete',
            'Nyamiyaga', 'Nyankenke', 'Rubaya', 'Rukomo', 'Rushaki', 'Rutare',
            'Ruvune', 'Shangasha'
        ]
    },
    'Kirehe': {
        'province': 'Eastern',
        'bounds': [30.47, -2.42, 30.92, -2.08],
        'sectors': [
            'Gahara', 'Gatore', 'Kigarama', 'Kirehe', 'Mahama', 'Mpanga',
            'Musaza', 'Nasho', 'Nyamugari', 'Nyarubuye'
        ]
    }
}


def make_grid_polygon(bounds, index, total):
    min_lon, min_lat, max_lon, max_lat = bounds
    cols = math.ceil(math.sqrt(total))
    rows = math.ceil(total / cols)

    r = index // cols
    c = index % cols

    lon_step = (max_lon - min_lon) / cols
    lat_step = (max_lat - min_lat) / rows

    x1 = round(min_lon + c * lon_step, 4)
    x2 = round(min_lon + (c + 1) * lon_step, 4)
    y1 = round(min_lat + r * lat_step, 4)
    y2 = round(min_lat + (r + 1) * lat_step, 4)

    return {
        "type": "Polygon",
        "coordinates": [[
            [x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]
        ]]
    }


class Command(BaseCommand):
    help = 'Seed sector-level locations, geometries, and indicator data for the 6 study districts'

    def handle(self, *args, **options):
        self.stdout.write('Seeding sector-level data for study districts...')
        year = 2023

        dataset, _ = Dataset.objects.get_or_create(
            name='Sector Level Survey Data 2023',
            year=year,
            version='1.0',
            defaults={
                'dataset_type': 'other',
                'source': 'NISR & District Administrative Data',
                'status': 'processed',
                'is_active': True,
                'processed_date': timezone.now(),
                'row_count': 88,
            }
        )

        total_sectors = 0

        for district_name, info in SECTOR_DATA.items():
            province = info['province']
            bounds = info['bounds']
            sectors = info['sectors']

            try:
                parent_district = Location.objects.get(name=district_name, location_type='district')
            except Location.DoesNotExist:
                parent_district = Location.objects.create(
                    name=district_name,
                    location_type='district',
                    province=province,
                    district=district_name,
                    code=f"RW-{district_name[:3].upper()}",
                    is_study_area=True
                )

            random.seed(42 + len(district_name))

            for idx, sector_name in enumerate(sectors):
                geom = make_grid_polygon(bounds, idx, len(sectors))
                code = f"RW-{district_name[:3].upper()}-{sector_name[:3].upper()}-{idx+1}"

                loc, created = Location.objects.update_or_create(
                    district=district_name,
                    sector=sector_name,
                    defaults={
                        'name': f"{sector_name} Sector ({district_name})",
                        'location_type': 'sector',
                        'province': province,
                        'district': district_name,
                        'sector': sector_name,
                        'code': code,
                        'parent_location': parent_district,
                        'geometry_json': json.dumps(geom),
                        'is_study_area': True,
                    }
                )

                # Seed sector indicators with domain-realistic variance
                base_pop = random.randint(18000, 35000)
                youth_24 = int(base_pop * random.uniform(0.20, 0.24))
                youth_35 = int(base_pop * random.uniform(0.33, 0.38))
                unemp = round(random.uniform(10.0, 38.0), 1)
                youth_unemp = round(min(unemp * random.uniform(1.3, 1.8), 50.0), 1)
                poverty = round(random.uniform(35.0, 68.0), 1)
                mig_intent = round(random.uniform(15.0, 48.0), 1)
                mig_rate = round(random.uniform(4.0, 12.5), 1)
                infra_gap = round(random.uniform(30.0, 85.0), 1)
                elec_cov = round(random.uniform(10.0, 45.0), 1)
                net_cov = round(random.uniform(3.0, 25.0), 1)
                water_acc = round(random.uniform(45.0, 82.0), 1)
                road_dens = round(random.uniform(0.15, 0.50), 2)
                edu_idx = round(random.uniform(40.0, 75.0), 1)
                health_idx = round(random.uniform(30.0, 65.0), 1)
                job_opp = round(random.uniform(15.0, 45.0), 1)

                PopulationData.objects.update_or_create(
                    location=loc, year=year, dataset=dataset,
                    defaults={
                        'total_population': base_pop,
                        'youth_population_15_24': youth_24,
                        'youth_population_15_35': youth_35,
                        'youth_percentage': round(youth_24 / base_pop * 100, 1),
                        'population_density': random.randint(150, 450),
                        'household_count': base_pop // 5,
                        'avg_household_size': 5.0,
                    }
                )

                MigrationData.objects.update_or_create(
                    location=loc, year=year, dataset=dataset,
                    defaults={
                        'migration_rate': mig_rate,
                        'out_migration_count': int(base_pop * (mig_rate / 100)),
                        'youth_out_migration': int(youth_24 * (mig_rate / 100)),
                        'migration_intent_percentage': mig_intent,
                        'primary_destination': 'Kigali',
                        'net_migration': -int(base_pop * (mig_rate / 100) * 0.7),
                    }
                )

                EmploymentData.objects.update_or_create(
                    location=loc, year=year, dataset=dataset,
                    defaults={
                        'unemployment_rate': unemp,
                        'youth_unemployment_rate': youth_unemp,
                        'poverty_rate': poverty,
                        'job_opportunities_index': job_opp,
                        'avg_monthly_income': round(random.uniform(12000, 28000), -2),
                        'business_count': random.randint(15, 90),
                    }
                )

                EducationData.objects.update_or_create(
                    location=loc, year=year, dataset=dataset,
                    defaults={
                        'literacy_rate': round(random.uniform(60.0, 82.0), 1),
                        'youth_literacy_rate': round(random.uniform(70.0, 90.0), 1),
                        'school_enrollment_rate': round(random.uniform(70.0, 88.0), 1),
                        'education_access_index': edu_idx,
                        'primary_schools': random.randint(3, 10),
                        'secondary_schools': random.randint(1, 4),
                    }
                )

                HealthcareData.objects.update_or_create(
                    location=loc, year=year, dataset=dataset,
                    defaults={
                        'hospitals': 1 if random.random() < 0.15 else 0,
                        'health_centers': random.randint(1, 3),
                        'healthcare_access_index': health_idx,
                        'distance_to_nearest_hospital': round(random.uniform(8.0, 28.0), 1),
                        'vaccination_coverage': round(random.uniform(80.0, 95.0), 1),
                    }
                )

                InfrastructureData.objects.update_or_create(
                    location=loc, year=year, dataset=dataset,
                    defaults={
                        'electricity_coverage': elec_cov,
                        'internet_coverage': net_cov,
                        'water_access_rate': water_acc,
                        'road_density': road_dens,
                        'sanitation_coverage': round(random.uniform(40.0, 70.0), 1),
                        'public_transport_access': round(random.uniform(15.0, 45.0), 1),
                        'infrastructure_gap_index': infra_gap,
                    }
                )

                total_sectors += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {total_sectors} sectors across 6 districts!"))

        # Train Random Forest model and generate predictions for all locations
        self.stdout.write("Training ML model and generating predictions across all districts and sectors...")
        model_ver = train_model_for_dataset(dataset.id, algorithm='random_forest')
        ModelVersion.objects.filter(is_active=True).update(is_active=False)
        model_ver.is_active = True
        model_ver.status = 'active'
        model_ver.save()

        generate_predictions(model_ver.id, year)
        self.stdout.write(self.style.SUCCESS(f"Done! Activated model {model_ver.name} v{model_ver.version} with predictions for all {Location.objects.count()} locations."))
