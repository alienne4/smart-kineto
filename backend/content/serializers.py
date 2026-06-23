from rest_framework import serializers

from .models import Announcement


class AnnouncementSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = (
            "id",
            "kind",
            "audience",
            "title",
            "body",
            "image",
            "event_date",
            "location",
            "pinned",
            "created_at",
        )

    def get_image(self, obj):
        if obj.image:
            request = self.context.get("request")
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url
        return obj.image_url or None
