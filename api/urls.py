from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LocationViewSet, DatasetViewSet, PredictionViewSet,
    ModelVersionViewSet, DashboardViewSet, AuditLogViewSet,
    UserViewSet, LoginView, LogoutView
)

router = DefaultRouter()
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'datasets', DatasetViewSet, basename='dataset')
router.register(r'predictions', PredictionViewSet, basename='prediction')
router.register(r'models', ModelVersionViewSet, basename='modelversion')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', LoginView.as_view(), name='api-login'),
    path('auth/logout/', LogoutView.as_view(), name='api-logout'),
    path('auth/me/', LoginView.as_view(), name='api-me'),
]
