from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/tasks/', include('apps.tasks.urls')),
    path('api/v1/projects/', include('apps.projects.urls')),
    path('api/v1/focus/', include('apps.focus.urls')),
    path('api/v1/habits/', include('apps.habits.urls')),
    path('api/v1/dashboard/', include('apps.dashboard.urls')),
    path('api/v1/notes/', include('apps.notes.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)