from django.db.models import Q
from rest_framework import generics

from accounts.models import Role

from .models import Announcement
from .serializers import AnnouncementSerializer


class FeedView(generics.ListAPIView):
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        user = self.request.user
        audience = (
            Announcement.Audience.TRAINERS
            if user.role == Role.TRAINER
            else Announcement.Audience.PATIENTS
        )
        return Announcement.objects.filter(published=True).filter(
            Q(audience=Announcement.Audience.ALL) | Q(audience=audience)
        )
