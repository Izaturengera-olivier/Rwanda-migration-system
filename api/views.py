import os
import json
import logging
from django.db.models import Q, Count
from django.utils import timezone
from django.contrib.auth import authenticate
from rest_framework import viewsets, status, permissions, views
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from core.models import (
    Location, Dataset, PopulationData, MigrationData,
    EmploymentData, EducationData, HealthcareData, InfrastructureData,
    ModelVersion, ModelPrediction, AuditLog, User
)
from .serializers import (
    LocationSerializer, DatasetSerializer,
    PopulationDataSerializer, MigrationDataSerializer, EmploymentDataSerializer,
    EducationDataSerializer, HealthcareDataSerializer, InfrastructureDataSerializer,
    ModelVersionSerializer, ModelPredictionSerializer, AuditLogSerializer,
    UserSerializer, ComparisonSerializer, DashboardStatsSerializer
)

from .permissions import IsAdminRole, IsAdminOrReadOnly, IsAdminOrResearcher

logger = logging.getLogger(__name__)


class LocationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = []  # Public read

    def get_queryset(self):
        qs = Location.objects.all()
        for param, field in [('type', 'location_type'), ('province', 'province'),
                              ('district', 'district')]:
            val = self.request.query_params.get(param)
            if val:
                qs = qs.filter(**{field: val})
        study = self.request.query_params.get('study_area')
        if study:
            qs = qs.filter(is_study_area=study.lower() == 'true')
        return qs

    @action(detail=False, methods=['get'])
    def study_districts(self, request):
        districts = Location.objects.filter(location_type='district', is_study_area=True)
        return Response(self.get_serializer(districts, many=True).data)

    @action(detail=False, methods=['get'])
    def geojson(self, request):
        locations = self.get_queryset()
        features = []
        for loc in locations:
            if loc.geometry_json:
                try:
                    geometry = json.loads(loc.geometry_json)
                    # Attach latest prediction data if available
                    pred = ModelPrediction.objects.filter(location=loc).order_by('-year', '-prediction_date').first()
                    features.append({
                        "type": "Feature",
                        "geometry": geometry,
                        "properties": {
                            "id": loc.id,
                            "name": loc.name,
                            "location_type": loc.location_type,
                            "province": loc.province,
                            "district": loc.district,
                            "sector": loc.sector,
                            "is_study_area": loc.is_study_area,
                            "risk_category": pred.risk_category if pred else None,
                            "risk_score": pred.risk_score if pred else None,
                        }
                    })
                except (json.JSONDecodeError, TypeError):
                    continue
        return Response({"type": "FeatureCollection", "features": features})

    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        location = self.get_object()
        year = request.query_params.get('year')
        if not year:
            pred = ModelPrediction.objects.filter(location=location).order_by('-year').first()
            year = pred.year if pred else 2023
        else:
            year = int(year)

        def get_or_none(model, **kwargs):
            try:
                return model.objects.get(**kwargs)
            except model.DoesNotExist:
                return None

        population = get_or_none(PopulationData, location=location, year=year)
        migration = get_or_none(MigrationData, location=location, year=year)
        employment = get_or_none(EmploymentData, location=location, year=year)
        education = get_or_none(EducationData, location=location, year=year)
        healthcare = get_or_none(HealthcareData, location=location, year=year)
        infrastructure = get_or_none(InfrastructureData, location=location, year=year)
        prediction = ModelPrediction.objects.filter(location=location, year=year).order_by('-prediction_date').first()

        return Response({
            'location': LocationSerializer(location).data,
            'population': PopulationDataSerializer(population).data if population else None,
            'migration': MigrationDataSerializer(migration).data if migration else None,
            'employment': EmploymentDataSerializer(employment).data if employment else None,
            'education': EducationDataSerializer(education).data if education else None,
            'healthcare': HealthcareDataSerializer(healthcare).data if healthcare else None,
            'infrastructure': InfrastructureDataSerializer(infrastructure).data if infrastructure else None,
            'prediction': ModelPredictionSerializer(prediction).data if prediction else None,
        })


class DatasetViewSet(viewsets.ModelViewSet):
    queryset = Dataset.objects.all().order_by('-upload_date')
    serializer_class = DatasetSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = Dataset.objects.all()
        for param, field in [('type', 'dataset_type'), ('year', 'year'), ('status', 'status')]:
            val = self.request.query_params.get(param)
            if val:
                qs = qs.filter(**{field: val})
        return qs.order_by('-upload_date')

    def create(self, request, *args, **kwargs):
        from django.conf import settings
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Save file
        media_dir = os.path.join(settings.MEDIA_ROOT, 'datasets')
        os.makedirs(media_dir, exist_ok=True)
        filename = f"{timezone.now().strftime('%Y%m%d_%H%M%S')}_{file_obj.name}"
        file_path = os.path.join(media_dir, filename)
        with open(file_path, 'wb+') as dest:
            for chunk in file_obj.chunks():
                dest.write(chunk)

        dataset = Dataset.objects.create(
            name=request.data.get('name', file_obj.name),
            dataset_type=request.data.get('dataset_type', 'other'),
            year=int(request.data.get('year', 2023)),
            version=request.data.get('version', '1.0'),
            source=request.data.get('source', ''),
            file_path=file_path,
            file_size=file_obj.size,
            status='uploaded',
            uploaded_by=request.user if request.user.is_authenticated else None,
        )

        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action='data_upload',
            entity_type='Dataset',
            entity_id=dataset.id,
            description=f"Uploaded dataset: {dataset.name} ({dataset.year})"
        )

        return Response(DatasetSerializer(dataset).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        from core.data_processing import process_dataset
        dataset = self.get_object()
        try:
            result = process_dataset(dataset.id)
            AuditLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action='data_processing',
                entity_type='Dataset',
                entity_id=dataset.id,
                description=f"Processed dataset: {dataset.name}"
            )
            return Response(result)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PredictionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ModelPrediction.objects.select_related('location', 'model_version')
    serializer_class = ModelPredictionSerializer
    permission_classes = []  # Public read

    def get_queryset(self):
        qs = ModelPrediction.objects.select_related('location', 'model_version')
        for param, field in [('location', 'location_id'), ('year', 'year'), ('risk_category', 'risk_category')]:
            val = self.request.query_params.get(param)
            if val:
                qs = qs.filter(**{field: val})
        return qs.order_by('-year', '-risk_score')

    @action(detail=False, methods=['get'])
    def by_district(self, request):
        year = request.query_params.get('year')
        qs = self.get_queryset().filter(location__location_type='district', location__is_study_area=True)
        if year:
            qs = qs.filter(year=year)
        # Return latest prediction per location
        seen = {}
        for p in qs:
            if p.location_id not in seen:
                seen[p.location_id] = p
        return Response(self.get_serializer(list(seen.values()), many=True).data)

    @action(detail=False, methods=['get'])
    def risk_distribution(self, request):
        year = request.query_params.get('year')
        qs = self.get_queryset()
        if year:
            qs = qs.filter(year=year)
        distribution = qs.values('risk_category').annotate(count=Count('id')).order_by('risk_category')
        return Response(list(distribution))


class ModelVersionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ModelVersion.objects.all().order_by('-training_date')
    serializer_class = ModelVersionSerializer
    permission_classes = []  # Public read

    def get_queryset(self):
        qs = ModelVersion.objects.all()
        active = self.request.query_params.get('active')
        if active:
            qs = qs.filter(is_active=active.lower() == 'true')
        return qs.order_by('-training_date')

    @action(detail=False, methods=['get'])
    def active(self, request):
        model = ModelVersion.objects.filter(is_active=True).first()
        if model:
            return Response(self.get_serializer(model).data)
        return Response({'error': 'No active model found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def train(self, request):
        from ml_service.models import train_model_for_dataset
        dataset_id = request.data.get('dataset_id')
        algorithm = request.data.get('algorithm', 'random_forest')
        if not dataset_id:
            return Response({'error': 'dataset_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            model_version = train_model_for_dataset(
                dataset_id=dataset_id,
                algorithm=algorithm,
                user=request.user if request.user.is_authenticated else None
            )
            AuditLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action='model_training',
                entity_type='ModelVersion',
                entity_id=model_version.id,
                description=f"Trained model: {model_version.name} using {algorithm}"
            )
            return Response(ModelVersionSerializer(model_version).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Model training error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        model = self.get_object()
        # Deactivate all others
        ModelVersion.objects.filter(is_active=True).update(is_active=False)
        model.is_active = True
        model.status = 'active'
        model.save()
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action='model_activation',
            entity_type='ModelVersion',
            entity_id=model.id,
            description=f"Activated model: {model.name} v{model.version}"
        )
        return Response(self.get_serializer(model).data)


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = []  # Public read — dashboard is visible to all

    def list(self, request):
        try:
            year = request.query_params.get('year')
            active_model = ModelVersion.objects.filter(is_active=True).first()
            predictions = ModelPrediction.objects.filter(location__is_study_area=True)
            if year:
                predictions = predictions.filter(year=year)

            last_dataset = Dataset.objects.order_by('-upload_date').first()

            stats = {
                'total_locations': Location.objects.filter(is_study_area=True).count(),
                'high_risk_count': predictions.filter(risk_category='high').count(),
                'moderate_risk_count': predictions.filter(risk_category='moderate').count(),
                'low_risk_count': predictions.filter(risk_category='low').count(),
                'very_high_risk_count': predictions.filter(risk_category='very_high').count(),
                'infrastructure_priority_count': predictions.filter(risk_category__in=['high', 'very_high']).count(),
                'last_data_update': last_dataset.upload_date if last_dataset else None,
                'active_model_version': active_model.version if active_model else None,
            }
            return Response(DashboardStatsSerializer(stats).data)
        except Exception as e:
            logger.error(f'Dashboard error: {e}')
            return Response({
                'total_locations': 0, 'high_risk_count': 0, 'moderate_risk_count': 0,
                'low_risk_count': 0, 'very_high_risk_count': 0, 'infrastructure_priority_count': 0,
                'last_data_update': None, 'active_model_version': None,
            })

    @action(detail=False, methods=['get'], permission_classes=[])
    def compare(self, request):
        location_ids = request.query_params.get('locations', '').split(',')
        location_ids = [lid for lid in location_ids if lid]
        year = request.query_params.get('year')
        if not location_ids:
            return Response({'error': 'Provide location IDs'}, status=status.HTTP_400_BAD_REQUEST)

        predictions = ModelPrediction.objects.filter(location_id__in=location_ids).select_related('location')
        if year:
            predictions = predictions.filter(year=year)

        comparison_data = []
        for pred in predictions:
            row = {
                'location_name': pred.location.name,
                'risk_score': pred.risk_score,
                'risk_category': pred.risk_category,
                'infrastructure_gap_index': 0,
                'unemployment_rate': 0,
                'youth_unemployment_rate': 0,
                'education_access_index': 0,
                'healthcare_access_index': 0,
            }
            try:
                infra = InfrastructureData.objects.get(location=pred.location, year=pred.year)
                row['infrastructure_gap_index'] = infra.infrastructure_gap_index or 0
            except InfrastructureData.DoesNotExist:
                pass
            try:
                emp = EmploymentData.objects.get(location=pred.location, year=pred.year)
                row['unemployment_rate'] = emp.unemployment_rate or 0
                row['youth_unemployment_rate'] = emp.youth_unemployment_rate or 0
            except EmploymentData.DoesNotExist:
                pass
            try:
                edu = EducationData.objects.get(location=pred.location, year=pred.year)
                row['education_access_index'] = edu.education_access_index or 0
            except EducationData.DoesNotExist:
                pass
            try:
                health = HealthcareData.objects.get(location=pred.location, year=pred.year)
                row['healthcare_access_index'] = health.healthcare_access_index or 0
            except HealthcareData.DoesNotExist:
                pass
            comparison_data.append(row)

        return Response(ComparisonSerializer(comparison_data, many=True).data)

    @action(detail=False, methods=['get'], permission_classes=[])
    def trends(self, request):
        location_id = request.query_params.get('location')
        if not location_id:
            return Response({'error': 'Provide location ID'}, status=status.HTTP_400_BAD_REQUEST)
        predictions = ModelPrediction.objects.filter(location_id=location_id).order_by('year')
        return Response([{'year': p.year, 'risk_score': p.risk_score, 'risk_category': p.risk_category} for p in predictions])


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        password = data.pop('password', None)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminRole]


class LoginView(views.APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        """Return current authenticated user info."""
        if request.user.is_authenticated:
            return Response({
                'id': request.user.id,
                'username': request.user.username,
                'role': getattr(request.user, 'role', 'viewer'),
                'is_admin': request.user.is_superuser or getattr(request.user, 'role', '') == 'admin',
            })
        return Response({'detail': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

    def post(self, request):
        """Authenticate and return a token."""
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({'detail': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)
        if not (user.is_superuser or getattr(user, 'role', '') == 'admin'):
            return Response({'detail': 'Access denied. Administrator role required.'}, status=status.HTTP_403_FORBIDDEN)
        token, _ = Token.objects.get_or_create(user=user)
        AuditLog.objects.create(
            user=user, action='user_login',
            description=f'Admin login: {user.username}',
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response({
            'token': token.key,
            'id': user.id,
            'username': user.username,
            'role': getattr(user, 'role', 'admin'),
            'is_admin': True,
        })


class LogoutView(views.APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                AuditLog.objects.create(
                    user=token.user, action='user_logout',
                    description=f'Admin logout: {token.user.username}'
                )
                token.delete()
            except Token.DoesNotExist:
                pass
        return Response({'detail': 'Logged out successfully'})
