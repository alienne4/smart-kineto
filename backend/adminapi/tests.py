"""Unit tests for the admin API."""
from rest_framework import status
from rest_framework.test import APITestCase

from content.models import Announcement
from training.models import Exercise, ReviewStatus, TrainingProgram
from factories import make_admin, make_exercise, make_program, make_patient, make_trainer


class AdminPermissionTests(APITestCase):
    def test_non_admin_blocked(self):
        self.client.force_authenticate(user=make_trainer())
        for url in ("/api/admin/stats/", "/api/admin/review/", "/api/admin/users/"):
            self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN, url)

    def test_anonymous_blocked(self):
        self.assertEqual(self.client.get("/api/admin/stats/").status_code, 401)


class StatsTests(APITestCase):
    def test_stats_counts(self):
        make_trainer()
        make_patient()
        make_exercise(is_template=True)
        make_program(is_public=True)
        admin = make_admin()
        self.client.force_authenticate(user=admin)
        resp = self.client.get("/api/admin/stats/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(resp.data["patients"], 1)
        self.assertGreaterEqual(resp.data["public_programs"], 1)
        self.assertIn("pending_exercises", resp.data)


class ReviewTests(APITestCase):
    def test_review_queue_lists_pending(self):
        trainer = make_trainer()
        make_exercise(created_by=trainer, review_status=ReviewStatus.PENDING, title="Pend Ex")
        make_program(created_by=trainer, review_status=ReviewStatus.PENDING, name="Pend Pr")
        self.client.force_authenticate(user=make_admin())
        resp = self.client.get("/api/admin/review/")
        self.assertEqual(len(resp.data["exercises"]), 1)
        self.assertEqual(len(resp.data["programs"]), 1)

    def test_approve_exercise_makes_public(self):
        ex = make_exercise(created_by=make_trainer(), review_status=ReviewStatus.PENDING)
        self.client.force_authenticate(user=make_admin())
        resp = self.client.post(f"/api/admin/exercises/{ex.id}/approve/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ex.refresh_from_db()
        self.assertEqual(ex.review_status, ReviewStatus.APPROVED)
        self.assertTrue(ex.is_public)

    def test_reject_program_unpublishes(self):
        pr = make_program(created_by=make_trainer(), review_status=ReviewStatus.PENDING, is_public=True)
        self.client.force_authenticate(user=make_admin())
        resp = self.client.post(f"/api/admin/programs/{pr.id}/reject/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        pr.refresh_from_db()
        self.assertEqual(pr.review_status, ReviewStatus.REJECTED)
        self.assertFalse(pr.is_public)

    def test_review_missing_object_404(self):
        self.client.force_authenticate(user=make_admin())
        resp = self.client.post(
            "/api/admin/exercises/00000000-0000-0000-0000-000000000000/approve/"
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class AdminUsersTests(APITestCase):
    def test_lists_all_users(self):
        make_trainer()
        make_patient()
        admin = make_admin()
        self.client.force_authenticate(user=admin)
        resp = self.client.get("/api/admin/users/")
        self.assertGreaterEqual(len(resp.data), 3)


class AnnouncementAdminTests(APITestCase):
    def test_admin_can_create_announcement(self):
        self.client.force_authenticate(user=make_admin())
        resp = self.client.post(
            "/api/admin/announcements/",
            {"title": "Hello", "kind": "NEWS", "audience": "ALL"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Announcement.objects.filter(title="Hello").exists())

    def test_non_admin_cannot_create_announcement(self):
        self.client.force_authenticate(user=make_trainer())
        resp = self.client.post(
            "/api/admin/announcements/",
            {"title": "Nope", "kind": "NEWS", "audience": "ALL"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
