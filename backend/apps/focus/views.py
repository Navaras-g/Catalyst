from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum

from .models import FocusSession
from .serializers import FocusSessionSerializer


class FocusSessionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = FocusSession.objects.filter(
            user=request.user,
            session_type='work',
        ).select_related('task')[:30]
        return Response(FocusSessionSerializer(sessions, many=True).data)

    def post(self, request):
        serializer = FocusSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FocusSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        session = get_object_or_404(FocusSession, pk=pk, user=request.user)
        serializer = FocusSessionSerializer(session, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class FocusStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        week_start = today - timezone.timedelta(days=today.weekday())

        base = FocusSession.objects.filter(
            user=user,
            session_type='work',
            completed=True,
        )

        today_minutes = base.filter(
            started_at__date=today
        ).aggregate(total=Sum('duration_minutes'))['total'] or 0

        week_minutes = base.filter(
            started_at__date__gte=week_start
        ).aggregate(total=Sum('duration_minutes'))['total'] or 0

        today_sessions = base.filter(started_at__date=today).count()
        total_sessions = base.count()

        # Daily breakdown for the past 7 days
        daily = []
        for i in range(6, -1, -1):
            day = today - timezone.timedelta(days=i)
            mins = base.filter(
                started_at__date=day
            ).aggregate(total=Sum('duration_minutes'))['total'] or 0
            daily.append({
                'date': day.strftime('%a'),
                'minutes': mins,
            })

        return Response({
            'today_minutes': today_minutes,
            'week_minutes': week_minutes,
            'today_sessions': today_sessions,
            'total_sessions': total_sessions,
            'daily': daily,
        })