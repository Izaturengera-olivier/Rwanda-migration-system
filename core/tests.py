from django.test import TestCase
from core.models import Location, Dataset, PopulationData, MigrationData, EmploymentData, EducationData, HealthcareData, InfrastructureData, ModelVersion, ModelPrediction
from core.data_processing import DataValidator, DataProcessor, process_dataset
from ml_service.models import MigrationRiskModel, train_model_for_dataset, generate_predictions


class CoreModelsTest(TestCase):
    def setUp(self):
        self.district = Location.objects.create(
            name="Nyaruguru",
            location_type="district",
            province="Southern",
            district="Nyaruguru",
            code="RW-NY-TEST",
            is_study_area=True
        )
        self.dataset = Dataset.objects.create(
            name="Test Population Dataset",
            dataset_type="population",
            year=2023,
            version="1.0",
            status="processed",
            is_active=True
        )

    def test_location_creation(self):
        self.assertEqual(str(self.district), "Nyaruguru (district)")
        self.assertTrue(self.district.is_study_area)

    def test_dataset_creation(self):
        self.assertEqual(str(self.dataset), "Test Population Dataset (2023 v1.0)")

    def test_population_data(self):
        pop_record = PopulationData.objects.create(
            location=self.district,
            dataset=self.dataset,
            year=2023,
            total_population=328000,
            youth_population_15_24=72160,
            youth_percentage=22.0
        )
        self.assertEqual(pop_record.total_population, 328000)
        self.assertEqual(str(pop_record), "Nyaruguru - 2023")


class MLServiceTest(TestCase):
    def setUp(self):
        self.location = Location.objects.create(
            name="Ngororero",
            location_type="district",
            province="Western",
            district="Ngororero",
            code="RW-NG-TEST",
            is_study_area=True
        )
        self.dataset = Dataset.objects.create(
            name="ML Test Dataset",
            dataset_type="employment",
            year=2023,
            version="1.0",
            status="processed",
            is_active=True
        )

        PopulationData.objects.create(
            location=self.location, dataset=self.dataset, year=2023,
            total_population=358000, youth_population_15_24=78760, youth_percentage=22.0,
            population_density=285.0
        )
        MigrationData.objects.create(
            location=self.location, dataset=self.dataset, year=2023,
            migration_rate=9.1, out_migration_count=3258, youth_out_migration=2280,
            migration_intent_percentage=38.5, primary_destination="Kigali"
        )
        EmploymentData.objects.create(
            location=self.location, dataset=self.dataset, year=2023,
            unemployment_rate=20.1, youth_unemployment_rate=35.8, poverty_rate=61.4,
            job_opportunities_index=24.0
        )
        InfrastructureData.objects.create(
            location=self.location, dataset=self.dataset, year=2023,
            electricity_coverage=18.0, internet_coverage=6.5, water_access_rate=62.0,
            road_density=0.22, infrastructure_gap_index=78.0
        )

    def test_feature_preparation_and_risk_label(self):
        model = MigrationRiskModel()
        features = model.prepare_features(self.location.id, 2023)
        self.assertIsNotNone(features)
        self.assertEqual(features['youth_unemployment_rate'], 35.8)
        self.assertEqual(features['poverty_rate'], 61.4)

        score, label = model.compute_risk_label(features)
        self.assertGreater(score, 0.0)
        self.assertLessEqual(score, 1.0)
        self.assertIn(label, [0, 1, 2, 3])

    def test_model_training_workflow(self):
        model_version = train_model_for_dataset(self.dataset.id, algorithm='random_forest')
        self.assertIsNotNone(model_version)
        self.assertEqual(model_version.status, 'evaluated')
        self.assertGreaterEqual(model_version.accuracy, 0.0)

        preds = generate_predictions(model_version.id, 2023)
        self.assertEqual(len(preds), 1)
        self.assertEqual(preds[0].location, self.location)
