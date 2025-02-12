import os
from pathlib import Path

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Security settings
SECRET_KEY = "django-insecure-=s$o2o@%ii$$^@uq9*8%yb28zu0#m9mjs3g^_q6%b6*%oy0^cw"
DEBUG = True  # Set to False in production
ALLOWED_HOSTS = [
    '127.0.0.1', 'localhost', '0.0.0.0',
    '192.168.10.102', '192.168.0.88', '192.168.0.78', '192.168.0.83',
    '172.20.240.1', '172.20.241.55', '192.168.0.87',
    '192.168.0.108', '10.48.38.224', '192.168.1.54', '192.168.1.80',
    '172.20.10.8', '172.20.10.2', '.192.168.0.'
]

# Installed apps
INSTALLED_APPS = [
    "hrv.apps.HrvConfig",
    "polls.apps.PollsConfig",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

# Middleware
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    # Uncomment if CSRF protection is needed
    # "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# Root URL configuration
ROOT_URLCONF = "mysite.urls"

# Templates configuration
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / 'templates'],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# WSGI application
WSGI_APPLICATION = "mysite.wsgi.application"

# Database
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Password validators
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Localization settings
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
# STATICFILES_DIRS = [
#     BASE_DIR / 'hrv' / 'static',
#     BASE_DIR / 'node_modules',  # Optional, verify necessity
#     BASE_DIR / 'static',
# ]

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),
    os.path.join(BASE_DIR, "node_modules"),
]

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
