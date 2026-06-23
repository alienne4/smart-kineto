"""Unit tests for the notifications app and the Expo push helper."""
from unittest import mock

from rest_framework import status
from rest_framework.test import APITestCase

from notifications import push
from notifications.models import DeviceToken, Notification
from factories import make_patient


class DeviceTokenTests(APITestCase):
    def test_register_device_creates_token(self):
        user = make_patient()
        self.client.force_authenticate(user=user)
        resp = self.client.post(
            "/api/devices/",
            {"expo_push_token": "ExponentPushToken[abc]", "platform": "ios"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(
            DeviceToken.objects.filter(user=user, expo_push_token="ExponentPushToken[abc]").exists()
        )

    def test_register_device_upserts_on_reuse(self):
        user1 = make_patient()
        user2 = make_patient()
        self.client.force_authenticate(user=user1)
        self.client.post("/api/devices/", {"expo_push_token": "tok", "platform": "ios"})
        # same token now claimed by another user
        self.client.force_authenticate(user=user2)
        self.client.post("/api/devices/", {"expo_push_token": "tok", "platform": "android"})
        self.assertEqual(DeviceToken.objects.filter(expo_push_token="tok").count(), 1)
        self.assertEqual(DeviceToken.objects.get(expo_push_token="tok").user_id, user2.id)

    def test_missing_token_returns_400(self):
        self.client.force_authenticate(user=make_patient())
        resp = self.client.post("/api/devices/", {"platform": "ios"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class NotificationListTests(APITestCase):
    def test_lists_only_own_notifications(self):
        me = make_patient()
        other = make_patient()
        Notification.objects.create(recipient=me, type="reminder", title="Mine")
        Notification.objects.create(recipient=other, type="reminder", title="Theirs")
        self.client.force_authenticate(user=me)
        resp = self.client.get("/api/notifications/")
        titles = {n["title"] for n in resp.data}
        self.assertEqual(titles, {"Mine"})

    def test_mark_one_read(self):
        me = make_patient()
        n = Notification.objects.create(recipient=me, type="reminder", title="x")
        self.client.force_authenticate(user=me)
        resp = self.client.post(f"/api/notifications/{n.id}/read/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["updated"], 1)
        n.refresh_from_db()
        self.assertIsNotNone(n.read_at)

    def test_mark_all_read(self):
        me = make_patient()
        Notification.objects.create(recipient=me, type="reminder", title="a")
        Notification.objects.create(recipient=me, type="reminder", title="b")
        self.client.force_authenticate(user=me)
        resp = self.client.post("/api/notifications/read-all/")
        self.assertEqual(resp.data["updated"], 2)
        self.assertEqual(
            Notification.objects.filter(recipient=me, read_at__isnull=True).count(), 0
        )

    def test_cannot_mark_others_notification(self):
        me = make_patient()
        other = make_patient()
        n = Notification.objects.create(recipient=other, type="reminder", title="x")
        self.client.force_authenticate(user=me)
        resp = self.client.post(f"/api/notifications/{n.id}/read/")
        self.assertEqual(resp.data["updated"], 0)


class PushHelperTests(APITestCase):
    def test_notify_user_without_tokens_does_not_call_expo(self):
        user = make_patient()
        with mock.patch.object(push, "_post_to_expo") as posted:
            notification = push.notify_user(
                user, type="reminder", title="Hi", body="there"
            )
        posted.assert_not_called()
        self.assertEqual(notification.recipient_id, user.id)
        self.assertIsNone(notification.sent_at)

    def test_notify_user_with_token_calls_expo_and_marks_sent(self):
        user = make_patient()
        DeviceToken.objects.create(user=user, expo_push_token="ExponentPushToken[z]")
        with mock.patch.object(push, "_post_to_expo", return_value={"data": []}) as posted:
            notification = push.notify_user(user, type="reminder", title="Hi", body="b")
        posted.assert_called_once()
        self.assertIsNotNone(notification.sent_at)

    def test_notify_user_expo_failure_leaves_sent_at_none(self):
        user = make_patient()
        DeviceToken.objects.create(user=user, expo_push_token="ExponentPushToken[y]")
        with mock.patch.object(push, "_post_to_expo", return_value=None):
            notification = push.notify_user(user, type="reminder", title="Hi", body="b")
        self.assertIsNone(notification.sent_at)
