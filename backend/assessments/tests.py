"""Unit tests for the assessments app."""
from rest_framework import status
from rest_framework.test import APITestCase

from assessments.models import Assessment
from factories import assign_trainer, make_patient, make_trainer


class AssessmentTests(APITestCase):
    def test_patient_submits_assessment(self):
        patient = make_patient()
        self.client.force_authenticate(user=patient)
        resp = self.client.post(
            "/api/assessments/",
            {"pain_level": 5, "mobility_score": 7, "notes": "stiff morning"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        a = Assessment.objects.get(id=resp.data["id"])
        self.assertEqual(a.patient_id, patient.id)
        self.assertEqual(a.pain_level, 5)

    def test_trainer_cannot_submit_assessment(self):
        self.client.force_authenticate(user=make_trainer())
        resp = self.client.post(
            "/api/assessments/",
            {"pain_level": 5, "mobility_score": 7},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_pain_level_out_of_range_rejected(self):
        self.client.force_authenticate(user=make_patient())
        resp = self.client.post(
            "/api/assessments/",
            {"pain_level": 99, "mobility_score": 5},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patient_sees_only_own_assessments(self):
        patient = make_patient()
        other = make_patient()
        Assessment.objects.create(patient=patient, pain_level=3, mobility_score=8)
        Assessment.objects.create(patient=other, pain_level=4, mobility_score=6)
        self.client.force_authenticate(user=patient)
        resp = self.client.get("/api/assessments/")
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["patient"]["id"], str(patient.id))

    def test_trainer_sees_linked_patients_assessments(self):
        trainer = make_trainer()
        linked = make_patient()
        unlinked = make_patient()
        assign_trainer(linked, trainer)
        Assessment.objects.create(patient=linked, pain_level=2, mobility_score=9)
        Assessment.objects.create(patient=unlinked, pain_level=6, mobility_score=4)
        self.client.force_authenticate(user=trainer)
        resp = self.client.get("/api/assessments/")
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["patient"]["id"], str(linked.id))

    def test_trainer_can_filter_by_patient(self):
        trainer = make_trainer()
        p1 = make_patient()
        p2 = make_patient()
        assign_trainer(p1, trainer)
        assign_trainer(p2, trainer)
        Assessment.objects.create(patient=p1, pain_level=1, mobility_score=9)
        Assessment.objects.create(patient=p2, pain_level=8, mobility_score=2)
        self.client.force_authenticate(user=trainer)
        resp = self.client.get("/api/assessments/", {"patient": str(p2.id)})
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["patient"]["id"], str(p2.id))

    def test_requires_authentication(self):
        self.assertEqual(self.client.get("/api/assessments/").status_code, 401)
