from django.db.models import Q
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .models import (
    Exercise,
    ProgramAssignment,
    ProgramExercise,
    ReviewStatus,
    TrainingProgram,
)
from .permissions import IsTrainer, IsTrainerOrReadOnly
from .serializers import (
    ExerciseSerializer,
    ProgramAssignmentSerializer,
    TrainingProgramSerializer,
)


class ExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseSerializer
    permission_classes = [IsTrainerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_trainer:
            # Own exercises + SmartKineto library + community (approved public).
            return Exercise.objects.filter(
                Q(created_by=user) | Q(is_template=True) | Q(is_public=True)
            ).distinct()
        # Patients see exercises that appear in programs assigned to them.
        return Exercise.objects.filter(programs__assignments__patient=user).distinct()

    def _attach_pose_video(self, exercise):
        """If a finished pose-detection job id was sent, use its processed video."""
        job_id = self.request.data.get("pose_job_id")
        if not job_id:
            return
        from pose.models import PoseJob

        job = PoseJob.objects.filter(
            id=job_id, created_by=self.request.user, status=PoseJob.Status.DONE
        ).first()
        if job and job.output_video:
            exercise.video = job.output_video.name
            exercise.save(update_fields=["video"])

    def perform_create(self, serializer):
        exercise = serializer.save(created_by=self.request.user, is_template=False)
        self._attach_pose_video(exercise)

    def perform_update(self, serializer):
        if serializer.instance.created_by_id != self.request.user.id:
            raise PermissionDenied("You can only edit your own exercises.")
        exercise = serializer.save()
        self._attach_pose_video(exercise)

    def perform_destroy(self, instance):
        if instance.created_by_id != self.request.user.id:
            raise PermissionDenied("You can only delete your own exercises.")
        instance.delete()

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        ex = self.get_object()
        if ex.created_by_id != request.user.id:
            raise PermissionDenied("You can only publish your own exercises.")
        ex.review_status = ReviewStatus.PENDING
        ex.save(update_fields=["review_status"])
        return Response(ExerciseSerializer(ex, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def clone(self, request, pk=None):
        """Copy a (template) exercise into the trainer's own library to customize."""
        src = self.get_object()
        copy = Exercise.objects.create(
            created_by=request.user,
            is_template=False,
            title=f"{src.title} (copy)",
            description=src.description,
            body_part=src.body_part,
            difficulty=src.difficulty,
            video=src.video,
            voiceover=src.voiceover,
            thumbnail=src.thumbnail,
        )
        return Response(ExerciseSerializer(copy, context={"request": request}).data, status=201)


class TrainingProgramViewSet(viewsets.ModelViewSet):
    serializer_class = TrainingProgramSerializer
    permission_classes = [IsTrainerOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_trainer:
            return TrainingProgram.objects.filter(
                Q(created_by=user) | Q(is_template=True) | Q(is_public=True)
            ).distinct()
        return TrainingProgram.objects.filter(assignments__patient=user).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, is_template=False)

    def perform_update(self, serializer):
        if serializer.instance.created_by_id != self.request.user.id:
            raise PermissionDenied("You can only edit your own programs.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.created_by_id != self.request.user.id:
            raise PermissionDenied("You can only delete your own programs.")
        instance.delete()

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        program = self.get_object()
        if program.created_by_id != request.user.id:
            raise PermissionDenied("You can only publish your own programs.")
        program.review_status = ReviewStatus.PENDING
        program.save(update_fields=["review_status"])
        return Response(
            TrainingProgramSerializer(program, context={"request": request}).data
        )

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def public(self, request):
        """Public + predefined programs anyone can browse and self-assign."""
        qs = TrainingProgram.objects.filter(
            Q(is_template=True) | Q(is_public=True)
        ).distinct()
        return Response(
            TrainingProgramSerializer(qs, many=True, context={"request": request}).data
        )

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def self_assign(self, request, pk=None):
        """A patient adds a public/predefined program to their own plan."""
        program = TrainingProgram.objects.filter(pk=pk).first()
        if not program:
            return Response({"detail": "Not found."}, status=404)
        if not (program.is_public or program.is_template):
            raise PermissionDenied("This program isn't available to self-assign.")
        if not request.user.is_patient:
            raise PermissionDenied("Only patients can self-assign programs.")
        assignment, created = ProgramAssignment.objects.get_or_create(
            program=program,
            patient=request.user,
            defaults={"assigned_by": None, "status": ProgramAssignment.Status.ACTIVE},
        )
        return Response(
            ProgramAssignmentSerializer(assignment).data,
            status=201 if created else 200,
        )

    @action(detail=True, methods=["post"])
    def clone(self, request, pk=None):
        src = self.get_object()
        copy = TrainingProgram.objects.create(
            created_by=request.user,
            is_template=False,
            name=f"{src.name} (copy)",
            description=src.description,
        )
        for pe in src.program_exercises.all():
            ProgramExercise.objects.create(
                program=copy,
                exercise=pe.exercise,
                order=pe.order,
                sets=pe.sets,
                reps=pe.reps,
                target_score=pe.target_score,
            )
        return Response(
            TrainingProgramSerializer(copy, context={"request": request}).data, status=201
        )


class ProgramAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = ProgramAssignmentSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        if self.action in ("complete", "start", "reopen"):
            return [permissions.IsAuthenticated()]
        return [IsTrainer()]

    def get_queryset(self):
        user = self.request.user
        if user.is_trainer:
            return ProgramAssignment.objects.filter(assigned_by=user)
        return ProgramAssignment.objects.filter(patient=user)

    def perform_create(self, serializer):
        assignment = serializer.save(assigned_by=self.request.user)
        from notifications.push import notify_user

        notify_user(
            assignment.patient,
            type="assignment",
            title="New program assigned",
            body=f"Your trainer assigned you “{assignment.program.name}”.",
            data={"assignment_id": str(assignment.id)},
        )

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        """A patient begins a session; mark it in progress (unless already completed)."""
        assignment = self.get_object()
        if assignment.patient_id != request.user.id:
            return Response({"detail": "Not your assignment."}, status=403)
        if assignment.status != ProgramAssignment.Status.COMPLETED:
            assignment.status = ProgramAssignment.Status.IN_PROGRESS
            assignment.save(update_fields=["status"])
        return Response(ProgramAssignmentSerializer(assignment).data, status=200)

    @action(detail=True, methods=["post"])
    def reopen(self, request, pk=None):
        """A patient reopens a completed session to do it again."""
        assignment = self.get_object()
        if assignment.patient_id != request.user.id:
            return Response({"detail": "Not your assignment."}, status=403)
        assignment.status = ProgramAssignment.Status.IN_PROGRESS
        assignment.save(update_fields=["status"])

        if assignment.assigned_by_id:
            from notifications.push import notify_user

            notify_user(
                assignment.assigned_by,
                type="progress",
                title="Program reopened",
                body=f"{request.user.full_name or request.user.email} restarted “{assignment.program.name}”.",
                data={"assignment_id": str(assignment.id), "patient_id": str(request.user.id)},
            )
        return Response(ProgramAssignmentSerializer(assignment).data, status=200)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """A patient marks their assigned program as completed; notify the trainer."""
        assignment = self.get_object()
        if assignment.patient_id != request.user.id:
            return Response({"detail": "Not your assignment."}, status=403)
        assignment.status = ProgramAssignment.Status.COMPLETED
        assignment.save(update_fields=["status"])

        if assignment.assigned_by_id:
            from notifications.push import notify_user

            notify_user(
                assignment.assigned_by,
                type="progress",
                title="Program completed",
                body=f"{request.user.full_name or request.user.email} completed “{assignment.program.name}”.",
                data={"assignment_id": str(assignment.id), "patient_id": str(request.user.id)},
            )
        return Response(ProgramAssignmentSerializer(assignment).data, status=200)
