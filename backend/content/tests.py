"""Unit tests for the content feed."""
from rest_framework import status
from rest_framework.test import APITestCase

from content.models import Announcement
from factories import make_patient, make_trainer


class FeedTests(APITestCase):
    def setUp(self):
        Announcement.objects.create(title="For all", audience=Announcement.Audience.ALL)
        Announcement.objects.create(title="For trainers", audience=Announcement.Audience.TRAINERS)
        Announcement.objects.create(title="For patients", audience=Announcement.Audience.PATIENTS)
        Announcement.objects.create(
            title="Hidden", audience=Announcement.Audience.ALL, published=False
        )

    def test_patient_sees_all_and_patient_audience(self):
        self.client.force_authenticate(user=make_patient())
        resp = self.client.get("/api/content/feed/")
        titles = {a["title"] for a in resp.data}
        self.assertEqual(titles, {"For all", "For patients"})

    def test_trainer_sees_all_and_trainer_audience(self):
        self.client.force_authenticate(user=make_trainer())
        resp = self.client.get("/api/content/feed/")
        titles = {a["title"] for a in resp.data}
        self.assertEqual(titles, {"For all", "For trainers"})

    def test_unpublished_excluded(self):
        self.client.force_authenticate(user=make_patient())
        resp = self.client.get("/api/content/feed/")
        titles = {a["title"] for a in resp.data}
        self.assertNotIn("Hidden", titles)

    def test_image_url_fallback(self):
        Announcement.objects.create(
            title="With url", audience=Announcement.Audience.ALL,
            image_url="https://example.com/x.png",
        )
        self.client.force_authenticate(user=make_patient())
        resp = self.client.get("/api/content/feed/")
        row = next(a for a in resp.data if a["title"] == "With url")
        self.assertEqual(row["image"], "https://example.com/x.png")

    def test_requires_authentication(self):
        self.assertEqual(self.client.get("/api/content/feed/").status_code, 401)
