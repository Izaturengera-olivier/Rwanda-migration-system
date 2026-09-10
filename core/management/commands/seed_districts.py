import json
from django.core.management.base import BaseCommand
from core.models import Location

DISTRICTS = [
    {
        "name": "Nyaruguru",
        "province": "Southern",
        "code": "RW-NY",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [29.5200, -2.7100], [29.6500, -2.7100], [29.7800, -2.7500],
                [29.8200, -2.8500], [29.7500, -2.9800], [29.6200, -3.0500],
                [29.4800, -3.0200], [29.3900, -2.9200], [29.3800, -2.8000],
                [29.4500, -2.7400], [29.5200, -2.7100]
            ]]
        }
    },
    {
        "name": "Gisagara",
        "province": "Southern",
        "code": "RW-GS",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [29.6500, -2.5200], [29.8000, -2.5000], [29.9200, -2.5500],
                [29.9500, -2.6500], [29.9000, -2.7500], [29.7800, -2.7500],
                [29.6500, -2.7100], [29.5800, -2.6500], [29.5700, -2.5800],
                [29.6500, -2.5200]
            ]]
        }
    },
    {
        "name": "Ngororero",
        "province": "Western",
        "code": "RW-NG",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [29.4500, -1.8000], [29.5800, -1.7800], [29.6800, -1.8200],
                [29.7200, -1.9200], [29.6800, -2.0200], [29.5500, -2.0800],
                [29.4200, -2.0500], [29.3500, -1.9500], [29.3600, -1.8500],
                [29.4500, -1.8000]
            ]]
        }
    },
    {
        "name": "Rutsiro",
        "province": "Western",
        "code": "RW-RT",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [29.2000, -1.8500], [29.3500, -1.8200], [29.4500, -1.8000],
                [29.3600, -1.8500], [29.3500, -1.9500], [29.4200, -2.0500],
                [29.3000, -2.1000], [29.1800, -2.0500], [29.1200, -1.9500],
                [29.1500, -1.8800], [29.2000, -1.8500]
            ]]
        }
    },
    {
        "name": "Gicumbi",
        "province": "Northern",
        "code": "RW-GC",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [29.9500, -1.3500], [30.1000, -1.3200], [30.2200, -1.3800],
                [30.2800, -1.4800], [30.2500, -1.5800], [30.1200, -1.6500],
                [29.9800, -1.6200], [29.8800, -1.5200], [29.8700, -1.4200],
                [29.9500, -1.3500]
            ]]
        }
    },
    {
        "name": "Kirehe",
        "province": "Eastern",
        "code": "RW-KR",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [30.5500, -2.1000], [30.7000, -2.0800], [30.8500, -2.1200],
                [30.9200, -2.2200], [30.8800, -2.3500], [30.7500, -2.4200],
                [30.5800, -2.4000], [30.4800, -2.3000], [30.4700, -2.1800],
                [30.5500, -2.1000]
            ]]
        }
    },
]


class Command(BaseCommand):
    help = 'Seed the six study districts with boundary data and sample indicator data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding study districts...')

        for d in DISTRICTS:
            loc, created = Location.objects.update_or_create(
                code=d['code'],
                defaults={
                    'name': d['name'],
                    'location_type': 'district',
                    'province': d['province'],
                    'district': d['name'],
                    'sector': '',
                    'geometry_json': json.dumps(d['geometry']),
                    'is_study_area': True,
                }
            )
            action = 'Created' if created else 'Updated'
            self.stdout.write(f'  {action}: {d["name"]} ({d["province"]} Province)')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. {len(DISTRICTS)} study districts seeded.\n'
            'You can now see them on the map at /map'
        ))
