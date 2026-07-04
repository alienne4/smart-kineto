"""API tests for the wand app: reference templates, sessions, repetitions."""
from rest_framework import status
from rest_framework.test import APITestCase

from factories import (
    assign_program,
    make_exercise,
    make_patient,
    make_program,
    make_trainer,
    make_wand_session,
    make_wand_template,
)
from training.models import ExerciseStage, TrackingMethod
from wand.models import WandReferenceTemplate, WandRepetition, WandSession
from wand.test_scoring import make_frames


def wand_exercise(trainer, target_reps=3, **overrides):
    return make_exercise(
        created_by=trainer,
        stage=ExerciseStage.EARLY_STAGE,
        tracking_method=TrackingMethod.HARDWARE_WAND,
        target_reps=target_reps,
        **overrides,
    )


class WandTemplateTests(APITestCase):
    def test_trainer_creates_template(self):
        trainer = make_trainer()
        exercise = wand_exercise(trainer)
        self.client.force_authenticate(user=trainer)
        payload = {
            "exercise_id": str(exercise.id),
            "repetitions": [{"frames": make_frames(n=60), "duration_ms": 1000}],
        }
        resp = self.client.post("/api/wand/templates/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(WandReferenceTemplate.objects.filter(exercise=exercise).exists())

    def test_cannot_create_template_for_other_trainers_exercise(self):
        exercise = wand_exercise(make_trainer())
        self.client.force_authenticate(user=make_trainer())
        payload = {
            "exercise_id": str(exercise.id),
            "repetitions": [{"frames": make_frames(n=60), "duration_ms": 1000}],
        }
        resp = self.client.post("/api/wand/templates/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_template_detail_404_then_200(self):
        trainer = make_trainer()
        exercise = wand_exercise(trainer)
        self.client.force_authenticate(user=trainer)

        resp = self.client.get(f"/api/wand/templates/{exercise.id}/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

        make_wand_template(exercise, created_by=trainer)
        resp = self.client.get(f"/api/wand/templates/{exercise.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class WandSessionTests(APITestCase):
    def _assign_visible_exercise(self, exercise, patient, trainer):
        program = make_program(created_by=trainer, exercises=[exercise])
        return assign_program(program, patient, assigned_by=trainer)

    def _create_template(self, trainer, exercise):
        self.client.force_authenticate(user=trainer)
        payload = {
            "exercise_id": str(exercise.id),
            "repetitions": [{"frames": make_frames(n=80, duration_ms=1000), "duration_ms": 1000}],
        }
        resp = self.client.post("/api/wand/templates/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_start_session_without_template_returns_409(self):
        trainer = make_trainer()
        patient = make_patient()
        exercise = wand_exercise(trainer)
        self._assign_visible_exercise(exercise, patient, trainer)

        self.client.force_authenticate(user=patient)
        resp = self.client.post("/api/wand/sessions/", {"exercise_id": str(exercise.id)}, format="json")
        self.assertEqual(resp.status_code, 409)
        self.assertEqual(resp.data["code"], "NEEDS_TEMPLATE")

    def test_full_session_happy_path_auto_completes(self):
        trainer = make_trainer()
        patient = make_patient()
        exercise = wand_exercise(trainer, target_reps=2)
        self._assign_visible_exercise(exercise, patient, trainer)
        self._create_template(trainer, exercise)

        self.client.force_authenticate(user=patient)
        resp = self.client.post("/api/wand/sessions/", {"exercise_id": str(exercise.id)}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["status"], "IN_PROGRESS")
        session_id = resp.data["id"]

        for _ in range(2):
            rep_resp = self.client.post(
                f"/api/wand/sessions/{session_id}/repetitions/",
                {"frames": make_frames(n=80, duration_ms=1000), "duration_ms": 1000},
                format="json",
            )
            self.assertEqual(rep_resp.status_code, status.HTTP_201_CREATED)
            self.assertTrue(rep_resp.data["repetition"]["is_valid"])

        session = WandSession.objects.get(id=session_id)
        self.assertEqual(session.status, WandSession.Status.COMPLETED)
        self.assertEqual(session.valid_reps, 2)
        self.assertEqual(WandRepetition.objects.filter(session=session).count(), 2)

    def test_cannot_submit_repetition_to_completed_session(self):
        trainer = make_trainer()
        patient = make_patient()
        exercise = wand_exercise(trainer, target_reps=1)
        self._assign_visible_exercise(exercise, patient, trainer)
        self._create_template(trainer, exercise)

        self.client.force_authenticate(user=patient)
        start = self.client.post("/api/wand/sessions/", {"exercise_id": str(exercise.id)}, format="json")
        session_id = start.data["id"]

        rep_payload = {"frames": make_frames(n=80, duration_ms=1000), "duration_ms": 1000}
        first = self.client.post(f"/api/wand/sessions/{session_id}/repetitions/", rep_payload, format="json")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        second = self.client.post(f"/api/wand/sessions/{session_id}/repetitions/", rep_payload, format="json")
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    def test_session_visibility_scoped_to_patient_and_trainer(self):
        trainer = make_trainer()
        mine = make_patient()
        other = make_patient()
        exercise = wand_exercise(trainer)
        make_wand_template(exercise, created_by=trainer)
        mine_session = make_wand_session(exercise, mine, target_reps=1)
        make_wand_session(exercise, other, target_reps=1)

        self.client.force_authenticate(user=mine)
        resp = self.client.get("/api/wand/sessions/")
        self.assertEqual({row["id"] for row in resp.data}, {str(mine_session.id)})

        self.client.force_authenticate(user=trainer)
        resp = self.client.get("/api/wand/sessions/")
        self.assertEqual(len(resp.data), 2)
