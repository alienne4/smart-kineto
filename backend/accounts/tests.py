"""Unit tests for the accounts app: auth, profile signals and linking."""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import PatientProfile, Role, TrainerProfile, User
from factories import assign_trainer, make_patient, make_trainer


class RegistrationTests(APITestCase):
    url = "/api/auth/register/"

    def test_register_patient_creates_user_and_profile(self):
        resp = self.client.post(
            self.url,
            {
                "email": "newpatient@example.com",
                "full_name": "New Patient",
                "role": "PATIENT",
                "password": "S3cret!pass",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="newpatient@example.com")
        self.assertEqual(user.role, Role.PATIENT)
        self.assertTrue(user.check_password("S3cret!pass"))
        # password must never be echoed back
        self.assertNotIn("password", resp.data)
        # signal should have created the matching profile
        self.assertTrue(PatientProfile.objects.filter(user=user).exists())

    def test_register_trainer_creates_trainer_profile(self):
        resp = self.client.post(
            self.url,
            {
                "email": "newtrainer@example.com",
                "full_name": "New Trainer",
                "role": "TRAINER",
                "password": "S3cret!pass",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="newtrainer@example.com")
        self.assertTrue(TrainerProfile.objects.filter(user=user).exists())

    def test_register_rejects_invalid_role(self):
        resp = self.client.post(
            self.url,
            {"email": "x@example.com", "role": "ADMIN", "password": "S3cret!pass"},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", resp.data)

    def test_register_rejects_weak_password(self):
        resp = self.client.post(
            self.url,
            {"email": "weak@example.com", "role": "PATIENT", "password": "123"},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", resp.data)

    def test_register_rejects_duplicate_email(self):
        make_patient(email="dupe@example.com")
        resp = self.client.post(
            self.url,
            {"email": "dupe@example.com", "role": "PATIENT", "password": "S3cret!pass"},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(APITestCase):
    def setUp(self):
        self.user = make_patient(email="login@example.com", password="S3cret!pass")

    def test_login_returns_tokens_and_user(self):
        resp = self.client.post(
            "/api/auth/login/",
            {"email": "login@example.com", "password": "S3cret!pass"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)
        self.assertEqual(resp.data["user"]["email"], "login@example.com")
        self.assertEqual(resp.data["user"]["role"], "PATIENT")

    def test_login_token_carries_role_claim(self):
        from rest_framework_simplejwt.tokens import AccessToken

        resp = self.client.post(
            "/api/auth/login/",
            {"email": "login@example.com", "password": "S3cret!pass"},
        )
        token = AccessToken(resp.data["access"])
        self.assertEqual(token["role"], "PATIENT")
        self.assertEqual(token["email"], "login@example.com")

    def test_login_wrong_password_fails(self):
        resp = self.client.post(
            "/api/auth/login/",
            {"email": "login@example.com", "password": "wrong-password"},
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class MeViewTests(APITestCase):
    def test_requires_authentication(self):
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_returns_current_user(self):
        user = make_trainer(email="me@example.com")
        self.client.force_authenticate(user=user)
        resp = self.client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["email"], "me@example.com")
        self.assertEqual(resp.data["role"], "TRAINER")


class TrainerListTests(APITestCase):
    def test_lists_active_trainers_only(self):
        make_trainer(email="t-active@example.com")
        make_trainer(email="t-inactive@example.com", is_active=False)
        make_patient(email="p@example.com")
        self.client.force_authenticate(user=make_patient())
        resp = self.client.get("/api/trainers/")
        emails = {row["email"] for row in resp.data}
        self.assertIn("t-active@example.com", emails)
        self.assertNotIn("t-inactive@example.com", emails)
        self.assertNotIn("p@example.com", emails)


class MyPatientsTests(APITestCase):
    def test_trainer_sees_only_linked_patients(self):
        trainer = make_trainer()
        mine = make_patient(email="mine@example.com")
        other = make_patient(email="other@example.com")
        assign_trainer(mine, trainer)
        assign_trainer(other, make_trainer())
        self.client.force_authenticate(user=trainer)
        resp = self.client.get("/api/patients/")
        emails = {row["email"] for row in resp.data}
        self.assertEqual(emails, {"mine@example.com"})


class PatientSearchTests(APITestCase):
    def test_trainer_can_search_patients_by_name(self):
        trainer = make_trainer()
        make_patient(email="alice@example.com", full_name="Alice Smith")
        make_patient(email="bob@example.com", full_name="Bob Jones")
        self.client.force_authenticate(user=trainer)
        resp = self.client.get("/api/patients/search/", {"q": "alice"})
        emails = {row["email"] for row in resp.data}
        self.assertEqual(emails, {"alice@example.com"})

    def test_patient_search_returns_nothing_for_patient(self):
        patient = make_patient()
        make_patient(email="alice@example.com", full_name="Alice Smith")
        self.client.force_authenticate(user=patient)
        resp = self.client.get("/api/patients/search/", {"q": "alice"})
        self.assertEqual(list(resp.data), [])


class AddPatientTests(APITestCase):
    def test_trainer_links_patient(self):
        trainer = make_trainer()
        patient = make_patient()
        self.client.force_authenticate(user=trainer)
        resp = self.client.post("/api/me/patients/", {"patient_id": str(patient.id)})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        patient.refresh_from_db()
        self.assertEqual(patient.patient_profile.assigned_trainer_id, trainer.id)

    def test_patient_cannot_add_patient(self):
        self.client.force_authenticate(user=make_patient())
        resp = self.client.post("/api/me/patients/", {"patient_id": str(make_patient().id)})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_patient_id_returns_400(self):
        self.client.force_authenticate(user=make_trainer())
        resp = self.client.post("/api/me/patients/", {"patient_id": "not-a-uuid"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class SetMyTrainerTests(APITestCase):
    def test_patient_links_self_to_trainer(self):
        patient = make_patient()
        trainer = make_trainer()
        self.client.force_authenticate(user=patient)
        resp = self.client.post("/api/me/trainer/", {"trainer_id": str(trainer.id)})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        patient.refresh_from_db()
        self.assertEqual(patient.patient_profile.assigned_trainer_id, trainer.id)

    def test_trainer_cannot_set_trainer(self):
        self.client.force_authenticate(user=make_trainer())
        resp = self.client.post("/api/me/trainer/", {"trainer_id": str(make_trainer().id)})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_trainer_id_returns_400(self):
        self.client.force_authenticate(user=make_patient())
        resp = self.client.post("/api/me/trainer/", {"trainer_id": "00000000-0000-0000-0000-000000000000"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class UserModelTests(APITestCase):
    def test_role_helpers(self):
        self.assertTrue(make_trainer().is_trainer)
        self.assertFalse(make_trainer().is_patient)
        self.assertTrue(make_patient().is_patient)

    def test_create_superuser_is_staff_and_trainer(self):
        admin = User.objects.create_superuser(email="boss@example.com", password="S3cret!pass")
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertEqual(admin.role, Role.TRAINER)

    def test_create_user_requires_email(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="x")
