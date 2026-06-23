from django.conf import settings
from django.db import models


class AssistantMessage(models.Model):
    """A single turn in a patient's conversation with the AI assistant.

    Assistant turns may carry a structured ``proposal`` (a suggested program)
    that the client can render and let the patient accept.
    """

    class Sender(models.TextChoices):
        USER = "user", "User"
        ASSISTANT = "assistant", "Assistant"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assistant_messages"
    )
    sender = models.CharField(max_length=10, choices=Sender.choices)
    content = models.TextField()
    proposal = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender}: {self.content[:40]}"
