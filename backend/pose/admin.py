from django.contrib import admin

from .models import PoseJob


@admin.register(PoseJob)
class PoseJobAdmin(admin.ModelAdmin):
    list_display = ("id", "created_by", "status", "progress", "detected_frames", "total_frames", "created_at")
    list_filter = ("status",)
    readonly_fields = ("keypoints",)
