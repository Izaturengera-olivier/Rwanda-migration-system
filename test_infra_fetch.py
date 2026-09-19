import os
import sys
import django

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Location, InfrastructureData, ModelPrediction

# Test infrastructure data fetching for sector locations
print("Testing infrastructure data fetching for sector locations...")

# Get a sector location
sector = Location.objects.filter(location_type='sector').first()
print(f"Testing location: {sector.name} (ID: {sector.id})")
print(f"Location type: {sector.location_type}")
print(f"District: {sector.district}")
print(f"Sector: {sector.sector}")

# Test fetching infrastructure data for different years
for year in [2021, 2022, 2023]:
    infra = InfrastructureData.objects.filter(location=sector, year=year).first()
    print(f"\nInfrastructure data for {year}:")
    if infra:
        print(f"  Gap index: {infra.infrastructure_gap_index}")
        print(f"  Electricity coverage: {infra.electricity_coverage}")
        print(f"  Internet coverage: {infra.internet_coverage}")
        print(f"  Water access rate: {infra.water_access_rate}")
    else:
        print(f"  No data found for year {year}")

# Test the profile endpoint logic (similar to views.py)
print("\n\nTesting profile endpoint logic:")
year = 2023
prediction = ModelPrediction.objects.filter(location=sector, year=year).first()
target_year = prediction.year if prediction else year

print(f"Target year: {target_year}")
def get_or_none(model, **kwargs):
    return model.objects.filter(**kwargs).order_by('-id').first()

infrastructure = get_or_none(InfrastructureData, location=sector, year=target_year)
print(f"Infrastructure data using get_or_none: {infrastructure}")
if infrastructure:
    print(f"  Gap index: {infrastructure.infrastructure_gap_index}")
    print(f"  Electricity coverage: {infrastructure.electricity_coverage}")
