from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        week_start = today - timezone.timedelta(days=today.weekday())

        from apps.tasks.models import Task
        from apps.projects.models import Project
        from apps.focus.models import FocusSession
        from apps.habits.models import Habit

        tasks = Task.objects.filter(user=user)
        tasks_due_today = tasks.filter(
            due_date=today
        ).exclude(status='done').count()

        tasks_completed_this_week = tasks.filter(
            status='done',
            updated_at__date__gte=week_start
        ).count()

        active_projects = Project.objects.filter(
            user=user,
            status='active'
        ).count()

        focus_today = FocusSession.objects.filter(
            user=user,
            session_type='work',
            completed=True,
            started_at__date=today
        ).aggregate(total=Sum('duration_minutes'))['total'] or 0

        habits = Habit.objects.filter(
            user=user,
            is_active=True
        ).prefetch_related('logs')

        total_habits = habits.count()

        completed_habits_today = sum(
            1 for h in habits
            if h.logs.filter(date=today, completed=True).exists()
        )

        max_streak = 0
        for h in habits:
            streak = 0
            day = today
            while h.logs.filter(date=day, completed=True).exists():
                streak += 1
                day -= timezone.timedelta(days=1)
            max_streak = max(max_streak, streak)

        return Response({
            'tasks_due_today': tasks_due_today,
            'tasks_completed_this_week': tasks_completed_this_week,
            'active_projects': active_projects,
            'current_streaks': max_streak,
            'total_focus_minutes_today': focus_today,
            'habits_completed_today': completed_habits_today,
            'habits_total': total_habits,
        })

class CalendarView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))

        from apps.tasks.models import Task
        from apps.focus.models import FocusSession

        # Tasks with due dates in this month
        tasks = Task.objects.filter(
            user=request.user,
            due_date__year=year,
            due_date__month=month,
        ).values('id', 'title', 'status', 'priority', 'due_date')

        # Focus sessions in this month
        sessions = FocusSession.objects.filter(
            user=request.user,
            session_type='work',
            started_at__year=year,
            started_at__month=month,
        ).values('id', 'duration_minutes', 'completed', 'started_at', 'task__title')

        # Group by date
        from collections import defaultdict
        days = defaultdict(lambda: {'tasks': [], 'focus_minutes': 0})

        for task in tasks:
            date_str = task['due_date'].strftime('%Y-%m-%d')
            days[date_str]['tasks'].append({
                'id': task['id'],
                'title': task['title'],
                'status': task['status'],
                'priority': task['priority'],
            })

        for session in sessions:
            date_str = session['started_at'].strftime('%Y-%m-%d')
            days[date_str]['focus_minutes'] += session['duration_minutes']

        return Response({
            'year': year,
            'month': month,
            'days': days,
        })

class ProductivityInsightsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .analyzer import get_productivity_insights
        insights = get_productivity_insights(request.user)
        return Response(insights)