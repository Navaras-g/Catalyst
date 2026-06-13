from rest_framework import serializers
from .models import Note


class NoteSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = Note
        fields = [
            'id', 'title', 'content', 'is_pinned',
            'task', 'task_title',
            'project', 'project_title',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']