from django.db import models


class Announcement(models.Model):
    class Kind(models.TextChoices):
        NEWS = "NEWS", "News"
        EVENT = "EVENT", "Event"

    class Audience(models.TextChoices):
        ALL = "ALL", "Everyone"
        TRAINERS = "TRAINERS", "Trainers"
        PATIENTS = "PATIENTS", "Patients"

    kind = models.CharField(max_length=8, choices=Kind.choices, default=Kind.NEWS)
    audience = models.CharField(max_length=10, choices=Audience.choices, default=Audience.ALL)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    image = models.ImageField(upload_to="announcements/", null=True, blank=True)
    # Optional image by URL (handy for seeding without uploading files).
    image_url = models.URLField(blank=True)
    event_date = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=200, blank=True)
    pinned = models.BooleanField(default=False)
    published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-pinned", "-created_at"]

    def __str__(self):
        return f"[{self.kind}] {self.title}"
