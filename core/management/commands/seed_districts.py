import json
from django.core.management.base import BaseCommand
from core.models import Location

DISTRICTS = [
    {
        "name": "Gisagara",
        "province": "Southern",
        "code": "RW-GS",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [29.7400, -2.4800], [29.8600, -2.4700], [29.9600, -2.5400],
                [29.9800, -2.6600], [29.9200, -2.7800], [29.8000, -2.7800],
                [29.7400, -2.7000], [29.7500, -2.6000], [29.7400, -2.4800]
            ]]
        }
    },
]


class Command(BaseCommand):
    help = 'Seed Gisagara study district with boundary data and sample indicator data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding study district...')

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
            f'\nDone. {len(DISTRICTS)} study district seeded.\n'
            'You can now see it on the map at /map'
        ))
