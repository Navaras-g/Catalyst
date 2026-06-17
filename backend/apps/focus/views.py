from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum, Count

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
        was_completed = session.completed
        serializer = FocusSessionSerializer(session, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Award XP if session just became completed
        if not was_completed and session.completed and session.session_type == 'work':
            try:
                from apps.users.signals import award_xp
                award_xp(request.user, 15)
            except Exception:
                pass

        return Response(serializer.data)


class FocusStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        week_start = today - timezone.timedelta(days=today.weekday())
        last_week_start = week_start - timezone.timedelta(weeks=1)

        base = FocusSession.objects.filter(
            user=user,
            session_type='work',
            completed=True,
        )

        # ── Today ──────────────────────────────────────────────────────────────
        today_minutes = base.filter(
            started_at__date=today
        ).aggregate(total=Sum('duration_minutes'))['total'] or 0

        today_sessions = base.filter(started_at__date=today).count()

        # ── This week ──────────────────────────────────────────────────────────
        week_minutes = base.filter(
            started_at__date__gte=week_start
        ).aggregate(total=Sum('duration_minutes'))['total'] or 0

        # ── Last week ──────────────────────────────────────────────────────────
        last_week_minutes = base.filter(
            started_at__date__gte=last_week_start,
            started_at__date__lt=week_start,
        ).aggregate(total=Sum('duration_minutes'))['total'] or 0

        # ── All time ───────────────────────────────────────────────────────────
        all_time = base.aggregate(
            total_minutes=Sum('duration_minutes'),
            total_sessions=Count('id'),
        )
        all_time_minutes = all_time['total_minutes'] or 0
        total_sessions = all_time['total_sessions'] or 0

        # ── Best day ever ─────────────────────────────────────────────────────
        from django.db.models.functions import TruncDate
        daily_totals = base.annotate(
            day=TruncDate('started_at')
        ).values('day').annotate(
            total=Sum('duration_minutes')
        ).order_by('-total')

        best_day = None
        best_day_minutes = 0
        if daily_totals.exists():
            best = daily_totals.first()
            best_day = best['day'].strftime('%b %d, %Y')
            best_day_minutes = best['total']

        # ── Daily breakdown last 7 days ────────────────────────────────────────
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

        # ── Week over week change ──────────────────────────────────────────────
        week_change = None
        if last_week_minutes > 0:
            week_change = round(
                ((week_minutes - last_week_minutes) / last_week_minutes) * 100
            )

        return Response({
            'today_minutes': today_minutes,
            'today_sessions': today_sessions,
            'week_minutes': week_minutes,
            'last_week_minutes': last_week_minutes,
            'week_change': week_change,
            'all_time_minutes': all_time_minutes,
            'total_sessions': total_sessions,
            'best_day': best_day,
            'best_day_minutes': best_day_minutes,
            'daily': daily,
        })