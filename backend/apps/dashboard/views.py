from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'tasks_due_today': 0,
            'tasks_completed_this_week': 0,
            'active_projects': 0,
            'current_streaks': 0,
            'total_focus_minutes_today': 0,
            'habits_completed_today': 0,
            'habits_total': 0,
        })