from django.conf import settings
from django.db import models


class DeviceToken(models.Model):
    class Platform(models.TextChoices):
        IOS = "ios", "iOS"
        ANDROID = "android", "Android"
        WEB = "web", "Web"
        UNKNOWN = "unknown", "Unknown"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="device_tokens"
    )
    expo_push_token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(
        max_length=10, choices=Platform.choices, default=Platform.UNKNOWN
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} · {self.platform}"


class Notification(models.Model):
    class Type(models.TextChoices):
        ASSIGNMENT = "assignment", "Program assigned"
        REMINDER = "reminder", "Reminder"
        PROGRESS = "progress", "Progress"
        ASSESSMENT = "assessment", "Assessment"
        MESSAGE = "message", "Message"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    type = models.CharField(max_length=20, choices=Type.choices)
    title = models.CharField(max_length=150)
    body = models.TextField(blank=True)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.type} -> {self.recipient.email}"
