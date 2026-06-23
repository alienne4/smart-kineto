from django.urls import path

from .views import MessageListCreateView, ThreadListView

urlpatterns = [
    path("chat/threads/", ThreadListView.as_view(), name="chat-threads"),
    path("chat/messages/", MessageListCreateView.as_view(), name="chat-messages"),
]
