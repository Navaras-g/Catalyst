from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Note
from .serializers import NoteSerializer


class NoteListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notes = Note.objects.filter(
            user=request.user
        ).select_related('task', 'project')

        search = request.query_params.get('search')
        project = request.query_params.get('project')
        task = request.query_params.get('task')

        if search:
            notes = notes.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search)
            )
        if project:
            notes = notes.filter(project_id=project)
        if task:
            notes = notes.filter(task_id=task)

        return Response(NoteSerializer(notes, many=True).data)

    def post(self, request):
        serializer = NoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class NoteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(Note, pk=pk, user=user)

    def get(self, request, pk):
        note = self.get_object(pk, request.user)
        return Response(NoteSerializer(note).data)

    def patch(self, request, pk):
        note = self.get_object(pk, request.user)
        serializer = NoteSerializer(note, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        note = self.get_object(pk, request.user)
        note.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)