"""WebSocket URL routing.

Live training sessions (sensor streaming + scoring feedback) will be added here in M5.
"""
from django.urls import re_path

websocket_urlpatterns = [
    # re_path(r"ws/session/(?P<session_id>[^/]+)/$", SessionConsumer.as_asgi()),
]
