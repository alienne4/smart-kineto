from django.contrib import admin

from .models import AssistantMessage


@admin.register(AssistantMessage)
class AssistantMessageAdmin(admin.ModelAdmin):
    list_display = ("user", "sender", "content", "created_at")
    list_filter = ("sender", "created_at")
    search_fields = ("content", "user__email")
