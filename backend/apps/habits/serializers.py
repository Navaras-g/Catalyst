from rest_framework import serializers
from django.utils import timezone
from .models import Habit, HabitLog


class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = ['id', 'date', 'completed', 'created_at']
        read_only_fields = ['id', 'created_at']


class HabitSerializer(serializers.ModelSerializer):
    logs = HabitLogSerializer(many=True, read_only=True)
    completed_today = serializers.SerializerMethodField()
    current_streak = serializers.SerializerMethodField()
    longest_streak = serializers.SerializerMethodField()
    completion_rate = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = [
            'id', 'title', 'description', 'frequency',
            'color', 'icon', 'is_active',
            'logs', 'completed_today', 'current_streak',
            'longest_streak', 'completion_rate',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_completed_today(self, obj):
        today = timezone.now().date()
        return obj.logs.filter(date=today, completed=True).exists()

    def get_current_streak(self, obj):
        today = timezone.now().date()
        streak = 0
        day = today
        while True:
            if obj.logs.filter(date=day, completed=True).exists():
                streak += 1
                day -= timezone.timedelta(days=1)
            else:
                break
        return streak

    def get_longest_streak(self, obj):
        logs = list(obj.logs.filter(completed=True).values_list('date', flat=True).order_by('date'))
        if not logs:
            return 0
        longest = 1
        current = 1
        for i in range(1, len(logs)):
            if (logs[i] - logs[i - 1]).days == 1:
                current += 1
                longest = max(longest, current)
            else:
                current = 1
        return longest

    def get_completion_rate(self, obj):
        total = obj.logs.count()
        if total == 0:
            return 0
        completed = obj.logs.filter(completed=True).count()
        return round((completed / total) * 100)