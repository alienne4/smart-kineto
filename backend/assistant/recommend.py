"""Rule-based physiotherapy assistant.

Analyses the conversation (plus the patient's latest self-assessment) to detect
the affected body part, pain level and goal, then assembles a tailored program
from the curated exercise library. Designed to be swappable with an LLM later:
``generate`` returns a (reply_text, proposal_dict | None) tuple.
"""
import re

from django.db.models import Q

from training.models import BodyPart, Difficulty, Exercise

BODY_PART_KEYWORDS = {
    "SHOULDER": ["shoulder", "rotator", "cuff", "deltoid"],
    "ELBOW": ["elbow", "tennis elbow", "golfer"],
    "WRIST": ["wrist", "hand", "carpal", "forearm"],
    "HIP": ["hip", "groin", "glute"],
    "KNEE": ["knee", "acl", "meniscus", "patella", "kneecap"],
    "ANKLE": ["ankle", "foot", "achilles", "heel", "calf"],
    "BACK": ["back", "spine", "lumbar", "sciatica", "disc"],
    "NECK": ["neck", "cervical", "whiplash"],
}

GOAL_KEYWORDS = {
    "pain": ["pain", "hurt", "ache", "sore"],
    "mobility": ["mobility", "stiff", "flexib", "range", "motion", "bend"],
    "strength": ["strength", "strong", "stable", "weak", "build"],
}

BODY_PART_LABELS = dict(BodyPart.choices)


def detect_body_part(text):
    text = text.lower()
    for part, words in BODY_PART_KEYWORDS.items():
        if any(w in text for w in words):
            return part
    return None


def detect_pain(text):
    """Find an explicit pain rating like 'pain 7' or '8/10'."""
    text = text.lower()
    m = re.search(r"(\d{1,2})\s*/\s*10", text)
    if m:
        return min(10, int(m.group(1)))
    m = re.search(r"pain[^\d]{0,12}(\d{1,2})", text)
    if m:
        return min(10, int(m.group(1)))
    return None


def detect_goal(text):
    text = text.lower()
    for goal, words in GOAL_KEYWORDS.items():
        if any(w in text for w in words):
            return goal
    return None


def _difficulty_pool(pain):
    if pain is None:
        return [Difficulty.EASY, Difficulty.MEDIUM]
    if pain >= 7:
        return [Difficulty.EASY]
    if pain >= 4:
        return [Difficulty.EASY, Difficulty.MEDIUM]
    return [Difficulty.MEDIUM, Difficulty.HARD, Difficulty.EASY]


def _sets_reps(difficulty, pain):
    if pain is not None and pain >= 7:
        return 2, 8
    if difficulty == Difficulty.HARD:
        return 3, 12
    if difficulty == Difficulty.MEDIUM:
        return 3, 10
    return 2, 10


def _pick_exercises(body_part, pain, limit=5):
    """Curated (template/public) exercises for the body part, ranked by difficulty fit."""
    pool = _difficulty_pool(pain)
    base = Exercise.objects.filter(Q(is_template=True) | Q(is_public=True))

    chosen = list(base.filter(body_part=body_part, difficulty__in=pool))
    if len(chosen) < limit:
        extra = base.filter(body_part=body_part).exclude(id__in=[e.id for e in chosen])
        chosen += list(extra)
    if len(chosen) < 3:
        # Not enough for this body part — round out with gentle general work.
        more = base.filter(difficulty=Difficulty.EASY).exclude(id__in=[e.id for e in chosen])
        chosen += list(more)

    # Rank: preferred difficulty first, keep stable order otherwise.
    order = {d: i for i, d in enumerate(pool)}
    chosen.sort(key=lambda e: order.get(e.difficulty, len(pool)))
    return chosen[:limit]


def _exercise_payload(exercises, pain, request=None):
    items = []
    for ex in exercises:
        sets, reps = _sets_reps(ex.difficulty, pain)
        thumb = None
        if ex.thumbnail:
            thumb = request.build_absolute_uri(ex.thumbnail.url) if request else ex.thumbnail.url
        items.append(
            {
                "id": str(ex.id),
                "title": ex.title,
                "body_part": ex.body_part,
                "difficulty": ex.difficulty,
                "sets": sets,
                "reps": reps,
                "thumbnail": thumb,
            }
        )
    return items


def generate(history_texts, latest_pain=None, request=None):
    """Return (reply_text, proposal | None).

    ``history_texts`` is the list of the patient's messages (oldest→newest).
    """
    joined = " ".join(history_texts).strip()
    last = history_texts[-1].lower() if history_texts else ""

    body_part = None
    for t in reversed(history_texts):
        body_part = detect_body_part(t)
        if body_part:
            break

    pain = None
    for t in reversed(history_texts):
        pain = detect_pain(t)
        if pain is not None:
            break
    if pain is None:
        pain = latest_pain

    goal = detect_goal(joined)

    # Greeting / not enough info yet.
    if not joined:
        return (
            "Hi! I'm your SmartKineto assistant. Tell me what's bothering you — "
            "for example: “My right knee hurts, about 6/10, I want to improve mobility.”",
            None,
        )

    if not body_part:
        return (
            "Thanks for sharing. Which area should we focus on — knee, shoulder, back, "
            "hip, ankle, elbow, wrist or neck? And how strong is the pain on a 0–10 scale?",
            None,
        )

    exercises = _pick_exercises(body_part, pain)
    label = BODY_PART_LABELS.get(body_part, body_part.title())

    if not exercises:
        return (
            f"I understand you're dealing with {label.lower()} trouble, but I don't have "
            "suitable exercises in the library yet. Your trainer can build a custom plan for you.",
            None,
        )

    pain_note = ""
    if pain is not None:
        if pain >= 7:
            pain_note = " Since your pain is high, I kept everything gentle and low-rep — stop if anything sharpens."
        elif pain >= 4:
            pain_note = " I balanced gentle and moderate movements for your current pain level."
        else:
            pain_note = " Your pain is low, so I included some strengthening work."

    goal_note = {
        "mobility": " The focus is on restoring range of motion.",
        "strength": " The focus is on rebuilding strength and stability.",
        "pain": " The focus is on easing pain and moving comfortably.",
    }.get(goal, "")

    proposal = {
        "name": f"{label} recovery plan",
        "body_part": body_part,
        "pain": pain,
        "goal": goal,
        "exercises": _exercise_payload(exercises, pain, request),
    }

    reply = (
        f"Based on what you told me about your {label.lower()}, here's a {len(proposal['exercises'])}-exercise "
        f"plan I put together.{pain_note}{goal_note} Review it below and tap “Save & start” to add it to your "
        "programs. You can always ask me to adjust it."
    )
    return reply, proposal
