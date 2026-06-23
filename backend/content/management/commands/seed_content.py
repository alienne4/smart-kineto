"""Seed dummy news and events for the home feed (idempotent)."""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from content.models import Announcement

A = Announcement.Audience
K = Announcement.Kind

ITEMS = [
    {
        "kind": K.NEWS, "audience": A.ALL, "pinned": True,
        "title": "Welcome to SmartKineto 2.0",
        "body": "A fresh new look, a library of ready-made programs, and in-app messaging with your trainer. Explore the new tabs below!",
        "image_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1000&q=80",
    },
    {
        "kind": K.EVENT, "audience": A.ALL, "pinned": False,
        "title": "Live Mobility Workshop",
        "body": "Join our physiotherapists for a free guided full-body mobility session. Bring a mat and water.",
        "location": "Online · Zoom",
        "days": 5,
        "image_url": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1000&q=80",
    },
    {
        "kind": K.NEWS, "audience": A.PATIENTS, "pinned": False,
        "title": "Tip: Consistency beats intensity",
        "body": "Short daily sessions help recovery more than occasional long ones. Log a quick check-in each day to track how you feel.",
        "image_url": "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=1000&q=80",
    },
    {
        "kind": K.EVENT, "audience": A.PATIENTS, "pinned": False,
        "title": "Community Walk & Stretch",
        "body": "A gentle group walk followed by guided stretching. All recovery levels welcome.",
        "location": "City Park, Main Entrance",
        "days": 10,
        "image_url": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1000&q=80",
    },
    {
        "kind": K.NEWS, "audience": A.TRAINERS, "pinned": False,
        "title": "New: publish your programs",
        "body": "You can now submit your best exercises and programs for review. Once approved, they appear in the public library for every trainer.",
        "image_url": "https://images.unsplash.com/photo-1554344728-77cf90d9ed26?w=1000&q=80",
    },
    {
        "kind": K.EVENT, "audience": A.TRAINERS, "pinned": False,
        "title": "Trainer Roundtable: Rehab Best Practices",
        "body": "Monthly knowledge-share with fellow trainers. This month: shoulder rehab protocols.",
        "location": "SmartKineto HQ + Online",
        "days": 14,
        "image_url": "https://images.unsplash.com/photo-1591291621164-2c6367723315?w=1000&q=80",
    },
]


class Command(BaseCommand):
    help = "Seed dummy news & events (idempotent)."

    def handle(self, *args, **options):
        now = timezone.now()
        created = 0
        for item in ITEMS:
            days = item.pop("days", None)
            defaults = {
                "kind": item["kind"],
                "audience": item["audience"],
                "body": item["body"],
                "image_url": item.get("image_url", ""),
                "location": item.get("location", ""),
                "pinned": item.get("pinned", False),
                "published": True,
                "event_date": (now + timedelta(days=days)) if days else None,
            }
            obj, was_created = Announcement.objects.get_or_create(
                title=item["title"], defaults=defaults
            )
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"Content seeded: +{created} (of {len(ITEMS)} defined)."))
