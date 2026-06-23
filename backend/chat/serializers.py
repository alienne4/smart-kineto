from rest_framework import serializers

from accounts.models import User

from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    recipient_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="recipient", write_only=True
    )

    class Meta:
        model = Message
        fields = ("id", "sender", "recipient_id", "body", "created_at", "read_at")
        read_only_fields = ("id", "sender", "created_at", "read_at")


class ThreadSerializer(serializers.Serializer):
    """A conversation summary with one partner."""

    user_id = serializers.UUIDField()
    full_name = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField()
    last_message = serializers.CharField()
    last_at = serializers.DateTimeField()
    unread = serializers.IntegerField()
