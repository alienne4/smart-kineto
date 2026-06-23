from rest_framework import permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role, User
from accounts.serializers import UserSerializer
from content.models import Announcement
from content.serializers import AnnouncementSerializer
from training.models import Exercise, ReviewStatus, TrainingProgram
from training.serializers import ExerciseSerializer, TrainingProgramSerializer


class IsAdmin(permissions.BasePermission):
    message = "Admins only."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)


class StatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(
            {
                "trainers": User.objects.filter(role=Role.TRAINER).count(),
                "patients": User.objects.filter(role=Role.PATIENT).count(),
                "exercises": Exercise.objects.count(),
                "programs": TrainingProgram.objects.count(),
                "pending_exercises": Exercise.objects.filter(review_status=ReviewStatus.PENDING).count(),
                "pending_programs": TrainingProgram.objects.filter(review_status=ReviewStatus.PENDING).count(),
                "announcements": Announcement.objects.count(),
                "public_exercises": Exercise.objects.filter(is_public=True).count(),
                "public_programs": TrainingProgram.objects.filter(is_public=True).count(),
            }
        )


class ReviewQueueView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        exercises = Exercise.objects.filter(review_status=ReviewStatus.PENDING)
        programs = TrainingProgram.objects.filter(review_status=ReviewStatus.PENDING)
        ctx = {"request": request}
        return Response(
            {
                "exercises": ExerciseSerializer(exercises, many=True, context=ctx).data,
                "programs": TrainingProgramSerializer(programs, many=True, context=ctx).data,
            }
        )


def _decide(model, pk, approve):
    obj = model.objects.filter(pk=pk).first()
    if not obj:
        return None
    if approve:
        obj.review_status = ReviewStatus.APPROVED
        obj.is_public = True
    else:
        obj.review_status = ReviewStatus.REJECTED
        obj.is_public = False
    obj.save(update_fields=["review_status", "is_public"])
    return obj


@api_view(["POST"])
@permission_classes([IsAdmin])
def review_exercise(request, pk, decision):
    obj = _decide(Exercise, pk, decision == "approve")
    if not obj:
        return Response({"detail": "Not found."}, status=404)
    return Response(ExerciseSerializer(obj, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([IsAdmin])
def review_program(request, pk, decision):
    obj = _decide(TrainingProgram, pk, decision == "approve")
    if not obj:
        return Response({"detail": "Not found."}, status=404)
    return Response(TrainingProgramSerializer(obj, context={"request": request}).data)


class AdminUserListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        users = User.objects.all().order_by("-date_joined")
        return Response(UserSerializer(users, many=True).data)


class AnnouncementAdminSerializer(AnnouncementSerializer):
    class Meta(AnnouncementSerializer.Meta):
        fields = (
            "id", "kind", "audience", "title", "body", "image", "image_url",
            "event_date", "location", "pinned", "published", "created_at",
        )


class AnnouncementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = AnnouncementAdminSerializer
    queryset = Announcement.objects.all()
