from django.core.management.base import BaseCommand
from core.models import Location, ModelVersion, ModelPrediction, Dataset
from django.utils import timezone

SAMPLE_PREDICTIONS = [
    {
        'district': 'Ngororero',
        'risk_category': 'very_high',
        'risk_score': 0.88,
        'prob_very_high': 0.88, 'prob_high': 0.08, 'prob_moderate': 0.03, 'prob_low': 0.01,
        'factors': [
            {'name': 'High Youth Unemployment', 'impact': 'high', 'value': '35.8%'},
            {'name': 'Infrastructure Gap Index', 'impact': 'high', 'value': '78.0/100'},
            {'name': 'Low Electricity Coverage', 'impact': 'medium', 'value': '18.0%'},
        ]
    },
    {
        'district': 'Kirehe',
        'risk_category': 'very_high',
        'risk_score': 0.85,
        'prob_very_high': 0.85, 'prob_high': 0.10, 'prob_moderate': 0.04, 'prob_low': 0.01,
        'factors': [
            {'name': 'High Poverty Rate', 'impact': 'high', 'value': '64.2%'},
            {'name': 'Low Internet Coverage', 'impact': 'high', 'value': '5.0%'},
            {'name': 'Out-Migration Rate', 'impact': 'medium', 'value': '10.2%'},
        ]
    },
    {
        'district': 'Nyaruguru',
        'risk_category': 'high',
        'risk_score': 0.74,
        'prob_very_high': 0.15, 'prob_high': 0.74, 'prob_moderate': 0.08, 'prob_low': 0.03,
        'factors': [
            {'name': 'High Poverty Rate', 'impact': 'high', 'value': '58.3%'},
            {'name': 'Distance to Hospital', 'impact': 'medium', 'value': '18.5 km'},
        ]
    },
    {
        'district': 'Rutsiro',
        'risk_category': 'high',
        'risk_score': 0.68,
        'prob_very_high': 0.10, 'prob_high': 0.68, 'prob_moderate': 0.16, 'prob_low': 0.06,
        'factors': [
            {'name': 'Youth Unemployment', 'impact': 'high', 'value': '30.2%'},
            {'name': 'Infrastructure Deficit', 'impact': 'medium', 'value': '68.0/100'},
        ]
    },
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
    {
        'district': 'Gicumbi',
        'risk_category': 'low',
        'risk_score': 0.28,
        'prob_very_high': 0.02, 'prob_high': 0.08, 'prob_moderate': 0.20, 'prob_low': 0.70,
        'factors': [
            {'name': 'Higher Literacy Rate', 'impact': 'positive', 'value': '78.2%'},
            {'name': 'Improved Electricity Access', 'impact': 'positive', 'value': '35.0%'},
        ]
    },
]


class Command(BaseCommand):
    help = 'Seed predictions and activate model for study districts'

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
                'description': 'Trained model for predicting rural youth migration risk across study districts.',
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

        self.stdout.write(self.style.SUCCESS(f'\nDone! Seeded predictions for {count} districts. Active Model: {model_version.name} v{model_version.version}'))
