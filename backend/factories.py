"""Lightweight object factories shared across the test suite.

Kept dependency-free (no ``factory_boy``) so the suite runs with only the
project's runtime requirements plus the stdlib test runner.
"""
import itertools

from django.contrib.auth import get_user_model

from training.models import (
    Exercise,
    ProgramAssignment,
    ProgramExercise,
    TrainingProgram,
)

User = get_user_model()

_counter = itertools.count(1)


def _unique_email(prefix):
    return f"{prefix}{next(_counter)}@example.com"


def make_trainer(email=None, password="S3cret!pass", **extra):
    return User.objects.create_user(
        email=email or _unique_email("trainer"),
        password=password,
        role="TRAINER",
        full_name=extra.pop("full_name", "Test Trainer"),
        **extra,
    )


def make_patient(email=None, password="S3cret!pass", **extra):
    return User.objects.create_user(
        email=email or _unique_email("patient"),
        password=password,
        role="PATIENT",
        full_name=extra.pop("full_name", "Test Patient"),
        **extra,
    )


def make_admin(email=None, password="S3cret!pass", **extra):
    return User.objects.create_superuser(
        email=email or _unique_email("admin"),
        password=password,
        **extra,
    )


def assign_trainer(patient, trainer):
    """Link ``patient`` to ``trainer`` (creating the profile if needed)."""
    from accounts.models import PatientProfile

    profile, _ = PatientProfile.objects.get_or_create(user=patient)
    profile.assigned_trainer = trainer
    profile.save()
    return profile


def make_exercise(created_by=None, *, is_template=False, is_public=False, **extra):
    defaults = {
        "title": extra.pop("title", "Test Exercise"),
        "body_part": extra.pop("body_part", "KNEE"),
        "difficulty": extra.pop("difficulty", "EASY"),
    }
    defaults.update(extra)
    return Exercise.objects.create(
        created_by=created_by,
        is_template=is_template,
        is_public=is_public,
        **defaults,
    )


def make_program(created_by=None, *, is_template=False, is_public=False, exercises=None, **extra):
    program = TrainingProgram.objects.create(
        created_by=created_by,
        is_template=is_template,
        is_public=is_public,
        name=extra.pop("name", "Test Program"),
        description=extra.pop("description", ""),
        **extra,
    )
    for idx, ex in enumerate(exercises or []):
        ProgramExercise.objects.create(program=program, exercise=ex, order=idx)
    return program


def assign_program(program, patient, assigned_by=None):
    return ProgramAssignment.objects.create(
        program=program, patient=patient, assigned_by=assigned_by
    )
