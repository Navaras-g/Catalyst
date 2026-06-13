from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Habit, HabitLog
from .serializers import HabitSerializer, HabitLogSerializer


class HabitListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        habits = Habit.objects.filter(
            user=request.user,
            is_active=True
        ).prefetch_related('logs')
        return Response(HabitSerializer(habits, many=True).data)

    def post(self, request):
        serializer = HabitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class HabitDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(Habit, pk=pk, user=user)

    def patch(self, request, pk):
        habit = self.get_object(pk, request.user)
        serializer = HabitSerializer(habit, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        habit = self.get_object(pk, request.user)
        habit.is_active = False
        habit.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class HabitLogView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        habit = get_object_or_404(Habit, pk=pk, user=request.user)
        today = timezone.now().date()

        log, created = HabitLog.objects.get_or_create(
            habit=habit,
            date=today,
            defaults={'completed': True}
        )

        if not created:
            log.completed = not log.completed
            log.save()

        return Response({
            'completed': log.completed,
            'date': log.date,
        })


class HabitStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        habits = Habit.objects.filter(
            user=request.user,
            is_active=True
        ).prefetch_related('logs')

        total = habits.count()
        completed_today = sum(
            1 for h in habits
            if h.logs.filter(date=today, completed=True).exists()
        )

        return Response({
            'total': total,
            'completed_today': completed_today,
        })