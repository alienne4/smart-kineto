import threading

from rest_framework import permissions
from rest_framework.generics import RetrieveAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from training.permissions import IsTrainer

from .models import PoseJob
from .processor import process_job
from .serializers import PoseJobSerializer


class PoseJobCreateView(APIView):
    """Trainer uploads a recorded video; we process pose detection in the background."""

    permission_classes = [IsTrainer]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        video = request.FILES.get("video")
        if not video:
            return Response({"detail": "No video uploaded."}, status=400)

        job = PoseJob.objects.create(created_by=request.user, source_video=video)

        thread = threading.Thread(target=process_job, args=(job.id,), daemon=True)
        thread.start()

        return Response(
            PoseJobSerializer(job, context={"request": request}).data, status=201
        )


class PoseJobDetailView(RetrieveAPIView):
    serializer_class = PoseJobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PoseJob.objects.filter(created_by=self.request.user)
