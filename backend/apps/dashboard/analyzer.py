from django.utils import timezone
from collections import defaultdict


def get_productivity_insights(user) -> list[dict]:
    """
    Analyzes user's historical data and returns a list of
    personalized productivity insights.
    """
    from apps.tasks.models import Task
    from apps.habits.models import Habit, HabitLog
    from apps.focus.models import FocusSession

    insights = []
    today = timezone.now().date()

    # ─── Need enough data to generate insights ────────────────────────────────
    total_tasks = Task.objects.filter(user=user).count()
    if total_tasks < 5:
        return [{
            'type': 'info',
            'icon': 'rocket',
            'title': 'Getting started',
            'description': 'Complete a few more tasks and we\'ll start showing you personalized productivity insights.',
            'value': None,
        }]

    # ─── 1. Best day of the week ──────────────────────────────────────────────
    completed_tasks = Task.objects.filter(
        user=user,
        status='done',
    ).values_list('updated_at', flat=True)

    if completed_tasks.count() >= 5:
        day_counts = defaultdict(int)
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        for dt in completed_tasks:
            day_counts[dt.weekday()] += 1

        if day_counts:
            best_day = max(day_counts, key=day_counts.get)
            worst_day = min(day_counts, key=day_counts.get)
            best_count = day_counts[best_day]
            worst_count = day_counts[worst_day]

            if best_count > 0 and worst_count > 0:
                multiplier = round(best_count / max(worst_count, 1), 1)
                if multiplier >= 1.5:
                    insights.append({
                        'type': 'peak_day',
                        'icon': 'calendar',
                        'title': f'{day_names[best_day]} is your power day',
                        'description': f'You complete {multiplier}x more tasks on {day_names[best_day]}s than any other day.',
                        'value': f'{multiplier}x',
                    })

    # ─── 2. Estimation accuracy ───────────────────────────────────────────────
    estimated_tasks = Task.objects.filter(
        user=user,
        status='done',
        estimated_minutes__isnull=False,
        estimated_minutes__gt=0,
    )

    if estimated_tasks.count() >= 3:
        focus_sessions = FocusSession.objects.filter(
            user=user,
            session_type='work',
            completed=True,
            task__isnull=False,
        ).select_related('task')

        if focus_sessions.count() >= 3:
            actual_by_task = defaultdict(int)
            for session in focus_sessions:
                actual_by_task[session.task_id] += session.duration_minutes

            ratios = []
            for task in estimated_tasks:
                if task.id in actual_by_task and task.estimated_minutes:
                    ratio = actual_by_task[task.id] / task.estimated_minutes
                    ratios.append(ratio)

            if ratios:
                avg_ratio = sum(ratios) / len(ratios)
                if avg_ratio > 1.2:
                    pct = round((avg_ratio - 1) * 100)
                    insights.append({
                        'type': 'estimation',
                        'icon': 'clock',
                        'title': 'Tasks take longer than expected',
                        'description': f'On average your tasks take {pct}% longer than your estimates. Try adding buffer time.',
                        'value': f'+{pct}%',
                    })
                elif avg_ratio < 0.8:
                    pct = round((1 - avg_ratio) * 100)
                    insights.append({
                        'type': 'estimation',
                        'icon': 'clock',
                        'title': 'You finish faster than expected',
                        'description': f'You complete tasks {pct}% faster than estimated. Your planning is conservative.',
                        'value': f'-{pct}%',
                    })

    # ─── 3. Focus session impact ──────────────────────────────────────────────
    focus_sessions_with_tasks = FocusSession.objects.filter(
        user=user,
        session_type='work',
        completed=True,
        task__isnull=False,
    ).select_related('task')

    if focus_sessions_with_tasks.count() >= 3:
        completed_with_focus = sum(
            1 for s in focus_sessions_with_tasks
            if s.task and s.task.status == 'done'
        )
        total_with_focus = focus_sessions_with_tasks.values('task').distinct().count()

        if total_with_focus > 0:
            focus_completion_rate = completed_with_focus / total_with_focus

            all_tasks_rate = (
                Task.objects.filter(user=user, status='done').count() /
                max(total_tasks, 1)
            )

            if focus_completion_rate > all_tasks_rate * 1.3:
                pct = round(focus_completion_rate * 100)
                insights.append({
                    'type': 'focus_impact',
                    'icon': 'zap',
                    'title': 'Focus sessions boost completion',
                    'description': f'{pct}% of tasks linked to a focus session get completed. Use the timer more.',
                    'value': f'{pct}%',
                })

    # ─── 4. Habit consistency ─────────────────────────────────────────────────
    habits = Habit.objects.filter(
        user=user,
        is_active=True,
    ).prefetch_related('logs')

    if habits.count() >= 1:
        weekday_completions = defaultdict(int)
        weekday_totals = defaultdict(int)
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

        for habit in habits:
            logs = habit.logs.filter(completed=True)
            for log in logs:
                weekday_completions[log.date.weekday()] += 1

            # Count how many times each weekday has occurred since habit creation
            start = habit.created_at.date()
            delta = today - start
            for i in range(delta.days + 1):
                d = start + timezone.timedelta(days=i)
                weekday_totals[d.weekday()] += 1

        rates = {}
        for day in range(7):
            if weekday_totals[day] > 0:
                rates[day] = weekday_completions[day] / weekday_totals[day]

        if rates:
            best_habit_day = max(rates, key=rates.get)
            worst_habit_day = min(rates, key=rates.get)
            best_rate = rates[best_habit_day]
            worst_rate = rates[worst_habit_day]

            if best_rate > 0.5 and worst_rate < 0.4:
                insights.append({
                    'type': 'habit_pattern',
                    'icon': 'flame',
                    'title': f'Habits strongest on {day_names[best_habit_day]}s',
                    'description': f'You complete {round(best_rate * 100)}% of habits on {day_names[best_habit_day]}s but only {round(worst_rate * 100)}% on {day_names[worst_habit_day]}s.',
                    'value': f'{round(best_rate * 100)}%',
                })

    # ─── 5. Completion streak ─────────────────────────────────────────────────
    recent_days_with_tasks = 0
    recent_days_checked = 0
    for i in range(14):
        day = today - timezone.timedelta(days=i)
        count = Task.objects.filter(
            user=user,
            status='done',
            updated_at__date=day,
        ).count()
        if count > 0:
            recent_days_with_tasks += 1
        recent_days_checked += 1

    if recent_days_checked > 0:
        consistency = round((recent_days_with_tasks / recent_days_checked) * 100)
        if consistency >= 70:
            insights.append({
                'type': 'consistency',
                'icon': 'trending_up',
                'title': 'Highly consistent lately',
                'description': f'You\'ve completed tasks on {recent_days_with_tasks} of the last 14 days. Keep the streak going.',
                'value': f'{consistency}%',
            })
        elif consistency < 30 and total_tasks > 10:
            insights.append({
                'type': 'consistency',
                'icon': 'trending_down',
                'title': 'Activity has been low',
                'description': f'You\'ve only been active {recent_days_with_tasks} of the last 14 days. Small daily progress adds up.',
                'value': f'{consistency}%',
            })

    # ─── 6. Priority distribution ─────────────────────────────────────────────
    urgent_overdue = Task.objects.filter(
        user=user,
        priority='urgent',
        status__in=['todo', 'in_progress'],
        due_date__lt=today,
    ).count()

    if urgent_overdue >= 2:
        insights.append({
            'type': 'warning',
            'icon': 'alert',
            'title': f'{urgent_overdue} urgent tasks are overdue',
            'description': 'You have urgent tasks past their due date. Consider rescheduling or tackling them today.',
            'value': str(urgent_overdue),
        })

    # ─── 7. Most productive time of day ──────────────────────────────────────
    completed_with_time = Task.objects.filter(
        user=user,
        status='done',
    ).values_list('updated_at', flat=True)

    if completed_with_time.count() >= 8:
        time_buckets = defaultdict(int)
        for dt in completed_with_time:
            local_hour = dt.hour
            if 5 <= local_hour < 12:
                time_buckets['morning'] += 1
            elif 12 <= local_hour < 17:
                time_buckets['afternoon'] += 1
            elif 17 <= local_hour < 21:
                time_buckets['evening'] += 1
            else:
                time_buckets['night'] += 1

        if time_buckets:
            best_time = max(time_buckets, key=time_buckets.get)
            best_time_labels = {
                'morning': 'in the morning',
                'afternoon': 'in the afternoon',
                'evening': 'in the evening',
                'night': 'late at night',
            }
            pct = round(
                time_buckets[best_time] /
                max(sum(time_buckets.values()), 1) * 100
            )
            if pct >= 40:
                insights.append({
                    'type': 'peak_time',
                    'icon': 'sun',
                    'title': f'You peak {best_time_labels[best_time]}',
                    'description': f'{pct}% of your completed tasks happen {best_time_labels[best_time]}. Schedule your hardest work then.',
                    'value': f'{pct}%',
                })

    return insights[:5]  # Return top 5 insights max