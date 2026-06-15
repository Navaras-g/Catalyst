from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Task, SubTask, Category, Tag
from .serializers import (
    TaskSerializer, TaskCreateUpdateSerializer,
    SubTaskSerializer, CategorySerializer, TagSerializer
)
from .nlp import parse_task_text

# ─── Categories ───────────────────────────────────────────────────────────────

class CategoryListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categories = Category.objects.filter(user=request.user)
        return Response(CategorySerializer(categories, many=True).data)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CategoryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(Category, pk=pk, user=user)

    def patch(self, request, pk):
        category = self.get_object(pk, request.user)
        serializer = CategorySerializer(category, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        category = self.get_object(pk, request.user)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Tags ─────────────────────────────────────────────────────────────────────

class TagListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tags = Tag.objects.filter(user=request.user)
        return Response(TagSerializer(tags, many=True).data)

    def post(self, request):
        serializer = TagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TagDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        tag = get_object_or_404(Tag, pk=pk, user=request.user)
        tag.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Tasks ────────────────────────────────────────────────────────────────────

class TaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tasks = Task.objects.filter(user=request.user).select_related(
            'category', 'project'
        ).prefetch_related('tags', 'subtasks')

        # Filters
        status_filter = request.query_params.get('status')
        priority = request.query_params.get('priority')
        category = request.query_params.get('category')
        project = request.query_params.get('project')
        starred = request.query_params.get('starred')
        due_today = request.query_params.get('due_today')

        if status_filter:
            tasks = tasks.filter(status=status_filter)
        if priority:
            tasks = tasks.filter(priority=priority)
        if category:
            tasks = tasks.filter(category_id=category)
        if project:
            tasks = tasks.filter(project_id=project)
        if starred == 'true':
            tasks = tasks.filter(is_starred=True)
        if due_today == 'true':
            tasks = tasks.filter(due_date=timezone.now().date())

        return Response(TaskSerializer(tasks, many=True).data)

    def post(self, request):
        serializer = TaskCreateUpdateSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        task = serializer.save(user=request.user)
        return Response(
            TaskSerializer(task).data,
            status=status.HTTP_201_CREATED
        )


class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(Task, pk=pk, user=user)

    def get(self, request, pk):
        task = self.get_object(pk, request.user)
        return Response(TaskSerializer(task).data)

    def patch(self, request, pk):
        task = self.get_object(pk, request.user)
        serializer = TaskCreateUpdateSerializer(
            task, data=request.data, partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TaskSerializer(task).data)

    def delete(self, request, pk):
        task = self.get_object(pk, request.user)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Subtasks ─────────────────────────────────────────────────────────────────

class SubTaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, task_pk):
        task = get_object_or_404(Task, pk=task_pk, user=request.user)
        serializer = SubTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(task=task)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SubTaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, task_pk, pk):
        get_object_or_404(Task, pk=task_pk, user=request.user)
        subtask = get_object_or_404(SubTask, pk=pk, task_id=task_pk)
        serializer = SubTaskSerializer(subtask, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, task_pk, pk):
        get_object_or_404(Task, pk=task_pk, user=request.user)
        subtask = get_object_or_404(SubTask, pk=pk, task_id=task_pk)
        subtask.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ParseTaskTextView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get('text', '').strip()
        if not text:
            return Response(
                {'error': 'text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        result = parse_task_text(text)
        return Response(result)