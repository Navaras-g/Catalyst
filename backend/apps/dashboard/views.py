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

        return Response({
            'tasks_due_today': tasks_due_today,
            'tasks_completed_this_week': tasks_completed_this_week,
            'active_projects': active_projects,
            'current_streaks': 0,  # will update when habits are built
            'total_focus_minutes_today': focus_today,
            'habits_completed_today': 0,
            'habits_total': 0,
        })