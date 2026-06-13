from django.db import models
from apps.users.models import User


class Habit(models.Model):
    class Frequency(models.TextChoices):
        DAILY = 'daily', 'Daily'
        WEEKLY = 'weekly', 'Weekly'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habits')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    frequency = models.CharField(max_length=10, choices=Frequency.choices, default=Frequency.DAILY)
    color = models.CharField(max_length=7, default='#6366f1')
    icon = models.CharField(max_length=10, default='⭐')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'habits'
        ordering = ['created_at']

    def __str__(self):
        return self.title


class HabitLog(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='logs')
    date = models.DateField()
    completed = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'habit_logs'
        unique_together = ['habit', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.habit.title} — {self.date}"