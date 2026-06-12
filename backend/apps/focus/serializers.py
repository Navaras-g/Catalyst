from rest_framework import serializers
from .models import FocusSession


class FocusSessionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)

    class Meta:
        model = FocusSession
        fields = [
            'id', 'task', 'task_title', 'session_type',
            'duration_minutes', 'completed',
            'started_at', 'ended_at', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']