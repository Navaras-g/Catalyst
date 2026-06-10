from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
]
CORS_ALLOW_CREDENTIALS = True

SIMPLE_JWT = {
    **SIMPLE_JWT,
    'AUTH_COOKIE_SECURE': False,  # No HTTPS needed in dev
}