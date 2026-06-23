"""Populate the database with a predefined library of exercises and programs.

Idempotent: safe to run multiple times. Library items are templates
(``is_template=True``) owned by the system (``created_by=None``) and are
visible to every trainer.

Usage:
    python manage.py seed_library
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from training.models import Exercise, ProgramExercise, TrainingProgram

# title -> (body_part, difficulty, description)
EXERCISES = {
    # Shoulder
    "Pendulum Swing": ("SHOULDER", "EASY", "Lean forward, let the arm hang and gently swing it in small circles. Relaxes the shoulder joint."),
    "Shoulder External Rotation": ("SHOULDER", "MEDIUM", "Elbow tucked at 90°, rotate the forearm outward against light resistance. Keep shoulder blade down."),
    "Wall Slides": ("SHOULDER", "MEDIUM", "Back against the wall, slide arms up and down keeping contact. Builds scapular control."),
    "Scapular Squeeze": ("SHOULDER", "EASY", "Squeeze shoulder blades together and hold 5s. Improves posture and stability."),
    # Knee
    "Quad Sets": ("KNEE", "EASY", "Sit with leg straight, tighten the thigh and press the knee down. Hold 5s, relax."),
    "Straight Leg Raise": ("KNEE", "MEDIUM", "Lying down, keep knee locked and lift the leg to 45°. Strengthens the quadriceps."),
    "Heel Slides": ("KNEE", "EASY", "Slide the heel toward the buttock to bend the knee, then straighten. Restores range of motion."),
    "Mini Squats": ("KNEE", "MEDIUM", "Feet shoulder-width, bend knees to 30–45° keeping them behind the toes."),
    # Hip
    "Glute Bridge": ("HIP", "MEDIUM", "Lying on back, knees bent, lift hips until body forms a straight line. Squeeze glutes at top."),
    "Clamshell": ("HIP", "EASY", "Side-lying, knees bent, open the top knee like a clam keeping feet together."),
    "Hip Abduction": ("HIP", "MEDIUM", "Side-lying, lift the top leg straight up and lower slowly. Strengthens hip abductors."),
    # Back
    "Cat-Cow Stretch": ("BACK", "EASY", "On hands and knees, alternate arching and rounding the spine with the breath."),
    "Bird Dog": ("BACK", "MEDIUM", "On all fours, extend opposite arm and leg, hold, then switch. Builds core/back stability."),
    "Pelvic Tilt": ("BACK", "EASY", "Lying on back, flatten the lower back into the floor by tilting the pelvis."),
    # Ankle
    "Ankle Pumps": ("ANKLE", "EASY", "Point and flex the foot repeatedly. Improves circulation and mobility."),
    "Calf Raises": ("ANKLE", "MEDIUM", "Stand and rise onto the toes, hold briefly, lower with control."),
    # Neck
    "Chin Tucks": ("NECK", "EASY", "Gently draw the chin straight back making a 'double chin'. Hold 5s."),
    "Neck Rotation": ("NECK", "EASY", "Slowly turn the head side to side within a comfortable range."),
    # Elbow / Wrist
    "Wrist Flexion/Extension": ("WRIST", "EASY", "Bend the wrist up and down with the forearm supported."),
    "Elbow Curls": ("ELBOW", "MEDIUM", "Curl a light weight bending at the elbow. Controlled tempo, full range."),
}

# program name -> (description, [exercise titles])
PROGRAMS = {
    "Shoulder Recovery — Phase 1": (
        "Gentle early-stage shoulder mobility and activation.",
        ["Pendulum Swing", "Scapular Squeeze", "Wall Slides", "Shoulder External Rotation"],
    ),
    "Knee Rehab — Foundations": (
        "Restore quad strength and knee range of motion after injury.",
        ["Quad Sets", "Heel Slides", "Straight Leg Raise", "Mini Squats"],
    ),
    "Hip Stability Builder": (
        "Strengthen glutes and hip abductors for better stability.",
        ["Glute Bridge", "Clamshell", "Hip Abduction"],
    ),
    "Lower Back Care": (
        "Mobilize and stabilize the lumbar spine and core.",
        ["Cat-Cow Stretch", "Pelvic Tilt", "Bird Dog"],
    ),
    "Daily Mobility Reset": (
        "A quick full-body mobility routine for any day.",
        ["Ankle Pumps", "Calf Raises", "Chin Tucks", "Cat-Cow Stretch"],
    ),
}


class Command(BaseCommand):
    help = "Seed predefined library exercises and programs (idempotent)."

    @transaction.atomic
    def handle(self, *args, **options):
        created_ex = 0
        ex_by_title = {}
        for title, (body_part, difficulty, desc) in EXERCISES.items():
            obj, created = Exercise.objects.get_or_create(
                title=title,
                is_template=True,
                defaults={
                    "body_part": body_part,
                    "difficulty": difficulty,
                    "description": desc,
                    "created_by": None,
                },
            )
            ex_by_title[title] = obj
            created_ex += int(created)

        created_pr = 0
        for name, (desc, titles) in PROGRAMS.items():
            program, created = TrainingProgram.objects.get_or_create(
                name=name,
                is_template=True,
                defaults={"description": desc, "created_by": None},
            )
            created_pr += int(created)
            if created:
                for idx, t in enumerate(titles):
                    ex = ex_by_title.get(t)
                    if ex:
                        ProgramExercise.objects.get_or_create(
                            program=program,
                            exercise=ex,
                            defaults={"order": idx, "sets": 3, "reps": 10},
                        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Library seeded: +{created_ex} exercises, +{created_pr} programs "
                f"({len(EXERCISES)} exercises / {len(PROGRAMS)} programs total defined)."
            )
        )
