from django.contrib import admin

from .models import (
    Exercise,
    ProgramAssignment,
    ProgramExercise,
    ReviewStatus,
    TrainingProgram,
)


@admin.action(description="Approve & publish selected")
def approve_publish(modeladmin, request, queryset):
    queryset.update(review_status=ReviewStatus.APPROVED, is_public=True)


@admin.action(description="Reject selected")
def reject(modeladmin, request, queryset):
    queryset.update(review_status=ReviewStatus.REJECTED, is_public=False)


@admin.action(description="Unpublish selected")
def unpublish(modeladmin, request, queryset):
    queryset.update(is_public=False)


class ProgramExerciseInline(admin.TabularInline):
    model = ProgramExercise
    extra = 1


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "body_part",
        "difficulty",
        "stage",
        "tracking_method",
        "author_col",
        "review_status",
        "is_public",
        "created_at",
    )
    list_filter = ("stage", "tracking_method", "body_part", "difficulty", "review_status", "is_public", "is_template")
    search_fields = ("title",)
    actions = [approve_publish, reject, unpublish]

    @admin.display(description="Author")
    def author_col(self, obj):
        return "SmartKineto" if obj.is_template or obj.created_by_id is None else obj.created_by


@admin.register(TrainingProgram)
class TrainingProgramAdmin(admin.ModelAdmin):
    list_display = ("name", "author_col", "review_status", "is_public", "created_at")
    list_filter = ("review_status", "is_public", "is_template")
    search_fields = ("name",)
    inlines = [ProgramExerciseInline]
    actions = [approve_publish, reject, unpublish]

    @admin.display(description="Author")
    def author_col(self, obj):
        return "SmartKineto" if obj.is_template or obj.created_by_id is None else obj.created_by


@admin.register(ProgramAssignment)
class ProgramAssignmentAdmin(admin.ModelAdmin):
    list_display = ("program", "patient", "assigned_by", "status", "created_at")
    list_filter = ("status",)
