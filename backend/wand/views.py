from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from training.models import Exercise, ProgramAssignment, ProgramExercise, TrackingMethod
from training.permissions import IsPatient, IsTrainer

from . import scoring
from .models import WandReferenceTemplate, WandRepetition, WandSession
from .serializers import (
    WandRepetitionSerializer,
    WandRepetitionSubmitSerializer,
    WandSessionCreateSerializer,
    WandSessionDetailSerializer,
    WandSessionSerializer,
    WandTemplateSerializer,
    WandTemplateSubmitSerializer,
)


def _visible_exercise_or_404(user, exercise_id):
    """Mirrors ExerciseViewSet.get_queryset()'s visibility rule."""
    if user.is_trainer:
        qs = Exercise.objects.filter(Q(created_by=user) | Q(is_template=True) | Q(is_public=True))
    else:
        qs = Exercise.objects.filter(programs__assignments__patient=user)
    return get_object_or_404(qs.distinct(), pk=exercise_id)


class WandTemplateUpsertView(APIView):
    """Trainer submits N recorded reference repetitions; averaged server-side into one template."""

    permission_classes = [IsTrainer]

    def post(self, request):
        serializer = WandTemplateSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        exercise = get_object_or_404(Exercise, pk=data["exercise_id"])
        if exercise.created_by_id != request.user.id:
            raise PermissionDenied("You can only record a reference template for your own exercises.")
        if exercise.tracking_method != TrackingMethod.HARDWARE_WAND:
            raise ValidationError("This exercise isn't tracked with the hardware wand.")

        repetitions = [(rep["frames"], rep["duration_ms"]) for rep in data["repetitions"]]
        try:
            built = scoring.build_template(repetitions)
        except ValueError as exc:
            raise ValidationError(str(exc))

        template, _created = WandReferenceTemplate.objects.update_or_create(
            exercise=exercise,
            defaults={
                "created_by": request.user,
                "frames": built.frames,
                "sample_count": len(built.frames),
                "rep_count": built.rep_count,
                "duration_ms": built.duration_ms,
            },
        )
        return Response(WandTemplateSerializer(template).data, status=201)


class WandTemplateDetailView(APIView):
    """Existence/metadata check — used by the trainer's create flow and the patient's
    'confirm a trainer reference exists' step."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, exercise_id):
        exercise = _visible_exercise_or_404(request.user, exercise_id)
        template = getattr(exercise, "wand_template", None)
        if template is None:
            return Response({"detail": "No reference template yet."}, status=404)
        return Response(WandTemplateSerializer(template).data)


class WandSessionViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = WandSessionSerializer

    def get_serializer_class(self):
        if self.action in ("retrieve", "complete"):
            return WandSessionDetailSerializer
        return WandSessionSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsPatient()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_trainer:
            return WandSession.objects.filter(exercise__created_by=user)
        return WandSession.objects.filter(patient=user)

    def create(self, request, *args, **kwargs):
        input_serializer = WandSessionCreateSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        data = input_serializer.validated_data

        exercise = _visible_exercise_or_404(request.user, data["exercise_id"])
        if exercise.tracking_method != TrackingMethod.HARDWARE_WAND:
            raise ValidationError("This exercise isn't tracked with the hardware wand.")

        template = getattr(exercise, "wand_template", None)
        if template is None:
            return Response(
                {"code": "NEEDS_TEMPLATE", "detail": "This exercise has no trainer reference template yet."},
                status=409,
            )

        assignment = None
        target_reps = data.get("target_reps")
        assignment_id = data.get("assignment_id")
        if assignment_id:
            assignment = get_object_or_404(ProgramAssignment, pk=assignment_id, patient=request.user)
            if target_reps is None:
                program_exercise = ProgramExercise.objects.filter(
                    program=assignment.program, exercise=exercise
                ).first()
                if program_exercise:
                    target_reps = program_exercise.reps
        if target_reps is None:
            target_reps = exercise.target_reps

        session = WandSession.objects.create(
            exercise=exercise,
            patient=request.user,
            assignment=assignment,
            target_reps=target_reps,
        )
        return Response(WandSessionSerializer(session).data, status=201)

    @action(detail=True, methods=["post"])
    def repetitions(self, request, pk=None):
        session = self.get_object()
        if session.patient_id != request.user.id:
            raise PermissionDenied("Not your session.")
        if session.status == WandSession.Status.COMPLETED:
            raise ValidationError("This session is already completed.")

        input_serializer = WandRepetitionSubmitSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        data = input_serializer.validated_data

        template = session.exercise.wand_template
        result = scoring.evaluate_repetition(
            candidate_frames=data["frames"],
            candidate_duration_ms=data["duration_ms"],
            template_frames=template.frames,
            template_duration_ms=template.duration_ms,
        )

        repetition = WandRepetition.objects.create(
            session=session,
            index=session.repetitions.count(),
            frames=data["frames"],
            duration_ms=result.duration_ms,
            movement_similarity=result.movement_similarity,
            rom_similarity=result.rom_similarity,
            tempo_similarity=result.tempo_similarity,
            smoothness_score=result.smoothness_score,
            graph_score=result.graph_score,
            duration_ratio=result.duration_ratio,
            is_valid=result.is_valid,
            rejection_reason=result.rejection_reason or "",
            preview_points=result.preview_points,
        )

        if result.is_valid:
            session.valid_reps += 1
        else:
            session.invalid_reps += 1

        if session.valid_reps >= session.target_reps:
            session.status = WandSession.Status.COMPLETED
            session.completed_at = timezone.now()

        session.save(update_fields=["valid_reps", "invalid_reps", "status", "completed_at"])

        return Response(
            {
                "repetition": WandRepetitionSerializer(repetition).data,
                "session": WandSessionSerializer(session).data,
            },
            status=201,
        )

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        session = self.get_object()
        if session.patient_id != request.user.id:
            raise PermissionDenied("Not your session.")
        if session.status != WandSession.Status.COMPLETED:
            session.status = WandSession.Status.COMPLETED
            session.completed_at = timezone.now()
            session.save(update_fields=["status", "completed_at"])
        return Response(WandSessionDetailSerializer(session).data)
