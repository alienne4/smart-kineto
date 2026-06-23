from django.core.exceptions import ValidationError
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import PatientProfile, Role, User
from .serializers import (
    RegisterSerializer,
    RoleTokenObtainPairSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    serializer_class = RoleTokenObtainPairSerializer


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class TrainerListView(generics.ListAPIView):
    """Patients use this to pick a trainer to link to."""

    serializer_class = UserSerializer
    queryset = User.objects.filter(role=Role.TRAINER, is_active=True)


class MyPatientsView(generics.ListAPIView):
    """Trainers list the patients linked to them."""

    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(
            role=Role.PATIENT, patient_profile__assigned_trainer=self.request.user
        )


class PatientSearchView(generics.ListAPIView):
    """Trainers search all patients by name/email to add them."""

    serializer_class = UserSerializer

    def get_queryset(self):
        if not self.request.user.is_trainer:
            return User.objects.none()
        qs = User.objects.filter(role=Role.PATIENT, is_active=True)
        q = self.request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(Q(full_name__icontains=q) | Q(email__icontains=q))
        return qs.order_by("full_name")[:50]


class AddPatientView(APIView):
    """A trainer links a patient to themselves."""

    def post(self, request):
        if not request.user.is_trainer:
            return Response(
                {"detail": "Only trainers can add patients."},
                status=status.HTTP_403_FORBIDDEN,
            )
        patient_id = request.data.get("patient_id")
        try:
            patient = User.objects.get(id=patient_id, role=Role.PATIENT)
        except (User.DoesNotExist, ValidationError, ValueError, TypeError):
            return Response(
                {"detail": "Patient not found."}, status=status.HTTP_400_BAD_REQUEST
            )
        profile, _ = PatientProfile.objects.get_or_create(user=patient)
        profile.assigned_trainer = request.user
        profile.save()

        from notifications.push import notify_user

        notify_user(
            patient,
            type="reminder",
            title="You've been added by a trainer",
            body=f"{request.user.full_name or request.user.email} is now your trainer.",
            data={"trainer_id": str(request.user.id)},
        )
        return Response(UserSerializer(patient).data, status=status.HTTP_200_OK)


class SetMyTrainerView(APIView):
    """A patient links themselves to a trainer."""

    def post(self, request):
        if not request.user.is_patient:
            return Response(
                {"detail": "Only patients can set a trainer."},
                status=status.HTTP_403_FORBIDDEN,
            )
        trainer_id = request.data.get("trainer_id")
        try:
            trainer = User.objects.get(id=trainer_id, role=Role.TRAINER)
        except (User.DoesNotExist, ValidationError, ValueError, TypeError):
            return Response(
                {"detail": "Trainer not found."}, status=status.HTTP_400_BAD_REQUEST
            )
        profile, _ = PatientProfile.objects.get_or_create(user=request.user)
        profile.assigned_trainer = trainer
        profile.save()
        return Response(UserSerializer(trainer).data, status=status.HTTP_200_OK)
