from django.db import models
from apps.users.models import User


class FocusSession(models.Model):
    class SessionType(models.TextChoices):
        WORK = 'work', 'Work'
        SHORT_BREAK = 'short_break', 'Short Break'
        LONG_BREAK = 'long_break', 'Long Break'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='focus_sessions')
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='focus_sessions'
    )
    session_type = models.CharField(max_length=15, choices=SessionType.choices, default=SessionType.WORK)
    duration_minutes = models.IntegerField()
    completed = models.BooleanField(default=False)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'focus_sessions'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.email} — {self.duration_minutes}m — {self.started_at.date()}"