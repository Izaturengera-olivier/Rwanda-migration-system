import os
import json
import logging
import random
from django.db.models import Q, Count
from django.utils import timezone
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.core.mail import send_mail
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

from .permissions import IsAdminRole, IsOfficerRole, IsAdminOrReadOnly, IsOfficerOrAdminOrReadOnly, IsAdminOrResearcher

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
        districts = Location.objects.filter(is_study_area=True, location_type='sector')
        if not districts.exists():
            districts = Location.objects.filter(is_study_area=True, location_type='district')
        return Response(self.get_serializer(districts, many=True).data)

    @action(detail=False, methods=['get'])
    def geojson(self, request):
        locations = self.get_queryset()
        year = request.query_params.get('year')
        active_model = ModelVersion.objects.filter(is_active=True).first()
        features = []
        for loc in locations:
            if loc.geometry_json:
                try:
                    geometry = json.loads(loc.geometry_json)
                    pred_qs = ModelPrediction.objects.filter(location=loc)
                    if year:
                        pred_qs = pred_qs.filter(year=year)
                    if active_model and pred_qs.filter(model_version=active_model).exists():
                        pred = pred_qs.filter(model_version=active_model).order_by('-year', '-prediction_date', '-id').first()
                    else:
                        pred = pred_qs.order_by('-year', '-prediction_date', '-id').first()

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
        active_model = ModelVersion.objects.filter(is_active=True).first()

        pred_qs = ModelPrediction.objects.filter(location=location)
        if active_model and pred_qs.filter(model_version=active_model).exists():
            active_preds = pred_qs.filter(model_version=active_model)
            if not year:
                prediction = active_preds.order_by('-year', '-prediction_date', '-id').first()
            else:
                prediction = active_preds.filter(year=int(year)).order_by('-prediction_date', '-id').first()
                if not prediction:
                    prediction = active_preds.order_by('-year', '-prediction_date', '-id').first()
        else:
            if not year:
                prediction = pred_qs.order_by('-year', '-prediction_date', '-id').first()
            else:
                prediction = pred_qs.filter(year=int(year)).order_by('-prediction_date', '-id').first()
                if not prediction:
                    prediction = pred_qs.order_by('-year', '-prediction_date', '-id').first()

        target_year = prediction.year if prediction else (int(year) if year and str(year).isdigit() else 2023)

        def get_or_none(model, **kwargs):
            return model.objects.filter(**kwargs).order_by('-id').first()

        population = get_or_none(PopulationData, location=location, year=target_year)
        migration = get_or_none(MigrationData, location=location, year=target_year)
        employment = get_or_none(EmploymentData, location=location, year=target_year)
        education = get_or_none(EducationData, location=location, year=target_year)
        healthcare = get_or_none(HealthcareData, location=location, year=target_year)
        infrastructure = get_or_none(InfrastructureData, location=location, year=target_year)

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
    permission_classes = [IsOfficerOrAdminOrReadOnly]

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

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        from django.http import FileResponse
        dataset = self.get_object()
        if not dataset.file_path or not os.path.exists(dataset.file_path):
            return Response({'error': 'Dataset file does not exist on server.'}, status=status.HTTP_404_NOT_FOUND)
        filename = os.path.basename(dataset.file_path)
        return FileResponse(open(dataset.file_path, 'rb'), as_attachment=True, filename=filename)

    def destroy(self, request, *args, **kwargs):
        dataset = self.get_object()
        dataset_id = dataset.id
        dataset_name = dataset.name
        file_path = dataset.file_path

        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.warning(f"Failed to delete dataset file at {file_path}: {e}")

        self.perform_destroy(dataset)

        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action='data_deletion',
            entity_type='Dataset',
            entity_id=dataset_id,
            description=f"Deleted dataset: {dataset_name}"
        )

        return Response({'detail': f'Dataset "{dataset_name}" deleted successfully.'}, status=status.HTTP_200_OK)


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
        loc_type = request.query_params.get('type')
        base_qs = ModelPrediction.objects.select_related('location', 'model_version').filter(
            location__is_study_area=True
        )
        if loc_type:
            base_qs = base_qs.filter(location__location_type=loc_type)
        elif base_qs.filter(location__location_type='sector').exists():
            base_qs = base_qs.filter(location__location_type='sector')

        if year:
            base_qs = base_qs.filter(year=year)

        # 1. Try active model predictions
        active_model = ModelVersion.objects.filter(is_active=True).first()
        if active_model:
            active_qs = base_qs.filter(model_version=active_model)
            if active_qs.exists():
                seen = {}
                for p in active_qs.order_by('-prediction_date', '-id'):
                    if p.location_id not in seen:
                        seen[p.location_id] = p
                return Response(self.get_serializer(list(seen.values()), many=True).data)

        # 2. Try latest model with predictions
        models_with_preds = ModelVersion.objects.filter(
            predictions__location__is_study_area=True
        ).distinct().order_by('-training_date', '-id')

        target_model = models_with_preds.first()
        if target_model:
            target_qs = base_qs.filter(model_version=target_model)
            if target_qs.exists():
                seen = {}
                for p in target_qs.order_by('-prediction_date', '-id'):
                    if p.location_id not in seen:
                        seen[p.location_id] = p
                return Response(self.get_serializer(list(seen.values()), many=True).data)

        # 3. Fallback to any available predictions
        seen = {}
        for p in base_qs.order_by('-prediction_date', '-id'):
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
    permission_classes = [IsAdminOrReadOnly]

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

    @action(detail=False, methods=['post'], permission_classes=[IsAdminRole])
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

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole])
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
            district_qs = Location.objects.filter(is_study_area=True, location_type='sector')
            if not district_qs.exists():
                district_qs = Location.objects.filter(is_study_area=True, location_type='district')

            if active_model:
                predictions = ModelPrediction.objects.filter(
                    location__in=district_qs,
                    model_version=active_model
                )
            else:
                latest_ids = []
                for loc in district_qs:
                    lp = ModelPrediction.objects.filter(location=loc).order_by('-year', '-prediction_date', '-id').first()
                    if lp:
                        latest_ids.append(lp.id)
                predictions = ModelPrediction.objects.filter(id__in=latest_ids)

            if year:
                predictions = predictions.filter(year=year)

            last_dataset = Dataset.objects.order_by('-upload_date').first()

            stats = {
                'total_locations': district_qs.count(),
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
        year_param = request.query_params.get('year')
        year = int(year_param) if year_param and year_param.isdigit() else None

        if not location_ids:
            return Response({'error': 'Provide location IDs'}, status=status.HTTP_400_BAD_REQUEST)

        locations = Location.objects.filter(id__in=location_ids)
        active_model = ModelVersion.objects.filter(is_active=True).first()
        comparison_data = []
        for loc in locations:
            pred_qs = ModelPrediction.objects.filter(location=loc)
            if active_model and pred_qs.filter(model_version=active_model).exists():
                pred_qs = pred_qs.filter(model_version=active_model)
            if year:
                pred_qs = pred_qs.filter(year=year)
            pred = pred_qs.order_by('-year', '-prediction_date', '-id').first()

            row = {
                'location_name': loc.name,
                'risk_score': pred.risk_score if pred else 0.5,
                'risk_category': pred.risk_category if pred else 'moderate',
                'infrastructure_gap_index': 0.0,
                'unemployment_rate': 0.0,
                'youth_unemployment_rate': 0.0,
                'education_access_index': 0.0,
                'healthcare_access_index': 0.0,
            }
            target_year = year if year else (pred.year if pred else 2023)

            infra = InfrastructureData.objects.filter(location=loc, year=target_year).order_by('-id').first()
            if infra and infra.infrastructure_gap_index is not None:
                row['infrastructure_gap_index'] = float(infra.infrastructure_gap_index)

            emp = EmploymentData.objects.filter(location=loc, year=target_year).order_by('-id').first()
            if emp:
                if emp.unemployment_rate is not None:
                    row['unemployment_rate'] = float(emp.unemployment_rate)
                if emp.youth_unemployment_rate is not None:
                    row['youth_unemployment_rate'] = float(emp.youth_unemployment_rate)

            edu = EducationData.objects.filter(location=loc, year=target_year).order_by('-id').first()
            if edu and edu.education_access_index is not None:
                row['education_access_index'] = float(edu.education_access_index)

            health = HealthcareData.objects.filter(location=loc, year=target_year).order_by('-id').first()
            if health and health.healthcare_access_index is not None:
                row['healthcare_access_index'] = float(health.healthcare_access_index)

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
        if isinstance(password, list):
            password = password[0] if password else None
        if isinstance(password, str):
            password = password.strip()

        if not password:
            return Response({'password': ['Password is required.']}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.set_password(password)
        if user.role == 'admin':
            user.is_staff = True
        user.save()

        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action='user_created',
            entity_type='User',
            entity_id=user.id,
            description=f"Created user: {user.username} (role: {user.role})"
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        password = data.pop('password', None)
        if isinstance(password, list):
            password = password[0] if password else None
        if isinstance(password, str) and not password.strip():
            password = None

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        if password:
            user.set_password(password)
        if user.role == 'admin':
            user.is_staff = True
        user.save()
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action='user_updated',
            entity_type='User',
            entity_id=user.id,
            description=f"Updated profile for user: {user.username}"
        )
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        username = instance.username
        user_id = instance.id
        self.perform_destroy(instance)
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action='user_deleted',
            entity_type='User',
            entity_id=user_id,
            description=f"Deleted user: {username}"
        )
        return Response({'detail': f'User {username} deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        status_text = 'activated' if user.is_active else 'deactivated'
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action='user_status_change',
            entity_type='User',
            entity_id=user.id,
            description=f"{status_text.capitalize()} user: {user.username}"
        )
        return Response({
            'detail': f'User {user.username} {status_text} successfully.',
            'user': UserSerializer(user).data
        })

    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get('role')
        valid_roles = ['admin', 'officer', 'user', 'researcher', 'viewer']
        if not new_role or new_role not in valid_roles:
            return Response({'error': f'Invalid role specified. Valid roles: admin, officer, user.'}, status=status.HTTP_400_BAD_REQUEST)
        old_role = user.role
        user.role = new_role
        user.is_staff = (new_role == 'admin')
        user.save()
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action='user_role_change',
            entity_type='User',
            entity_id=user.id,
            description=f"Changed user {user.username} role from {old_role} to {new_role}"
        )
        return Response({
            'detail': f'User {user.username} role changed to {new_role}.',
            'user': UserSerializer(user).data
        })


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminRole]


class UserRegistrationView(views.APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        username = (request.data.get('username') or '').strip()
        email = (request.data.get('email') or '').strip()
        password = request.data.get('password') or ''

        if not username or not email or not password:
            return Response({'detail': 'Username, email, and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username__iexact=username).exists():
            return Response({'detail': 'Username is already in use.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email__iexact=email).exists():
            return Response({'detail': 'Email is already registered.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password, role='user')
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
        }, status=status.HTTP_201_CREATED)


class ForgotPasswordView(views.APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        from django.conf import settings
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'detail': 'No account found for this email address.'}, status=status.HTTP_404_NOT_FOUND)

        code = str(random.randint(100000, 999999))
        cache.set(f'password_reset:{email}', code, timeout=600)
        logger.info(f"Password reset verification code for {email}: {code}")

        try:
            send_mail(
                subject='Your password reset code',
                message=f'Your verification code is: {code}. This code expires in 10 minutes.',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@divine.local'),
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.warning(f"Mail send failed (check SMTP settings): {e}")

        response_data = {
            'detail': 'A verification code has been generated.',
        }

        if getattr(settings, 'DEBUG', False):
            response_data['code'] = code
            response_data['detail'] = f'Verification code sent! (Dev code: {code})'

        return Response(response_data)


class ResetPasswordView(views.APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        code = (request.data.get('code') or '').strip()
        password = request.data.get('password') or ''

        if not email or not code or not password:
            return Response({'detail': 'Email, verification code, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        cached_code = cache.get(f'password_reset:{email}')
        if not cached_code or str(cached_code) != str(code):
            return Response({'detail': 'Invalid or expired verification code.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'detail': 'No account found for this email address.'}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(password)
        user.save()
        cache.delete(f'password_reset:{email}')
        return Response({'detail': 'Password reset successful.'})


class LoginView(views.APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        """Return current authenticated user info."""
        if request.user.is_authenticated:
            role = getattr(request.user, 'role', 'user')
            is_admin = request.user.is_superuser or role == 'admin'
            is_officer = is_admin or role in ('officer', 'researcher')
            return Response({
                'id': request.user.id,
                'username': request.user.username,
                'role': role,
                'is_admin': is_admin,
                'is_officer': is_officer,
            })
        return Response({'detail': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

    def post(self, request):
        """Authenticate and return a token."""
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({'detail': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)
        role = getattr(user, 'role', 'user')
        is_admin = user.is_superuser or role == 'admin'
        is_officer = is_admin or role in ('officer', 'researcher')
        token, _ = Token.objects.get_or_create(user=user)
        AuditLog.objects.create(
            user=user, action='user_login',
            description=f'User login: {user.username} ({role})',
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response({
            'token': token.key,
            'id': user.id,
            'username': user.username,
            'email': getattr(user, 'email', ''),
            'role': role,
            'is_admin': is_admin,
            'is_officer': is_officer,
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
