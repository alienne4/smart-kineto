"""Unit tests for the chat app."""
from rest_framework import status
from rest_framework.test import APITestCase

from chat.models import Message
from notifications.models import Notification
from factories import make_patient, make_trainer


class MessageTests(APITestCase):
    def test_send_message_creates_record_and_notifies(self):
        sender = make_trainer()
        recipient = make_patient()
        self.client.force_authenticate(user=sender)
        resp = self.client.post(
            "/api/chat/messages/",
            {"recipient_id": str(recipient.id), "body": "Hello"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        msg = Message.objects.get(id=resp.data["id"])
        self.assertEqual(msg.sender_id, sender.id)
        self.assertEqual(msg.recipient_id, recipient.id)
        self.assertTrue(
            Notification.objects.filter(recipient=recipient, type="message").exists()
        )

    def test_list_thread_marks_incoming_read(self):
        me = make_patient()
        partner = make_trainer()
        Message.objects.create(sender=partner, recipient=me, body="hi")
        Message.objects.create(sender=me, recipient=partner, body="yo")
        self.client.force_authenticate(user=me)
        resp = self.client.get("/api/chat/messages/", {"with": str(partner.id)})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)
        incoming = Message.objects.get(sender=partner, recipient=me)
        self.assertIsNotNone(incoming.read_at)

    def test_message_list_without_partner_is_empty(self):
        self.client.force_authenticate(user=make_patient())
        resp = self.client.get("/api/chat/messages/")
        self.assertEqual(list(resp.data), [])

    def test_thread_list_summarizes_conversations(self):
        me = make_patient()
        partner = make_trainer()
        Message.objects.create(sender=partner, recipient=me, body="first")
        Message.objects.create(sender=partner, recipient=me, body="second unread")
        Message.objects.create(sender=me, recipient=partner, body="reply")
        self.client.force_authenticate(user=me)
        resp = self.client.get("/api/chat/threads/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        thread = resp.data[0]
        self.assertEqual(thread["user_id"], str(partner.id))
        self.assertEqual(thread["unread"], 2)
        self.assertEqual(thread["last_message"], "reply")

    def test_requires_authentication(self):
        self.assertEqual(self.client.get("/api/chat/threads/").status_code, 401)
