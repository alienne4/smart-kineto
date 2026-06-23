from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DeviceToken, Notification
from .serializers import DeviceTokenSerializer, NotificationSerializer


class RegisterDeviceView(APIView):
    """Upsert the caller's Expo push token."""

    def post(self, request):
        token = request.data.get("expo_push_token")
        platform = request.data.get("platform", "unknown")
        if not token:
            return Response(
                {"detail": "expo_push_token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        obj, _ = DeviceToken.objects.update_or_create(
            expo_push_token=token,
            defaults={"user": request.user, "platform": platform},
        )
        return Response(DeviceTokenSerializer(obj).data, status=status.HTTP_200_OK)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class MarkNotificationReadView(APIView):
    def post(self, request, pk):
        updated = Notification.objects.filter(
            id=pk, recipient=request.user, read_at__isnull=True
        ).update(read_at=timezone.now())
        return Response({"updated": updated}, status=status.HTTP_200_OK)


class MarkAllNotificationsReadView(APIView):
    def post(self, request):
        updated = Notification.objects.filter(
            recipient=request.user, read_at__isnull=True
        ).update(read_at=timezone.now())
        return Response({"updated": updated}, status=status.HTTP_200_OK)
