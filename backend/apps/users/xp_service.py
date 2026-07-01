from django.utils import timezone
from .achievements import ACHIEVEMENTS


def check_and_award_achievements(user, profile):
    from apps.tasks.models import Task
    from apps.habits.models import Habit, HabitLog
    from apps.focus.models import FocusSession
    from apps.projects.models import Project
    from apps.notes.models import Note
    from .models import UserAchievement
    from django.db.models import Sum

    earned_keys = set(
        UserAchievement.objects.filter(user=user).values_list('key', flat=True)
    )

    to_award = []

    # ── Counts ────────────────────────────────────────────────────────────────
    completed_tasks = Task.objects.filter(user=user, status='done').count()
    urgent_completed = Task.objects.filter(
        user=user, status='done', priority='urgent'
    ).count()
    starred_completed = Task.objects.filter(
        user=user, status='done', is_starred=True
    ).count()
    habit_logs = HabitLog.objects.filter(habit__user=user, completed=True).count()
    total_habits = Habit.objects.filter(user=user, is_active=True).count()
    focus_sessions = FocusSession.objects.filter(
        user=user, session_type='work', completed=True
    ).count()
    focus_minutes = FocusSession.objects.filter(
        user=user, session_type='work', completed=True
    ).aggregate(total=Sum('duration_minutes'))['total'] or 0
    projects = Project.objects.filter(user=user).count()
    completed_projects = Project.objects.filter(user=user, status='completed').count()
    notes = Note.objects.filter(user=user).count()
    linked_notes = Note.objects.filter(
        user=user
    ).exclude(task=None).count() + Note.objects.filter(
        user=user
    ).exclude(project=None).count()

    # ── Task achievements ─────────────────────────────────────────────────────
    if completed_tasks >= 1 and 'first_task' not in earned_keys:
        to_award.append('first_task')
    if completed_tasks >= 10 and 'ten_tasks' not in earned_keys:
        to_award.append('ten_tasks')
    if completed_tasks >= 50 and 'fifty_tasks' not in earned_keys:
        to_award.append('fifty_tasks')
    if completed_tasks >= 100 and 'hundred_tasks' not in earned_keys:
        to_award.append('hundred_tasks')
    if urgent_completed >= 5 and 'urgent_finisher' not in earned_keys:
        to_award.append('urgent_finisher')
    if starred_completed >= 3 and 'starred_completer' not in earned_keys:
        to_award.append('starred_completer')

    # ── Habit achievements ────────────────────────────────────────────────────
    if habit_logs >= 1 and 'first_habit' not in earned_keys:
        to_award.append('first_habit')
    if total_habits >= 5 and 'habit_variety' not in earned_keys:
        to_award.append('habit_variety')

    habits = Habit.objects.filter(
        user=user, is_active=True
    ).prefetch_related('logs')

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

    # Check perfect week — all habits completed every day for 7 days
    if total_habits > 0 and 'perfect_week' not in earned_keys:
        today = timezone.now().date()
        perfect = True
        for i in range(7):
            day = today - timezone.timedelta(days=i)
            completed_that_day = HabitLog.objects.filter(
                habit__user=user,
                date=day,
                completed=True,
            ).values('habit').distinct().count()
            if completed_that_day < total_habits:
                perfect = False
                break
        if perfect:
            to_award.append('perfect_week')

    # ── Focus achievements ────────────────────────────────────────────────────
    if focus_sessions >= 1 and 'first_focus' not in earned_keys:
        to_award.append('first_focus')
    if focus_sessions >= 10 and 'ten_focus' not in earned_keys:
        to_award.append('ten_focus')
    if focus_sessions >= 50 and 'fifty_focus' not in earned_keys:
        to_award.append('fifty_focus')
    if focus_minutes >= 300 and 'focus_five_hours' not in earned_keys:
        to_award.append('focus_five_hours')
    if focus_minutes >= 1200 and 'focus_twenty_hours' not in earned_keys:
        to_award.append('focus_twenty_hours')

    # Focus daily streak
    if 'focus_daily_streak_5' not in earned_keys:
        today = timezone.now().date()
        focus_streak = 0
        for i in range(5):
            day = today - timezone.timedelta(days=i)
            if FocusSession.objects.filter(
                user=user,
                session_type='work',
                completed=True,
                started_at__date=day,
            ).exists():
                focus_streak += 1
            else:
                break
        if focus_streak >= 5:
            to_award.append('focus_daily_streak_5')

    # ── Project achievements ───────────────────────────────────────────────────
    if projects >= 1 and 'first_project' not in earned_keys:
        to_award.append('first_project')
    if completed_projects >= 1 and 'first_project_completed' not in earned_keys:
        to_award.append('first_project_completed')
    if projects >= 5 and 'five_projects' not in earned_keys:
        to_award.append('five_projects')

    # ── Notes achievements ────────────────────────────────────────────────────
    if notes >= 1 and 'first_note' not in earned_keys:
        to_award.append('first_note')
    if notes >= 10 and 'ten_notes' not in earned_keys:
        to_award.append('ten_notes')
    if linked_notes >= 1 and 'linked_note' not in earned_keys:
        to_award.append('linked_note')

    # ── Level achievements ─────────────────────────────────────────────────────
    if profile.level >= 5 and 'level_5' not in earned_keys:
        to_award.append('level_5')
    if profile.level >= 10 and 'level_10' not in earned_keys:
        to_award.append('level_10')
    if profile.level >= 20 and 'level_20' not in earned_keys:
        to_award.append('level_20')

    # ── Award ─────────────────────────────────────────────────────────────────
    achievement_map = {a['key']: a for a in ACHIEVEMENTS}
    for key in to_award:
        achievement = achievement_map.get(key)
        if achievement:
            UserAchievement.objects.get_or_create(user=user, key=key)
            profile.add_xp(achievement['xp_reward'])

    return to_award