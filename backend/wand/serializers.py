from rest_framework import serializers

from training.serializers import ExerciseSerializer

from .models import WandReferenceTemplate, WandRepetition, WandSession

FRAME_FIELDS = ("t_ms", "roll", "pitch", "gx", "gy", "gz")


class WandFrameField(serializers.DictField):
    """A single raw IMU sample: {t_ms, roll, pitch, gx, gy, gz}."""

    child = serializers.FloatField()


class WandTemplateSerializer(serializers.ModelSerializer):
    exercise_id = serializers.PrimaryKeyRelatedField(source="exercise", read_only=True)

    class Meta:
        model = WandReferenceTemplate
        fields = ("id", "exercise_id", "sample_count", "rep_count", "duration_ms", "created_at", "updated_at")
        read_only_fields = fields


class WandTemplateRepetitionInputSerializer(serializers.Serializer):
    frames = serializers.ListField(child=WandFrameField(), min_length=2)
    duration_ms = serializers.IntegerField(min_value=1)


class WandTemplateSubmitSerializer(serializers.Serializer):
    exercise_id = serializers.UUIDField()
    repetitions = serializers.ListField(child=WandTemplateRepetitionInputSerializer(), min_length=1)


class WandRepetitionSubmitSerializer(serializers.Serializer):
    frames = serializers.ListField(child=WandFrameField(), min_length=1)
    duration_ms = serializers.IntegerField(min_value=1)


class WandRepetitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WandRepetition
        fields = (
            "id",
            "index",
            "duration_ms",
            "movement_similarity",
            "rom_similarity",
            "tempo_similarity",
            "smoothness_score",
            "graph_score",
            "duration_ratio",
            "is_valid",
            "rejection_reason",
            "preview_points",
            "created_at",
        )
        read_only_fields = fields


class WandSessionSerializer(serializers.ModelSerializer):
    exercise = ExerciseSerializer(read_only=True)

    class Meta:
        model = WandSession
        fields = (
            "id",
            "exercise",
            "assignment_id",
            "target_reps",
            "valid_reps",
            "invalid_reps",
            "status",
            "started_at",
            "completed_at",
        )
        read_only_fields = fields


class WandSessionDetailSerializer(WandSessionSerializer):
    repetitions = WandRepetitionSerializer(many=True, read_only=True)

    class Meta(WandSessionSerializer.Meta):
        fields = WandSessionSerializer.Meta.fields + ("repetitions",)
        read_only_fields = fields


class WandSessionCreateSerializer(serializers.Serializer):
    exercise_id = serializers.UUIDField()
    assignment_id = serializers.UUIDField(required=False, allow_null=True)
    target_reps = serializers.IntegerField(required=False, min_value=1)
