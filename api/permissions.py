from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.conf import settings


class IsAdminRole(BasePermission):
    """Grants full access to users with role='admin' or Django superusers."""
    def has_permission(self, request, view):
        if settings.DEBUG:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'


class IsAdminOrReadOnly(BasePermission):
    """
    Read-only access for everyone (including unauthenticated).
    Write access only for admin-role users or superusers.
    In DEBUG mode, write access is permitted for local testing/uploads.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS or settings.DEBUG:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'


class IsAdminOrResearcher(BasePermission):
    """Read access for all. Write access for admin and researcher roles."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS or settings.DEBUG:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_superuser or getattr(request.user, 'role', None) in ('admin', 'researcher')
