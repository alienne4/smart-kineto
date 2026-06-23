from rest_framework import serializers

from .models import AssistantMessage


class AssistantMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssistantMessage
        fields = ("id", "sender", "content", "proposal", "created_at")
        read_only_fields = fields
