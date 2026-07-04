import uuid

from django.conf import settings
from django.db import models

from accounts.models import Role
from training.models import Exercise, ProgramAssignment

from .scoring import RejectionReason


class WandReferenceTemplate(models.Model):
    """The trainer-recorded reference movement an exercise's repetitions are scored against."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exercise = models.OneToOneField(Exercise, on_delete=models.CASCADE, related_name="wand_template")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="wand_templates",
        limit_choices_to={"role": Role.TRAINER},
    )
    # 100 resampled + averaged {roll,pitch,gx,gy,gz} frames.
    frames = models.JSONField()
    sample_count = models.PositiveIntegerField(default=100)
    # How many trainer repetitions were averaged into this template.
    rep_count = models.PositiveIntegerField(default=1)
    duration_ms = models.PositiveIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Reference template · {self.exercise.title}"


class WandSession(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = "IN_PROGRESS", "In progress"
        COMPLETED = "COMPLETED", "Completed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name="wand_sessions")
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wand_sessions",
        limit_choices_to={"role": Role.PATIENT},
    )
    assignment = models.ForeignKey(
        ProgramAssignment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="wand_sessions",
    )
    target_reps = models.PositiveIntegerField()
    valid_reps = models.PositiveIntegerField(default=0)
    invalid_reps = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.IN_PROGRESS)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.exercise.title} · {self.patient.email} ({self.status})"


class WandRepetition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(WandSession, on_delete=models.CASCADE, related_name="repetitions")
    index = models.PositiveIntegerField()

    # Raw candidate capture as submitted by the phone (variable-length, with t_ms).
    frames = models.JSONField()
    duration_ms = models.PositiveIntegerField()

    movement_similarity = models.FloatField()
    rom_similarity = models.FloatField()
    tempo_similarity = models.FloatField()
    smoothness_score = models.FloatField()
    graph_score = models.FloatField()
    duration_ratio = models.FloatField()

    is_valid = models.BooleanField()
    rejection_reason = models.CharField(
        max_length=20, blank=True, choices=[(r.value, r.value.title()) for r in RejectionReason]
    )
    # Downsampled candidate-vs-template curve, for charting.
    preview_points = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["index"]
        unique_together = [("session", "index")]

    def __str__(self):
        return f"Rep {self.index} · {self.session_id} ({'valid' if self.is_valid else 'rejected'})"
