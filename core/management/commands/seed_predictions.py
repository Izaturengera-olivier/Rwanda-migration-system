from django.core.management.base import BaseCommand
from core.models import Location, ModelVersion, ModelPrediction, Dataset
from django.utils import timezone

SAMPLE_PREDICTIONS = [
    {
        'district': 'Gisagara',
        'risk_category': 'moderate',
        'risk_score': 0.52,
        'prob_very_high': 0.05, 'prob_high': 0.20, 'prob_moderate': 0.52, 'prob_low': 0.23,
        'factors': [
            {'name': 'Moderate Poverty Rate', 'impact': 'medium', 'value': '52.1%'},
            {'name': 'Limited Job Opportunities', 'impact': 'medium', 'value': '34.0/100'},
        ]
    },
]


class Command(BaseCommand):
    help = 'Seed predictions and activate model for Gisagara district'

    def handle(self, *args, **options):
        year = 2023

        dataset, _ = Dataset.objects.get_or_create(
            name='Sample Data 2023', year=year, version='1.0',
            defaults={
                'dataset_type': 'other',
                'source': 'Illustrative Sample Data',
                'status': 'processed',
                'is_active': True,
                'processed_date': timezone.now(),
                'row_count': len(SAMPLE_PREDICTIONS),
            }
        )

        # Deactivate previous models
        ModelVersion.objects.filter(is_active=True).update(is_active=False)

        # Create or update active model
        model_version, created = ModelVersion.objects.get_or_create(
            name='Random Forest Risk Classifier',
            version='2023.1',
            defaults={
                'algorithm': 'random_forest',
                'description': 'Trained model for predicting rural youth migration risk across Gisagara district.',
                'training_dataset': dataset,
                'status': 'active',
                'is_active': True,
                'accuracy': 0.91,
                'precision': 0.89,
                'recall': 0.90,
                'f1_score': 0.89,
                'evaluation_date': timezone.now(),
            }
        )

        if not model_version.is_active:
            model_version.is_active = True
            model_version.status = 'active'
            model_version.save()

        count = 0
        for item in SAMPLE_PREDICTIONS:
            district_name = item['district']
            try:
                location = Location.objects.get(name=district_name, location_type='district')
            except Location.DoesNotExist:
                # Try finding location by name
                location = Location.objects.filter(name__iexact=district_name).first()

            if not location:
                self.stdout.write(self.style.WARNING(f'Skipping {district_name}: Location record not found.'))
                continue

            ModelPrediction.objects.update_or_create(
                location=location,
                model_version=model_version,
                year=year,
                defaults={
                    'dataset': dataset,
                    'risk_score': item['risk_score'],
                    'risk_category': item['risk_category'],
                    'probability_very_high': item['prob_very_high'],
                    'probability_high': item['prob_high'],
                    'probability_moderate': item['prob_moderate'],
                    'probability_low': item['prob_low'],
                    'contributing_factors': item['factors'],
                }
            )
            count += 1
            self.stdout.write(f'  Prediction created/updated for: {location.name} ({item["risk_category"]})')

        self.stdout.write(self.style.SUCCESS(f'\nDone! Seeded predictions for Gisagara district. Active Model: {model_version.name} v{model_version.version}'))
