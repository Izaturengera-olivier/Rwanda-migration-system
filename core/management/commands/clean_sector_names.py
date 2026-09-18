from django.core.management.base import BaseCommand
from core.models import Location
import re

class Command(BaseCommand):
    help = 'Remove "Sector (Gisagara)" prefix from sector names'

    def handle(self, *args, **options):
        self.stdout.write('Cleaning up sector names...')
        
        # Find all sectors with the old naming pattern
        old_pattern = re.compile(r'^(.+) Sector \(Gisagara\)$')
        
        sectors_to_update = Location.objects.filter(
            location_type='sector',
            name__regex=r'Sector \(Gisagara\)$'
        )
        
        count = 0
        for sector in sectors_to_update:
            match = old_pattern.match(sector.name)
            if match:
                new_name = match.group(1)  # Extract the base name
                old_name = sector.name
                sector.name = new_name
                sector.save()
                count += 1
                self.stdout.write(f'Updated: "{old_name}" -> "{new_name}"')
        
        if count == 0:
            self.stdout.write(self.style.WARNING('No sectors found with "Sector (Gisagara)" pattern.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Successfully updated {count} sector names!'))