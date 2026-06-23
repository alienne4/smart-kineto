import uuid

from django.conf import settings
from django.db import models


def pose_source_path(instance, filename):
    return f"pose/source/{instance.id}/{filename}"


def pose_output_path(instance, filename):
    return f"pose/output/{instance.id}/{filename}"


class PoseJob(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        DONE = "DONE", "Done"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pose_jobs"
    )
    source_video = models.FileField(upload_to=pose_source_path)
    output_video = models.FileField(upload_to=pose_output_path, null=True, blank=True)
    keypoints = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    progress = models.PositiveIntegerField(default=0)
    detected_frames = models.PositiveIntegerField(default=0)
    total_frames = models.PositiveIntegerField(default=0)
    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"PoseJob {self.id} ({self.status})"
