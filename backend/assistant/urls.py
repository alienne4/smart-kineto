from django.urls import path

from .views import AcceptPlanView, ChatView, MessagesView

urlpatterns = [
    path("assistant/messages/", MessagesView.as_view(), name="assistant-messages"),
    path("assistant/chat/", ChatView.as_view(), name="assistant-chat"),
    path("assistant/accept/", AcceptPlanView.as_view(), name="assistant-accept"),
]
