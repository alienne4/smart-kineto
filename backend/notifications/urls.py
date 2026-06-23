from django.urls import path

from .views import (
    MarkAllNotificationsReadView,
    MarkNotificationReadView,
    NotificationListView,
    RegisterDeviceView,
)

urlpatterns = [
    path("devices/", RegisterDeviceView.as_view(), name="register-device"),
    path("notifications/", NotificationListView.as_view(), name="notifications"),
    path("notifications/read-all/", MarkAllNotificationsReadView.as_view(), name="notifications-read-all"),
    path("notifications/<int:pk>/read/", MarkNotificationReadView.as_view(), name="notification-read"),
]
