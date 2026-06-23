from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminUserListView,
    AnnouncementViewSet,
    ReviewQueueView,
    StatsView,
    review_exercise,
    review_program,
)

router = DefaultRouter()
router.register("admin/announcements", AnnouncementViewSet, basename="admin-announcement")

urlpatterns = [
    path("admin/stats/", StatsView.as_view(), name="admin-stats"),
    path("admin/review/", ReviewQueueView.as_view(), name="admin-review"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-users"),
    path("admin/exercises/<uuid:pk>/<str:decision>/", review_exercise, name="admin-review-exercise"),
    path("admin/programs/<uuid:pk>/<str:decision>/", review_program, name="admin-review-program"),
] + router.urls
