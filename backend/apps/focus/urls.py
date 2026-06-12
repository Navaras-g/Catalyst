from django.urls import path
from .views import (
    FocusSessionListCreateView,
    FocusSessionDetailView,
    FocusStatsView,
)

urlpatterns = [
    path('', FocusSessionListCreateView.as_view(), name='focus-list'),
    path('<int:pk>/', FocusSessionDetailView.as_view(), name='focus-detail'),
    path('stats/', FocusStatsView.as_view(), name='focus-stats'),
]