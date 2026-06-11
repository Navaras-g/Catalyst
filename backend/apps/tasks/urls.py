from django.urls import path
from .views import (
    TaskListCreateView, TaskDetailView,
    SubTaskListCreateView, SubTaskDetailView,
    CategoryListCreateView, CategoryDetailView,
    TagListCreateView, TagDetailView,
)

urlpatterns = [
    # Categories
    path('categories/', CategoryListCreateView.as_view(), name='category-list'),
    path('categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),

    # Tags
    path('tags/', TagListCreateView.as_view(), name='tag-list'),
    path('tags/<int:pk>/', TagDetailView.as_view(), name='tag-detail'),

    # Tasks
    path('', TaskListCreateView.as_view(), name='task-list'),
    path('<int:pk>/', TaskDetailView.as_view(), name='task-detail'),

    # Subtasks
    path('<int:task_pk>/subtasks/', SubTaskListCreateView.as_view(), name='subtask-list'),
    path('<int:task_pk>/subtasks/<int:pk>/', SubTaskDetailView.as_view(), name='subtask-detail'),
]