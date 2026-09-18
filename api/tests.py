from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Location, Dataset, ModelVersion, ModelPrediction, User


class APIEndpointsTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.district = Location.objects.create(
            name="Gisagara",
            location_type="district",
            province="Southern",
            district="Gisagara",
            code="RW-GS-TEST",
            is_study_area=True
        )

        self.dataset = Dataset.objects.create(
            name="Gisagara Sample Data",
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
        self.officer_user = User.objects.create_user(
            username="officer_test",
            email="officer@test.local",
            password="officerpassword",
            role="officer"
        )
        self.regular_user = User.objects.create_user(
            username="user_test",
            email="user@test.local",
            password="userpassword",
            role="user"
        )

    def test_locations_list(self):
        response = self.client.get('/api/locations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_study_districts(self):
        response = self.client.get('/api/locations/study-districts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(any(d['name'] == 'Gisagara' for d in data))

    def test_geojson_endpoint(self):
        response = self.client.get('/api/locations/geojson/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['type'], 'FeatureCollection')

    def test_location_profile(self):
        response = self.client.get(f'/api/locations/{self.district.id}/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['location']['name'], 'Gisagara')
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
        self.assertEqual(data[0]['location_name'], 'Gisagara')

    def test_user_authentication(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'admin_test',
            'password': 'adminpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('token', data)
        self.assertTrue(data['is_admin'])

    def test_officer_can_upload_dataset(self):
        from io import BytesIO
        self.client.force_authenticate(user=self.officer_user)
        dummy_file = BytesIO(b"Sector,Year,Population\nNyanza,2023,50000")
        dummy_file.name = "officer_upload.csv"
        response = self.client.post('/api/datasets/', {
            'name': 'Officer Dataset',
            'dataset_type': 'population',
            'year': 2023,
            'version': '1.0',
            'file': dummy_file
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_regular_user_cannot_upload_dataset(self):
        from io import BytesIO
        self.client.force_authenticate(user=self.regular_user)
        dummy_file = BytesIO(b"Sector,Year,Population\nNyanza,2023,50000")
        dummy_file.name = "user_upload.csv"
        response = self.client.post('/api/datasets/', {
            'name': 'User Dataset',
            'dataset_type': 'population',
            'year': 2023,
            'version': '1.0',
            'file': dummy_file
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_officer_cannot_train_model(self):
        self.client.force_authenticate(user=self.officer_user)
        response = self.client.post('/api/models/train/', {
            'dataset_id': self.dataset.id,
            'algorithm': 'random_forest'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
