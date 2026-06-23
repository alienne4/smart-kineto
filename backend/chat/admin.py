from django.contrib import admin

from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "recipient", "body", "created_at", "read_at")
    search_fields = ("body", "sender__email", "recipient__email")
