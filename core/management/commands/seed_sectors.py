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
    'Gisagara': {
        'province': 'Southern',
        'bounds': [29.74, -2.78, 29.98, -2.48],
        'sectors': [
            'Gikonko', 'Gishubi', 'Kansi', 'Kibirizi', 'Kigembe', 'Mamba',
            'Muganza', 'Mugombwa', 'Mukindo', 'Musha', 'Ndora', 'Nyanza', 'Save'
        ]
    },
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
    help = 'Seed sector-level locations, geometries, and indicator data for Gisagara district'

    def handle(self, *args, **options):
        self.stdout.write('Seeding sector-level data for Gisagara district...')
        for yr in [2021, 2022, 2023]:
            dataset, _ = Dataset.objects.get_or_create(
                name=f'Sector Level Survey Data {yr}',
                year=yr,
                version='1.0',
                defaults={
                    'dataset_type': 'other',
                    'source': 'NISR & District Administrative Data',
                    'status': 'processed',
                    'is_active': (yr == 2023),
                    'processed_date': timezone.now(),
                    'row_count': 13,
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

                random.seed(42 + len(district_name) + yr)

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

                    # Seed sector indicators with domain-realistic variance by sector profile and year
                    yr_factor = 1.0 + (yr - 2021) * 0.03
                    random.seed(42 + idx * 17 + yr)
                    s_lower = sector_name.lower()
                    if s_lower in ['kigembe', 'muganza']:
                        # Very High Risk profile (remote border sectors with high poverty & out-migration)
                        poverty = round(random.uniform(62.0, 75.0), 1)
                        unemp = round(random.uniform(28.0, 38.0), 1)
                        youth_unemp = round(random.uniform(42.0, 55.0), 1)
                        mig_intent = round(random.uniform(45.0, 60.0), 1)
                        mig_rate = round(random.uniform(10.0, 16.0), 1)
                        infra_gap = round(random.uniform(70.0, 88.0), 1)
                        job_opp = round(random.uniform(10.0, 22.0), 1)
                        elec_cov = round(min(random.uniform(12.0, 28.0) * yr_factor, 100.0), 1)
                    elif s_lower in ['mamba', 'gishubi', 'kibirizi', 'musha']:
                        # High Risk profile
                        poverty = round(random.uniform(50.0, 62.0), 1)
                        unemp = round(random.uniform(22.0, 30.0), 1)
                        youth_unemp = round(random.uniform(34.0, 44.0), 1)
                        mig_intent = round(random.uniform(32.0, 44.0), 1)
                        mig_rate = round(random.uniform(7.5, 11.5), 1)
                        infra_gap = round(random.uniform(58.0, 72.0), 1)
                        job_opp = round(random.uniform(20.0, 32.0), 1)
                        elec_cov = round(min(random.uniform(25.0, 40.0) * yr_factor, 100.0), 1)
                    elif s_lower in ['gikonko', 'mukindo', 'mugombwa', 'nyanza']:
                        # Moderate Risk profile
                        poverty = round(random.uniform(38.0, 50.0), 1)
                        unemp = round(random.uniform(16.0, 24.0), 1)
                        youth_unemp = round(random.uniform(24.0, 34.0), 1)
                        mig_intent = round(random.uniform(22.0, 32.0), 1)
                        mig_rate = round(random.uniform(5.0, 8.5), 1)
                        infra_gap = round(random.uniform(44.0, 58.0), 1)
                        job_opp = round(random.uniform(30.0, 45.0), 1)
                        elec_cov = round(min(random.uniform(35.0, 55.0) * yr_factor, 100.0), 1)
                    else:  # ['save', 'ndora', 'kansi']
                        # Low Risk profile (near university/urban center with higher infrastructure)
                        poverty = round(random.uniform(22.0, 36.0), 1)
                        unemp = round(random.uniform(10.0, 16.0), 1)
                        youth_unemp = round(random.uniform(14.0, 22.0), 1)
                        mig_intent = round(random.uniform(10.0, 20.0), 1)
                        mig_rate = round(random.uniform(2.5, 5.5), 1)
                        infra_gap = round(random.uniform(25.0, 42.0), 1)
                        job_opp = round(random.uniform(48.0, 68.0), 1)
                        elec_cov = round(min(random.uniform(55.0, 78.0) * yr_factor, 100.0), 1)

                    base_pop = random.randint(18000, 35000)
                    youth_24 = int(base_pop * random.uniform(0.20, 0.24))
                    youth_35 = int(base_pop * random.uniform(0.33, 0.38))
                    net_cov = round(min(random.uniform(5.0, 35.0) * yr_factor, 100.0), 1)
                    water_acc = round(min(random.uniform(50.0, 90.0) * yr_factor, 100.0), 1)
                    road_dens = round(random.uniform(0.18, 0.55), 2)
                    edu_idx = round(random.uniform(45.0, 80.0), 1)
                    health_idx = round(random.uniform(35.0, 70.0), 1)

                    PopulationData.objects.update_or_create(
                        location=loc, year=yr, dataset=dataset,
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
                        location=loc, year=yr, dataset=dataset,
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
                        location=loc, year=yr, dataset=dataset,
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
                        location=loc, year=yr, dataset=dataset,
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
                        location=loc, year=yr, dataset=dataset,
                        defaults={
                            'hospitals': 1 if random.random() < 0.15 else 0,
                            'health_centers': random.randint(1, 3),
                            'healthcare_access_index': health_idx,
                            'distance_to_nearest_hospital': round(random.uniform(8.0, 28.0), 1),
                            'vaccination_coverage': round(random.uniform(80.0, 95.0), 1),
                        }
                    )

                    InfrastructureData.objects.update_or_create(
                        location=loc, year=yr, dataset=dataset,
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

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {total_sectors} sectors in Gisagara district across 2021-2023!"))

        # Train Random Forest model and generate predictions for all locations and years
        self.stdout.write("Training ML model and generating predictions across all Gisagara sectors for 2021-2023...")
        active_dataset = Dataset.objects.filter(name='Sector Level Survey Data 2023').first()
        model_ver = train_model_for_dataset(active_dataset.id, algorithm='random_forest')
        ModelVersion.objects.filter(is_active=True).update(is_active=False)
        model_ver.is_active = True
        model_ver.status = 'active'
        model_ver.save()

        for yr in [2021, 2022, 2023]:
            generate_predictions(model_ver.id, yr)

        self.stdout.write(self.style.SUCCESS(f"Done! Activated model {model_ver.name} v{model_ver.version} with predictions for all {Location.objects.count()} locations across 2021-2023."))
