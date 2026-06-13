from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView,
    TokenRefreshView, MeView, ChangePasswordView,
    AchievementsView, XPView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('achievements/', AchievementsView.as_view(), name='achievements'),
    path('xp/', XPView.as_view(), name='xp'),
]