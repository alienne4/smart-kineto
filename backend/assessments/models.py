import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from accounts.models import Role


class Assessment(models.Model):
    """A patient's periodic self-assessment of their condition."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assessments_submitted",
        limit_choices_to={"role": Role.PATIENT},
    )
    # 0 = no pain, 10 = worst pain (VAS scale).
    pain_level = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    # 0 = very restricted, 10 = full mobility.
    mobility_score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    notes = models.TextField(blank=True)
    # Flexible bucket for future questionnaire answers.
    answers = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Assessment<{self.patient.email} pain={self.pain_level}>"
