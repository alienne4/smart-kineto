from django.contrib import admin

from .models import Assessment


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("patient", "pain_level", "mobility_score", "created_at")
    list_filter = ("pain_level", "mobility_score")
