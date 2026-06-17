from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'

    def ready(self):
        try:
            import apps.users.signals  # noqa: F401
            from apps.users.signals import (
                setup_task_signals,
                setup_habit_signals,
                setup_focus_signals,
            )
            setup_task_signals()
            setup_habit_signals()
            setup_focus_signals()
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f'Signal setup failed: {e}')