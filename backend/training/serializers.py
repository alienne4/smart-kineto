from rest_framework import serializers

from accounts.models import User

from .models import (
    Exercise,
    ExerciseStage,
    ProgramAssignment,
    ProgramExercise,
    TrackingMethod,
    TrainingProgram,
)


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "full_name", "role")


def author_label(obj):
    if getattr(obj, "is_template", False) or obj.created_by_id is None:
        return "SmartKineto"
    return obj.created_by.full_name or obj.created_by.email


class ExerciseSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    author = serializers.SerializerMethodField()

    class Meta:
        model = Exercise
        fields = (
            "id",
            "created_by",
            "author",
            "is_template",
            "is_public",
            "review_status",
            "title",
            "description",
            "body_part",
            "difficulty",
            "stage",
            "tracking_method",
            "target_reps",
            "requires_trainer_template",
            "has_trainer_template",
            "video",
            "voiceover",
            "thumbnail",
            "created_at",
        )
        read_only_fields = (
            "id",
            "created_by",
            "author",
            "is_template",
            "is_public",
            "review_status",
            "requires_trainer_template",
            "has_trainer_template",
            "created_at",
        )

    def get_author(self, obj):
        return author_label(obj)

    def validate(self, attrs):
        stage = attrs.get("stage", getattr(self.instance, "stage", ExerciseStage.ADVANCED_STAGE))
        method = attrs.get(
            "tracking_method", getattr(self.instance, "tracking_method", TrackingMethod.CAMERA_POSE)
        )
        if (stage == ExerciseStage.EARLY_STAGE) != (method == TrackingMethod.HARDWARE_WAND):
            raise serializers.ValidationError(
                "Early-stage exercises must use hardware-wand tracking, and vice versa."
            )
        return attrs


class ProgramExerciseSerializer(serializers.ModelSerializer):
    exercise = ExerciseSerializer(read_only=True)
    exercise_id = serializers.PrimaryKeyRelatedField(
        queryset=Exercise.objects.all(), source="exercise", write_only=True
    )

    class Meta:
        model = ProgramExercise
        fields = ("id", "exercise", "exercise_id", "order", "sets", "reps", "target_score")


class TrainingProgramSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    author = serializers.SerializerMethodField()
    program_exercises = ProgramExerciseSerializer(many=True, required=False)
    exercise_count = serializers.SerializerMethodField()

    class Meta:
        model = TrainingProgram
        fields = (
            "id",
            "created_by",
            "author",
            "is_template",
            "is_public",
            "review_status",
            "name",
            "description",
            "program_exercises",
            "exercise_count",
            "created_at",
        )
        read_only_fields = (
            "id",
            "created_by",
            "author",
            "is_template",
            "is_public",
            "review_status",
            "created_at",
        )

    def get_author(self, obj):
        return author_label(obj)

    def get_exercise_count(self, obj):
        return obj.program_exercises.count()

    def _set_exercises(self, program, items):
        for item in items:
            ex = item["exercise"]
            if not ex.is_ready_for_assignment:
                raise serializers.ValidationError(
                    {
                        "program_exercises": (
                            f"“{ex.title}” needs a trainer reference template "
                            "before it can be assigned."
                        )
                    }
                )

        program.program_exercises.all().delete()
        for idx, item in enumerate(items):
            ProgramExercise.objects.create(
                program=program,
                exercise=item["exercise"],
                order=item.get("order", idx),
                sets=item.get("sets", 1),
                reps=item.get("reps", 10),
                target_score=item.get("target_score"),
            )

    def create(self, validated_data):
        items = validated_data.pop("program_exercises", [])
        program = TrainingProgram.objects.create(**validated_data)
        self._set_exercises(program, items)
        return program

    def update(self, instance, validated_data):
        items = validated_data.pop("program_exercises", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items is not None:
            self._set_exercises(instance, items)
        return instance


class ProgramAssignmentSerializer(serializers.ModelSerializer):
    program = TrainingProgramSerializer(read_only=True)
    program_id = serializers.PrimaryKeyRelatedField(
        queryset=TrainingProgram.objects.all(), source="program", write_only=True
    )
    patient = UserMiniSerializer(read_only=True)
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="PATIENT"), source="patient", write_only=True
    )

    class Meta:
        model = ProgramAssignment
        fields = (
            "id",
            "program",
            "program_id",
            "patient",
            "patient_id",
            "status",
            "created_at",
        )
        read_only_fields = ("id", "created_at")
