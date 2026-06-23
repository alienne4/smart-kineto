from django.urls import path

from .views import PoseJobCreateView, PoseJobDetailView

urlpatterns = [
    path("pose/jobs/", PoseJobCreateView.as_view(), name="pose-job-create"),
    path("pose/jobs/<uuid:pk>/", PoseJobDetailView.as_view(), name="pose-job-detail"),
]
