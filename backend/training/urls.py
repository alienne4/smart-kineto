from rest_framework.routers import DefaultRouter

from .views import (
    ExerciseViewSet,
    ProgramAssignmentViewSet,
    TrainingProgramViewSet,
)

router = DefaultRouter()
router.register("exercises", ExerciseViewSet, basename="exercise")
router.register("programs", TrainingProgramViewSet, basename="program")
router.register("assignments", ProgramAssignmentViewSet, basename="assignment")

urlpatterns = router.urls
