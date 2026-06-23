from django.contrib import admin

from .models import Announcement


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "kind", "audience", "event_date", "pinned", "published", "created_at")
    list_filter = ("kind", "audience", "published", "pinned")
    search_fields = ("title", "body")
