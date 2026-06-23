from rest_framework import serializers

from .models import PoseJob


class PoseJobSerializer(serializers.ModelSerializer):
    source_video = serializers.SerializerMethodField()
    output_video = serializers.SerializerMethodField()

    class Meta:
        model = PoseJob
        fields = (
            "id",
            "status",
            "progress",
            "detected_frames",
            "total_frames",
            "source_video",
            "output_video",
            "error",
            "created_at",
        )
        read_only_fields = fields

    def _url(self, f):
        if not f:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(f.url) if request else f.url

    def get_source_video(self, obj):
        return self._url(obj.source_video)

    def get_output_video(self, obj):
        return self._url(obj.output_video)
