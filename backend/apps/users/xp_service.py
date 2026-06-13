from django.utils import timezone
from .achievements import ACHIEVEMENTS


def check_and_award_achievements(user, profile):
    from apps.tasks.models import Task
    from apps.habits.models import HabitLog
    from apps.focus.models import FocusSession
    from apps.projects.models import Project
    from .models import UserAchievement

    earned_keys = set(
        UserAchievement.objects.filter(user=user).values_list('key', flat=True)
    )

    to_award = []

    completed_tasks = Task.objects.filter(user=user, status='done').count()
    habit_logs = HabitLog.objects.filter(habit__user=user, completed=True).count()
    focus_sessions = FocusSession.objects.filter(
        user=user, session_type='work', completed=True
    ).count()
    projects = Project.objects.filter(user=user).count()

    # Task achievements
    if completed_tasks >= 1 and 'first_task' not in earned_keys:
        to_award.append('first_task')
    if completed_tasks >= 10 and 'ten_tasks' not in earned_keys:
        to_award.append('ten_tasks')
    if completed_tasks >= 50 and 'fifty_tasks' not in earned_keys:
        to_award.append('fifty_tasks')

    # Habit achievements
    if habit_logs >= 1 and 'first_habit' not in earned_keys:
        to_award.append('first_habit')

    # Habit streak achievements
    from apps.habits.models import Habit
    habits = Habit.objects.filter(user=user, is_active=True).prefetch_related('logs')
    max_streak = 0
    for h in habits:
        streak = 0
        day = timezone.now().date()
        while h.logs.filter(date=day, completed=True).exists():
            streak += 1
            day -= timezone.timedelta(days=1)
        max_streak = max(max_streak, streak)

    if max_streak >= 7 and 'habit_streak_7' not in earned_keys:
        to_award.append('habit_streak_7')
    if max_streak >= 30 and 'habit_streak_30' not in earned_keys:
        to_award.append('habit_streak_30')

    # Focus achievements
    if focus_sessions >= 1 and 'first_focus' not in earned_keys:
        to_award.append('first_focus')
    if focus_sessions >= 10 and 'ten_focus' not in earned_keys:
        to_award.append('ten_focus')

    # Project achievements
    if projects >= 1 and 'first_project' not in earned_keys:
        to_award.append('first_project')

    # Level achievements
    if profile.level >= 5 and 'level_5' not in earned_keys:
        to_award.append('level_5')
    if profile.level >= 10 and 'level_10' not in earned_keys:
        to_award.append('level_10')

    # Award everything earned
    achievement_map = {a['key']: a for a in ACHIEVEMENTS}
    for key in to_award:
        achievement = achievement_map.get(key)
        if achievement:
            UserAchievement.objects.create(user=user, key=key)
            profile.add_xp(achievement['xp_reward'])

    return to_award