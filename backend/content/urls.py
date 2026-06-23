from django.urls import path

from .views import FeedView

urlpatterns = [
    path("content/feed/", FeedView.as_view(), name="content-feed"),
]
