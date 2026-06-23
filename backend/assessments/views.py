from rest_framework import permissions, viewsets

from .models import Assessment
from .serializers import AssessmentSerializer


class AssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_trainer:
            qs = Assessment.objects.filter(
                patient__patient_profile__assigned_trainer=user
            )
            patient_id = self.request.query_params.get("patient")
            if patient_id:
                qs = qs.filter(patient_id=patient_id)
            return qs
        return Assessment.objects.filter(patient=user)

    def perform_create(self, serializer):
        # Only patients submit assessments (about themselves).
        if not self.request.user.is_patient:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Only patients can submit assessments.")
        serializer.save(patient=self.request.user)
