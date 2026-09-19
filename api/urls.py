from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LocationViewSet, DatasetViewSet, PredictionViewSet,
    ModelVersionViewSet, DashboardViewSet, AuditLogViewSet,
    UserViewSet, LoginView, LogoutView, UserRegistrationView,
    ForgotPasswordView, ResetPasswordView, NotificationViewSet
)

router = DefaultRouter()
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'datasets', DatasetViewSet, basename='dataset')
router.register(r'predictions', PredictionViewSet, basename='prediction')
router.register(r'models', ModelVersionViewSet, basename='modelversion')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')
router.register(r'users', UserViewSet, basename='user')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('locations/study-districts/', LocationViewSet.as_view({'get': 'study_districts'}), name='study-districts'),
    path('predictions/by-district/', PredictionViewSet.as_view({'get': 'by_district'}), name='predictions-by-district'),
    path('', include(router.urls)),
    path('auth/signup/', UserRegistrationView.as_view(), name='api-signup'),
    path('auth/login/', LoginView.as_view(), name='api-login'),
    path('auth/logout/', LogoutView.as_view(), name='api-logout'),
    path('auth/me/', LoginView.as_view(), name='api-me'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='api-forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='api-reset-password'),
]
