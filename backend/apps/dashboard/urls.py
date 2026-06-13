from django.urls import path
from .views import DashboardStatsView, CalendarView

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('calendar/', CalendarView.as_view(), name='calendar'),
]