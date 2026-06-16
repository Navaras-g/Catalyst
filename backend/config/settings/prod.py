from .base import *
import os

DEBUG = False

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',') + [
    '.onrender.com',
    '.vercel.app',
]

# Supabase database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB'),
        'USER': config('POSTGRES_USER'),
        'PASSWORD': config('POSTGRES_PASSWORD'),
        'HOST': config('POSTGRES_HOST'),
        'PORT': config('POSTGRES_PORT', default='5432'),
        'OPTIONS': {
            'sslmode': 'require',  # Supabase requires SSL
        },
    }
}

# CORS — allow Vercel frontend
CORS_ALLOWED_ORIGINS = [
    'https://catalyst-app.vercel.app',  # update after Vercel deploy
]
CORS_ALLOW_CREDENTIALS = True

# Security
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True

# Cookie settings for production
SIMPLE_JWT = {
    **SIMPLE_JWT,
    'AUTH_COOKIE_SECURE': True,
    'AUTH_COOKIE_SAMESITE': 'None',  # Required for cross-domain cookies
}

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'