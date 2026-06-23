from rest_framework import permissions


class IsTrainer(permissions.BasePermission):
    message = "Only trainers can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_trainer)


class IsTrainerOrReadOnly(permissions.BasePermission):
    """Trainers can write; authenticated users can read."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_trainer
