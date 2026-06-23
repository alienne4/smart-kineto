from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import PatientProfile, Role, TrainerProfile, User


@receiver(post_save, sender=User)
def create_profile_for_user(sender, instance, created, **kwargs):
    """Ensure every user has the matching profile for their role."""
    if not created:
        return
    if instance.role == Role.TRAINER:
        TrainerProfile.objects.get_or_create(user=instance)
    elif instance.role == Role.PATIENT:
        PatientProfile.objects.get_or_create(user=instance)
