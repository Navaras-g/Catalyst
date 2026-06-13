from django.urls import path
from .views import (
    HabitListCreateView,
    HabitDetailView,
    HabitLogView,
    HabitStatsView,
)

urlpatterns = [
    path('', HabitListCreateView.as_view(), name='habit-list'),
    path('<int:pk>/', HabitDetailView.as_view(), name='habit-detail'),
    path('<int:pk>/log/', HabitLogView.as_view(), name='habit-log'),
    path('stats/', HabitStatsView.as_view(), name='habit-stats'),
]