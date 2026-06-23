from rest_framework import serializers

from training.serializers import UserMiniSerializer

from .models import Assessment


class AssessmentSerializer(serializers.ModelSerializer):
    patient = UserMiniSerializer(read_only=True)

    class Meta:
        model = Assessment
        fields = (
            "id",
            "patient",
            "pain_level",
            "mobility_score",
            "notes",
            "answers",
            "created_at",
        )
        read_only_fields = ("id", "patient", "created_at")
