from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminRole(BasePermission):
    """Grants full access to users with role='admin' or Django superusers."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'


class IsOfficerRole(BasePermission):
    """Grants access to officers and admins."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = getattr(request.user, 'role', None)
        return request.user.is_superuser or role in ('admin', 'officer', 'researcher')


class IsAdminOrReadOnly(BasePermission):
    """
    Read-only access for everyone (including unauthenticated).
    Write access only for admin-role users or superusers.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'


class IsOfficerOrAdminOrReadOnly(BasePermission):
    """
    Read access for all. Write access for admin, officer, and researcher roles.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_superuser or getattr(request.user, 'role', None) in ('admin', 'officer', 'researcher')


class IsAdminOrResearcher(IsOfficerOrAdminOrReadOnly):
    """Alias for backwards compatibility."""
    pass

