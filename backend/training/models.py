import uuid

from django.conf import settings
from django.db import models

from accounts.models import Role


class BodyPart(models.TextChoices):
    SHOULDER = "SHOULDER", "Shoulder"
    ELBOW = "ELBOW", "Elbow"
    WRIST = "WRIST", "Wrist"
    HIP = "HIP", "Hip"
    KNEE = "KNEE", "Knee"
    ANKLE = "ANKLE", "Ankle"
    BACK = "BACK", "Back"
    NECK = "NECK", "Neck"
    OTHER = "OTHER", "Other"


class Difficulty(models.TextChoices):
    EASY = "EASY", "Easy"
    MEDIUM = "MEDIUM", "Medium"
    HARD = "HARD", "Hard"


class ReviewStatus(models.TextChoices):
    NONE = "NONE", "Not submitted"
    PENDING = "PENDING", "Pending review"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


def exercise_media_path(instance, filename):
    return f"exercises/{instance.id}/{filename}"


class Exercise(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="exercises",
        limit_choices_to={"role": Role.TRAINER},
        null=True,
        blank=True,
    )
    # Library/predefined items are owned by the system (created_by is null).
    is_template = models.BooleanField(default=False)
    # Public = approved by an admin and visible to every trainer.
    is_public = models.BooleanField(default=False)
    review_status = models.CharField(
        max_length=10, choices=ReviewStatus.choices, default=ReviewStatus.NONE
    )
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    body_part = models.CharField(max_length=16, choices=BodyPart.choices, default=BodyPart.OTHER)
    difficulty = models.CharField(max_length=8, choices=Difficulty.choices, default=Difficulty.EASY)

    video = models.FileField(upload_to=exercise_media_path, null=True, blank=True)
    voiceover = models.FileField(upload_to=exercise_media_path, null=True, blank=True)
    thumbnail = models.ImageField(upload_to=exercise_media_path, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class TrainingProgram(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="programs",
        limit_choices_to={"role": Role.TRAINER},
        null=True,
        blank=True,
    )
    is_template = models.BooleanField(default=False)
    is_public = models.BooleanField(default=False)
    review_status = models.CharField(
        max_length=10, choices=ReviewStatus.choices, default=ReviewStatus.NONE
    )
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    exercises = models.ManyToManyField(Exercise, through="ProgramExercise", related_name="programs")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class ProgramExercise(models.Model):
    program = models.ForeignKey(
        TrainingProgram, on_delete=models.CASCADE, related_name="program_exercises"
    )
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name="program_links")
    order = models.PositiveIntegerField(default=0)
    sets = models.PositiveIntegerField(default=1)
    reps = models.PositiveIntegerField(default=10)
    target_score = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["order"]
        unique_together = [("program", "exercise")]

    def __str__(self):
        return f"{self.program.name} · {self.exercise.title}"


class ProgramAssignment(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        IN_PROGRESS = "IN_PROGRESS", "In progress"
        PAUSED = "PAUSED", "Paused"
        COMPLETED = "COMPLETED", "Completed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    program = models.ForeignKey(
        TrainingProgram, on_delete=models.CASCADE, related_name="assignments"
    )
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assignments",
        limit_choices_to={"role": Role.PATIENT},
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="assignments_made",
    )
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = [("program", "patient")]

    def __str__(self):
        return f"{self.program.name} -> {self.patient.email}"
