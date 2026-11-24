from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """
    Allows access only to authenticated users who are administrators.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'admin' or request.user.is_staff or request.user.is_superuser)
        )


class IsFarmer(permissions.BasePermission):
    """
    Allows access only to authenticated farmers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_farmer() or request.user.is_superuser)
        )


class IsProviderOrWorker(permissions.BasePermission):
    """
    Allows access to providers and workers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_provider() or request.user.is_worker() or request.user.is_superuser)
        )


class IsVerifiedProviderOrWorker(permissions.BasePermission):
    """
    Ensures provider or worker is verified and not suspended.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if request.user.is_worker() and hasattr(request.user, 'worker_profile'):
            return request.user.worker_profile.verification_status == 'verified'
        if request.user.is_provider() and hasattr(request.user, 'provider_profile'):
            return request.user.provider_profile.verification_status == 'verified'
        return False


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission: only the object owner or an admin can access.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or (hasattr(request.user, 'role') and request.user.role == 'admin'):
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'farmer'):
            return obj.farmer == request.user
        if hasattr(obj, 'provider'):
            return obj.provider == request.user
        return False
