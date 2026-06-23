from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User

from .models import Message
from .serializers import MessageSerializer, ThreadSerializer


class ThreadListView(APIView):
    """List the caller's conversations with last message + unread count."""

    def get(self, request):
        me = request.user
        msgs = (
            Message.objects.filter(Q(sender=me) | Q(recipient=me))
            .select_related("sender", "recipient")
            .order_by("-created_at")
        )
        threads = {}
        for m in msgs:
            partner = m.recipient if m.sender_id == me.id else m.sender
            if partner.id not in threads:
                threads[partner.id] = {
                    "user_id": partner.id,
                    "full_name": partner.full_name,
                    "email": partner.email,
                    "role": partner.role,
                    "last_message": m.body,
                    "last_at": m.created_at,
                    "unread": 0,
                }
            if m.recipient_id == me.id and m.read_at is None:
                threads[partner.id]["unread"] += 1
        data = sorted(threads.values(), key=lambda t: t["last_at"], reverse=True)
        return Response(ThreadSerializer(data, many=True).data)


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer

    def get_queryset(self):
        me = self.request.user
        other_id = self.request.query_params.get("with")
        if not other_id:
            return Message.objects.none()
        qs = Message.objects.filter(
            Q(sender=me, recipient_id=other_id) | Q(sender_id=other_id, recipient=me)
        ).select_related("sender")
        # Mark incoming messages in this thread as read.
        Message.objects.filter(sender_id=other_id, recipient=me, read_at__isnull=True).update(
            read_at=timezone.now()
        )
        return qs

    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user)
        from notifications.push import notify_user

        notify_user(
            message.recipient,
            type="message",
            title=f"Message from {self.request.user.full_name or self.request.user.email}",
            body=message.body[:140],
            data={"from_id": str(self.request.user.id)},
        )
