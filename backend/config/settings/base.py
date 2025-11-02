from pathlib import Path
from urllib.parse import urlparse

from django.core.exceptions import ImproperlyConfigured
import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY")
DEBUG = True 
ALLOWED_HOSTS: list[str] = ["localhost", "127.0.0.1"]

INSTALLED_APPS = [
    "jazzmin",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third party apps
    "corsheaders",
    "ninja_extra",
    "ninja_jwt",
    "django_cleanup.apps.CleanupConfig",
    # apps
    "users",
    "vision",
    "diagnosis",
    "logs",
    "community",
    "dashboard",
]


MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
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

db_url = env("DB_URL", default="")
if db_url:
    parsed = urlparse(db_url)
    if parsed.scheme not in {"postgres", "postgresql"}:
        raise ImproperlyConfigured(
            f"Unsupported database scheme '{parsed.scheme}' in DB_URL. Use postgres/postgresql."
        )
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": (parsed.path or "").lstrip("/") or env("DB_NAME", default="plantify"),
            "USER": parsed.username or env("DB_USER", default="postgres"),
            "PASSWORD": parsed.password or env("DB_PASSWORD", default="postgres"),
            "HOST": parsed.hostname or env("DB_HOST", default="localhost"),
            "PORT": str(parsed.port or env("DB_PORT", default="5432")),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("DB_NAME", default="plantify"),
            "USER": env("DB_USER", default="postgres"),
            "PASSWORD": env("DB_PASSWORD", default="postgres"),
            "HOST": env("DB_HOST", default="localhost"),
            "PORT": env("DB_PORT", default="5432"),
        }
    }

CACHES = {
    "default": env.cache("CACHE_URL", default="redis://localhost:6379/0"),
}

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000"])
CORS_ALLOW_CREDENTIALS = True 

AUTH_USER_MODEL = "users.User" # custom user 

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]

NINJA_JWT = {
    "ACCESS_TOKEN_LIFETIME": 60 * 60, # 60 menit
    "REFRESH_TOKEN_LIFETIME": 60 * 60 * 24 * 7,
    "SIGNING_KEY": SECRET_KEY,
    "ALGORITHM": "HS256",

}


MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS: list[str | Path] = []
