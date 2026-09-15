from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Location, Dataset, ModelVersion, ModelPrediction, User


class APIEndpointsTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.district = Location.objects.create(
            name="Gicumbi",
            location_type="district",
            province="Northern",
            district="Gicumbi",
            code="RW-GC-TEST",
            is_study_area=True
        )

        self.dataset = Dataset.objects.create(
            name="Gicumbi Sample Data",
            dataset_type="population",
            year=2023,
            version="1.0",
            status="processed",
            is_active=True
        )

        self.model_version = ModelVersion.objects.create(
            name="Random Forest Test",
            version="2023.1",
            algorithm="random_forest",
            training_dataset=self.dataset,
            status="active",
            is_active=True,
            accuracy=0.92
        )

        self.prediction = ModelPrediction.objects.create(
            location=self.district,
            model_version=self.model_version,
            dataset=self.dataset,
            year=2023,
            risk_score=0.28,
            risk_category="low",
            probability_low=0.70,
            probability_moderate=0.20,
            probability_high=0.08,
            probability_very_high=0.02,
            contributing_factors=[{"name": "Higher Literacy", "impact": "positive"}]
        )

        self.admin_user = User.objects.create_superuser(
            username="admin_test",
            email="admin@test.local",
            password="adminpassword",
            role="admin"
        )

    def test_locations_list(self):
        response = self.client.get('/api/locations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_study_districts(self):
        response = self.client.get('/api/locations/study-districts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(any(d['name'] == 'Gicumbi' for d in data))

    def test_geojson_endpoint(self):
        response = self.client.get('/api/locations/geojson/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['type'], 'FeatureCollection')

    def test_location_profile(self):
        response = self.client.get(f'/api/locations/{self.district.id}/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['location']['name'], 'Gicumbi')
        self.assertIsNotNone(data['prediction'])
        self.assertEqual(data['prediction']['risk_category'], 'low')

    def test_dashboard_stats(self):
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('total_locations', data)
        self.assertIn('low_risk_count', data)

    def test_dashboard_compare(self):
        response = self.client.get('/api/dashboard/compare/', {'locations': f'{self.district.id}'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['location_name'], 'Gicumbi')

    def test_user_authentication(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'admin_test',
            'password': 'adminpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('token', data)
        self.assertTrue(data['is_admin'])
