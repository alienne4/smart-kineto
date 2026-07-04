from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import WandSessionViewSet, WandTemplateDetailView, WandTemplateUpsertView

router = DefaultRouter()
router.register("wand/sessions", WandSessionViewSet, basename="wand-session")

urlpatterns = [
    path("wand/templates/", WandTemplateUpsertView.as_view(), name="wand-template-upsert"),
    path("wand/templates/<uuid:exercise_id>/", WandTemplateDetailView.as_view(), name="wand-template-detail"),
] + router.urls
