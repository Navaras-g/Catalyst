from django.utils import timezone
from collections import defaultdict


def get_productivity_insights(user) -> list[dict]:
    from apps.tasks.models import Task
    from apps.habits.models import Habit, HabitLog
    from apps.focus.models import FocusSession

    insights = []
    today = timezone.now().date()

    total_tasks = Task.objects.filter(user=user).count()
    if total_tasks < 5:
        return [{
            'type': 'info',
            'icon': 'rocket',
            'title': 'Keep going',
            'description': 'Complete a few more tasks and habits — your personal insights will appear here.',
            'value': None,
            'trend': 'neutral',
        }]

    completed_tasks = Task.objects.filter(user=user, status='done')

    # ─── 1. Best day of week ──────────────────────────────────────────────────
    if completed_tasks.count() >= 5:
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        day_counts = defaultdict(int)
        for dt in completed_tasks.values_list('updated_at', flat=True):
            day_counts[dt.weekday()] += 1

        if day_counts:
            best_day = max(day_counts, key=day_counts.get)
            total_completions = sum(day_counts.values())
            days_with_data = len(day_counts)
            avg = total_completions / max(days_with_data, 1)
            best_count = day_counts[best_day]

            if best_count > avg * 1.4:
                pct_above = round(((best_count - avg) / avg) * 100)
                insights.append({
                    'type': 'peak_day',
                    'icon': 'calendar',
                    'title': f'{day_names[best_day]} is your power day',
                    'description': f'You complete {pct_above}% more tasks on {day_names[best_day]}s than your daily average. Schedule your hardest work then.',
                    'value': day_names[best_day][:3],
                    'trend': 'up',
                })

    # ─── 2. Peak time of day ──────────────────────────────────────────────────
    if completed_tasks.count() >= 8:
        time_buckets = defaultdict(int)
        for dt in completed_tasks.values_list('updated_at', flat=True):
            hour = dt.hour
            if 5 <= hour < 12:
                time_buckets['Morning'] += 1
            elif 12 <= hour < 17:
                time_buckets['Afternoon'] += 1
            elif 17 <= hour < 21:
                time_buckets['Evening'] += 1
            else:
                time_buckets['Night'] += 1

        if time_buckets:
            best_time = max(time_buckets, key=time_buckets.get)
            total = sum(time_buckets.values())
            pct = round((time_buckets[best_time] / total) * 100)
            if pct >= 40:
                insights.append({
                    'type': 'peak_time',
                    'icon': 'sun',
                    'title': f'You peak in the {best_time.lower()}',
                    'description': f'{pct}% of your completed tasks happen in the {best_time.lower()}. Block this time for deep work.',
                    'value': best_time,
                    'trend': 'up',
                })

    # ─── 3. Focus impact ─────────────────────────────────────────────────────
    focus_sessions_with_tasks = FocusSession.objects.filter(
        user=user,
        session_type='work',
        completed=True,
        task__isnull=False,
    ).select_related('task')

    if focus_sessions_with_tasks.count() >= 3:
        task_ids_with_focus = list(
            focus_sessions_with_tasks.values_list('task_id', flat=True).distinct()
        )
        completed_with_focus = Task.objects.filter(
            id__in=task_ids_with_focus,
            status='done',
            user=user,
        ).count()
        total_with_focus = len(set(task_ids_with_focus))

        if total_with_focus > 0:
            focus_rate = round((completed_with_focus / total_with_focus) * 100)
            overall_rate = round(
                (completed_tasks.count() / max(total_tasks, 1)) * 100
            )
            if focus_rate > overall_rate + 15:
                insights.append({
                    'type': 'focus_impact',
                    'icon': 'zap',
                    'title': 'Focus sessions drive results',
                    'description': f'Tasks linked to a focus session complete at {focus_rate}% vs {overall_rate}% overall. The timer is working.',
                    'value': f'+{focus_rate - overall_rate}%',
                    'trend': 'up',
                })

    # ─── 4. Habit consistency ─────────────────────────────────────────────────
    habits = Habit.objects.filter(
        user=user, is_active=True
    ).prefetch_related('logs')

    if habits.count() >= 1:
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        weekday_completions = defaultdict(int)
        weekday_totals = defaultdict(int)

        for habit in habits:
            for log in habit.logs.filter(completed=True):
                weekday_completions[log.date.weekday()] += 1
            start = habit.created_at.date()
            delta = today - start
            for i in range(delta.days + 1):
                d = start + timezone.timedelta(days=i)
                weekday_totals[d.weekday()] += 1

        rates = {
            day: weekday_completions[day] / weekday_totals[day]
            for day in range(7)
            if weekday_totals[day] > 0
        }

        if rates:
            best_habit_day = max(rates, key=rates.get)
            worst_habit_day = min(rates, key=rates.get)
            best_rate = rates[best_habit_day]
            worst_rate = rates[worst_habit_day]

            if best_rate > 0.6 and worst_rate < 0.5 and (best_rate - worst_rate) > 0.2:
                insights.append({
                    'type': 'habit_pattern',
                    'icon': 'flame',
                    'title': f'Watch out for {day_names[worst_habit_day]}s',
                    'description': f'Your habit completion drops to {round(worst_rate * 100)}% on {day_names[worst_habit_day]}s vs {round(best_rate * 100)}% on {day_names[best_habit_day]}s.',
                    'value': f'{round(worst_rate * 100)}%',
                    'trend': 'down',
                })

    # ─── 5. Recent consistency ────────────────────────────────────────────────
    active_days = sum(
        1 for i in range(14)
        if Task.objects.filter(
            user=user,
            status='done',
            updated_at__date=today - timezone.timedelta(days=i),
        ).exists()
    )

    consistency = round((active_days / 14) * 100)
    if consistency >= 70:
        insights.append({
            'type': 'consistency',
            'icon': 'trending_up',
            'title': 'On a solid streak',
            'description': f'Active {active_days} of the last 14 days. Consistency like this compounds — keep it going.',
            'value': f'{active_days}/14',
            'trend': 'up',
        })
    elif consistency < 35 and total_tasks > 10:
        insights.append({
            'type': 'consistency',
            'icon': 'trending_down',
            'title': 'Activity has been low',
            'description': f'Only active {active_days} of the last 14 days. Even one small task a day adds up significantly.',
            'value': f'{active_days}/14',
            'trend': 'down',
        })

    # ─── 6. Overdue warning ───────────────────────────────────────────────────
    overdue = Task.objects.filter(
        user=user,
        status__in=['todo', 'in_progress'],
        due_date__lt=today,
    ).count()

    if overdue >= 2:
        insights.append({
            'type': 'warning',
            'icon': 'alert',
            'title': f'{overdue} tasks are past due',
            'description': 'You have overdue tasks building up. Tackle the most urgent ones today or reschedule them.',
            'value': str(overdue),
            'trend': 'down',
        })

    return insights[:5]