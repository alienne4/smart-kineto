"""Unit tests for the training app: exercises, programs and assignments."""
from rest_framework import status
from rest_framework.test import APITestCase

from notifications.models import Notification
from training.models import (
    Exercise,
    ProgramAssignment,
    ProgramExercise,
    ReviewStatus,
    TrainingProgram,
)
from factories import (
    assign_program,
    make_exercise,
    make_patient,
    make_program,
    make_trainer,
)


class ExerciseVisibilityTests(APITestCase):
    def test_trainer_sees_own_template_and_public(self):
        trainer = make_trainer()
        own = make_exercise(created_by=trainer, title="Own")
        template = make_exercise(is_template=True, title="Template")
        public = make_exercise(is_public=True, title="Public")
        other = make_exercise(created_by=make_trainer(), title="Other private")
        self.client.force_authenticate(user=trainer)
        resp = self.client.get("/api/exercises/")
        ids = {row["id"] for row in resp.data}
        self.assertEqual(ids, {str(own.id), str(template.id), str(public.id)})
        self.assertNotIn(str(other.id), ids)

    def test_patient_sees_only_assigned_program_exercises(self):
        trainer = make_trainer()
        patient = make_patient()
        ex_assigned = make_exercise(created_by=trainer, title="Assigned")
        ex_unassigned = make_exercise(created_by=trainer, title="Unassigned")
        program = make_program(created_by=trainer, exercises=[ex_assigned])
        assign_program(program, patient, assigned_by=trainer)
        self.client.force_authenticate(user=patient)
        resp = self.client.get("/api/exercises/")
        ids = {row["id"] for row in resp.data}
        self.assertEqual(ids, {str(ex_assigned.id)})
        self.assertNotIn(str(ex_unassigned.id), ids)


class ExercisePermissionTests(APITestCase):
    def test_trainer_can_create_exercise(self):
        trainer = make_trainer()
        self.client.force_authenticate(user=trainer)
        resp = self.client.post(
            "/api/exercises/",
            {"title": "New", "body_part": "KNEE", "difficulty": "EASY"},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        ex = Exercise.objects.get(id=resp.data["id"])
        self.assertEqual(ex.created_by_id, trainer.id)
        self.assertFalse(ex.is_template)

    def test_patient_cannot_create_exercise(self):
        self.client.force_authenticate(user=make_patient())
        resp = self.client.post("/api/exercises/", {"title": "Nope"})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_list(self):
        self.assertEqual(self.client.get("/api/exercises/").status_code, 401)

    def test_cannot_edit_others_visible_exercise(self):
        # A public exercise is visible to every trainer, but only the owner may edit it.
        owner = make_trainer()
        ex = make_exercise(created_by=owner, is_public=True, title="Shared")
        self.client.force_authenticate(user=make_trainer())
        resp = self.client.patch(f"/api/exercises/{ex.id}/", {"title": "Hacked"})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_edit_hidden_exercise_returns_404(self):
        # Another trainer's private exercise isn't even visible -> 404.
        ex = make_exercise(created_by=make_trainer(), title="Owned")
        self.client.force_authenticate(user=make_trainer())
        resp = self.client.patch(f"/api/exercises/{ex.id}/", {"title": "Hacked"})
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_delete_others_exercise(self):
        owner = make_trainer()
        ex = make_exercise(created_by=owner)
        self.client.force_authenticate(user=make_trainer())
        # not visible to this trainer at all -> 404 (queryset excludes it)
        resp = self.client.delete(f"/api/exercises/{ex.id}/")
        self.assertIn(resp.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))


class ExerciseActionTests(APITestCase):
    def test_publish_sets_pending(self):
        trainer = make_trainer()
        ex = make_exercise(created_by=trainer)
        self.client.force_authenticate(user=trainer)
        resp = self.client.post(f"/api/exercises/{ex.id}/publish/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ex.refresh_from_db()
        self.assertEqual(ex.review_status, ReviewStatus.PENDING)

    def test_clone_creates_owned_copy(self):
        template = make_exercise(is_template=True, title="Library Move")
        trainer = make_trainer()
        self.client.force_authenticate(user=trainer)
        resp = self.client.post(f"/api/exercises/{template.id}/clone/")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        copy = Exercise.objects.get(id=resp.data["id"])
        self.assertEqual(copy.created_by_id, trainer.id)
        self.assertFalse(copy.is_template)
        self.assertIn("copy", copy.title)


class ProgramTests(APITestCase):
    def test_create_program_with_nested_exercises(self):
        trainer = make_trainer()
        ex1 = make_exercise(created_by=trainer, title="E1")
        ex2 = make_exercise(created_by=trainer, title="E2")
        self.client.force_authenticate(user=trainer)
        payload = {
            "name": "My Program",
            "description": "desc",
            "program_exercises": [
                {"exercise_id": str(ex1.id), "order": 0, "sets": 3, "reps": 12},
                {"exercise_id": str(ex2.id), "order": 1, "sets": 2, "reps": 10},
            ],
        }
        resp = self.client.post("/api/programs/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        program = TrainingProgram.objects.get(id=resp.data["id"])
        self.assertEqual(program.created_by_id, trainer.id)
        self.assertEqual(program.program_exercises.count(), 2)
        self.assertEqual(resp.data["exercise_count"], 2)

    def test_patient_cannot_create_program(self):
        self.client.force_authenticate(user=make_patient())
        resp = self.client.post("/api/programs/", {"name": "x"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_public_action_lists_templates_and_public(self):
        trainer = make_trainer()
        make_program(created_by=trainer, is_template=True, name="Tmpl")
        make_program(created_by=trainer, is_public=True, name="Pub")
        make_program(created_by=trainer, name="Private")
        self.client.force_authenticate(user=make_patient())
        resp = self.client.get("/api/programs/public/")
        names = {row["name"] for row in resp.data}
        self.assertEqual(names, {"Tmpl", "Pub"})

    def test_clone_program_copies_exercises(self):
        trainer = make_trainer()
        ex = make_exercise(created_by=trainer)
        src = make_program(created_by=trainer, exercises=[ex], name="Src")
        self.client.force_authenticate(user=trainer)
        resp = self.client.post(f"/api/programs/{src.id}/clone/")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        copy = TrainingProgram.objects.get(id=resp.data["id"])
        self.assertEqual(copy.program_exercises.count(), 1)
        self.assertNotEqual(copy.id, src.id)


class SelfAssignTests(APITestCase):
    def test_patient_self_assigns_public_program(self):
        program = make_program(is_public=True, name="Public Plan")
        patient = make_patient()
        self.client.force_authenticate(user=patient)
        resp = self.client.post(f"/api/programs/{program.id}/self_assign/")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            ProgramAssignment.objects.filter(program=program, patient=patient).exists()
        )

    def test_self_assign_is_idempotent(self):
        program = make_program(is_template=True)
        patient = make_patient()
        self.client.force_authenticate(user=patient)
        first = self.client.post(f"/api/programs/{program.id}/self_assign/")
        second = self.client.post(f"/api/programs/{program.id}/self_assign/")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(
            ProgramAssignment.objects.filter(program=program, patient=patient).count(), 1
        )

    def test_cannot_self_assign_private_program(self):
        program = make_program(created_by=make_trainer(), name="Private")
        patient = make_patient()
        self.client.force_authenticate(user=patient)
        resp = self.client.post(f"/api/programs/{program.id}/self_assign/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_trainer_cannot_self_assign(self):
        program = make_program(is_public=True)
        self.client.force_authenticate(user=make_trainer())
        resp = self.client.post(f"/api/programs/{program.id}/self_assign/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class AssignmentTests(APITestCase):
    def test_trainer_assigns_program_and_notifies_patient(self):
        trainer = make_trainer()
        patient = make_patient()
        program = make_program(created_by=trainer, name="Assigned Plan")
        self.client.force_authenticate(user=trainer)
        resp = self.client.post(
            "/api/assignments/",
            {"program_id": str(program.id), "patient_id": str(patient.id)},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        assignment = ProgramAssignment.objects.get(id=resp.data["id"])
        self.assertEqual(assignment.assigned_by_id, trainer.id)
        self.assertTrue(
            Notification.objects.filter(recipient=patient, type="assignment").exists()
        )

    def test_patient_cannot_create_assignment(self):
        patient = make_patient()
        program = make_program(is_public=True)
        self.client.force_authenticate(user=patient)
        resp = self.client.post(
            "/api/assignments/",
            {"program_id": str(program.id), "patient_id": str(patient.id)},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_patient_completes_assignment_and_notifies_trainer(self):
        trainer = make_trainer()
        patient = make_patient()
        program = make_program(created_by=trainer, name="Plan")
        assignment = assign_program(program, patient, assigned_by=trainer)
        self.client.force_authenticate(user=patient)
        resp = self.client.post(f"/api/assignments/{assignment.id}/complete/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        assignment.refresh_from_db()
        self.assertEqual(assignment.status, ProgramAssignment.Status.COMPLETED)
        self.assertTrue(
            Notification.objects.filter(recipient=trainer, type="progress").exists()
        )

    def test_patient_sees_only_own_assignments(self):
        trainer = make_trainer()
        mine = make_patient()
        other = make_patient()
        program = make_program(created_by=trainer)
        assign_program(program, mine, assigned_by=trainer)
        assign_program(make_program(created_by=trainer), other, assigned_by=trainer)
        self.client.force_authenticate(user=mine)
        resp = self.client.get("/api/assignments/")
        self.assertEqual(len(resp.data), 1)
