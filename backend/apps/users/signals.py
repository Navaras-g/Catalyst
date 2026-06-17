from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, UserProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


def award_xp(user, amount, check_achievements=True):
    try:
        profile = user.profile
        profile.add_xp(amount)
        if check_achievements:
            from .xp_service import check_and_award_achievements
            check_and_award_achievements(user, profile)
    except Exception:
        pass


# ─── Task completed ───────────────────────────────────────────────────────────
def setup_task_signals():
    from apps.tasks.models import Task

    @receiver(post_save, sender=Task)
    def on_task_save(sender, instance, created, **kwargs):
        if not created and instance.status == 'done':
            xp = 25 if instance.priority == 'urgent' else 10
            award_xp(instance.user, xp)


# ─── Habit logged ─────────────────────────────────────────────────────────────
def setup_habit_signals():
    from apps.habits.models import HabitLog

    @receiver(post_save, sender=HabitLog)
    def on_habit_log(sender, instance, created, **kwargs):
        if created and instance.completed:
            award_xp(instance.habit.user, 5)


# ─── Focus session completed ──────────────────────────────────────────────────
def setup_focus_signals():
    from apps.focus.models import FocusSession

    @receiver(post_save, sender=FocusSession)
    def on_focus_session(sender, instance, created, **kwargs):
        if not created and instance.completed and instance.session_type == 'work':
            award_xp(instance.user, 15)


