"""Expo push notification helper.

Sends notifications synchronously via the Expo push service. For production this
should run in a Celery task (see PLAN.md) rather than inline in the request.
"""
import json
import logging
import urllib.error
import urllib.request
from django.utils import timezone

from .models import DeviceToken, Notification

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def _post_to_expo(messages):
    payload = json.dumps(messages).encode("utf-8")
    req = urllib.request.Request(
        EXPO_PUSH_URL,
        data=payload,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError) as exc:
        logger.warning("Expo push failed: %s", exc)
        return None


def notify_user(user, *, type, title, body, data=None):
    """Persist a Notification and push it to all of the user's devices."""
    data = data or {}
    notification = Notification.objects.create(
        recipient=user, type=type, title=title, body=body, data=data
    )

    tokens = list(
        DeviceToken.objects.filter(user=user).values_list("expo_push_token", flat=True)
    )
    if tokens:
        messages = [
            {"to": token, "title": title, "body": body, "data": data, "sound": "default"}
            for token in tokens
        ]
        result = _post_to_expo(messages)
        if result is not None:
            notification.sent_at = timezone.now()
            notification.save(update_fields=["sent_at"])

    return notification
