from django.contrib import admin

from .models import WandReferenceTemplate, WandRepetition, WandSession


@admin.register(WandReferenceTemplate)
class WandReferenceTemplateAdmin(admin.ModelAdmin):
    list_display = ("exercise", "created_by", "rep_count", "duration_ms", "created_at")
    readonly_fields = ("frames",)
    search_fields = ("exercise__title",)


class WandRepetitionInline(admin.TabularInline):
    model = WandRepetition
    extra = 0
    can_delete = False
    readonly_fields = (
        "index",
        "duration_ms",
        "movement_similarity",
        "graph_score",
        "is_valid",
        "rejection_reason",
        "created_at",
    )
    exclude = ("frames", "preview_points", "rom_similarity", "tempo_similarity", "smoothness_score", "duration_ratio")

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(WandSession)
class WandSessionAdmin(admin.ModelAdmin):
    list_display = ("exercise", "patient", "status", "valid_reps", "target_reps", "started_at")
    list_filter = ("status",)
    search_fields = ("exercise__title", "patient__email")
    inlines = [WandRepetitionInline]
