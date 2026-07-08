"""
Role gating — the server-side mirror of lib/auth/permissions.ts.

Two axes of access exist (§3.3): role (listener/artist/support/admin) and
subscription tier. These classes cover the role axis and object ownership; tier
gates live next to the actions they guard (playlist create, stream, upload,
download) because they need request-specific counts.
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role == "admin")


class IsStaff(BasePermission):
    """Support or admin (§2.11.2 / §11.2 dashboard)."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in ("support", "admin"))


class IsArtist(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role == "artist")


class IsOwnerOrStaff(BasePermission):
    """
    Object-level: the owner of a resource, or any staff member. Views set
    ``owner_field`` (default "owner") to the FK/attribute holding the User.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role in ("support", "admin"):
            return True
        owner_field = getattr(view, "owner_field", "owner")
        owner = getattr(obj, owner_field, None)
        return owner == request.user or owner_id_matches(obj, owner_field, request.user)


class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner_field = getattr(view, "owner_field", "owner")
        owner = getattr(obj, owner_field, None)
        return owner == request.user


def owner_id_matches(obj, owner_field, user) -> bool:
    return getattr(obj, f"{owner_field}_id", None) == user.id
