"""Unit tests for the AI assistant: recommender logic and chat endpoints."""
from rest_framework import status
from rest_framework.test import APITestCase
from django.test import SimpleTestCase

from assistant import recommend
from assistant.models import AssistantMessage
from training.models import ProgramAssignment
from factories import make_exercise, make_patient, make_trainer


class RecommendUnitTests(SimpleTestCase):
    """Pure-function tests for the rule-based recommender."""

    def test_detect_body_part(self):
        self.assertEqual(recommend.detect_body_part("my knee hurts"), "KNEE")
        self.assertEqual(recommend.detect_body_part("rotator cuff issue"), "SHOULDER")
        self.assertEqual(recommend.detect_body_part("lumbar pain"), "BACK")
        self.assertIsNone(recommend.detect_body_part("i feel great"))

    def test_detect_pain(self):
        self.assertEqual(recommend.detect_pain("it's about 7/10"), 7)
        self.assertEqual(recommend.detect_pain("pain is 8"), 8)
        self.assertEqual(recommend.detect_pain("pain 15"), 10)  # clamped
        self.assertIsNone(recommend.detect_pain("no numbers here"))

    def test_detect_goal(self):
        self.assertEqual(recommend.detect_goal("I want more mobility"), "mobility")
        self.assertEqual(recommend.detect_goal("need to build strength"), "strength")
        self.assertEqual(recommend.detect_goal("it really hurts"), "pain")
        self.assertIsNone(recommend.detect_goal("hello there"))

    def test_difficulty_pool_by_pain(self):
        self.assertEqual(recommend._difficulty_pool(8), ["EASY"])
        self.assertEqual(recommend._difficulty_pool(5), ["EASY", "MEDIUM"])
        self.assertIn("HARD", recommend._difficulty_pool(1))


class GenerateTests(APITestCase):
    def test_greeting_when_no_history(self):
        reply, proposal = recommend.generate([])
        self.assertIsNone(proposal)
        self.assertIn("assistant", reply.lower())

    def test_asks_for_body_part_when_unknown(self):
        reply, proposal = recommend.generate(["I feel bad today"])
        self.assertIsNone(proposal)
        self.assertIn("area", reply.lower())

    def test_builds_proposal_for_known_body_part(self):
        make_exercise(is_template=True, body_part="KNEE", difficulty="EASY", title="Quad Set")
        make_exercise(is_template=True, body_part="KNEE", difficulty="EASY", title="Heel Slide")
        make_exercise(is_template=True, body_part="KNEE", difficulty="MEDIUM", title="Mini Squat")
        reply, proposal = recommend.generate(["my knee hurts 6/10, want mobility"])
        self.assertIsNotNone(proposal)
        self.assertEqual(proposal["body_part"], "KNEE")
        self.assertEqual(proposal["pain"], 6)
        self.assertTrue(len(proposal["exercises"]) >= 1)

    def test_latest_pain_used_when_not_in_text(self):
        make_exercise(is_template=True, body_part="BACK", difficulty="EASY", title="Cat Cow")
        reply, proposal = recommend.generate(["my back is stiff"], latest_pain=8)
        self.assertEqual(proposal["pain"], 8)


class ChatViewTests(APITestCase):
    def test_empty_message_rejected(self):
        self.client.force_authenticate(user=make_patient())
        resp = self.client.post("/api/assistant/chat/", {"content": "   "}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_chat_persists_user_and_assistant_turns(self):
        patient = make_patient()
        self.client.force_authenticate(user=patient)
        resp = self.client.post(
            "/api/assistant/chat/", {"content": "hello"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["sender"], "assistant")
        self.assertEqual(
            AssistantMessage.objects.filter(user=patient).count(), 2
        )

    def test_messages_list_and_clear(self):
        patient = make_patient()
        AssistantMessage.objects.create(user=patient, sender="user", content="hi")
        self.client.force_authenticate(user=patient)
        self.assertEqual(len(self.client.get("/api/assistant/messages/").data), 1)
        resp = self.client.delete("/api/assistant/messages/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(AssistantMessage.objects.filter(user=patient).count(), 0)


class AcceptPlanTests(APITestCase):
    def test_patient_accepts_plan_creates_program_and_assignment(self):
        patient = make_patient()
        ex = make_exercise(is_template=True, title="Quad Set")
        self.client.force_authenticate(user=patient)
        resp = self.client.post(
            "/api/assistant/accept/",
            {
                "name": "My AI plan",
                "exercises": [{"id": str(ex.id), "sets": 3, "reps": 12}],
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            ProgramAssignment.objects.filter(patient=patient).exists()
        )

    def test_trainer_cannot_accept_plan(self):
        self.client.force_authenticate(user=make_trainer())
        resp = self.client.post(
            "/api/assistant/accept/",
            {"exercises": [{"id": "x"}]},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_empty_exercises_rejected(self):
        self.client.force_authenticate(user=make_patient())
        resp = self.client.post("/api/assistant/accept/", {"exercises": []}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_exercises_rejected(self):
        self.client.force_authenticate(user=make_patient())
        resp = self.client.post(
            "/api/assistant/accept/",
            {"exercises": [{"id": "00000000-0000-0000-0000-000000000000"}]},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
