from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok", "service": "smartkinetofit-backend"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("accounts.api_urls")),
    path("api/", include("training.urls")),
    path("api/", include("assessments.urls")),
    path("api/", include("notifications.urls")),
    path("api/", include("chat.urls")),
    path("api/", include("content.urls")),
    path("api/", include("adminapi.urls")),
    path("api/", include("assistant.urls")),
    path("api/", include("pose.urls")),
    path("api/", include("wand.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
