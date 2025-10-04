import os
from datetime import timedelta
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("DJANGO_SECRET_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1,46.31.79.7").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",

    # senin app’lerin
    "base.apps.BaseConfig",
    "firmalar",
    "assistant",
    "accounts",

    # 3rd party
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_celery_beat",
    "drf_yasg",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "channels",
    "chat",
    "storages",
   
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
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "backend.urls"
WSGI_APPLICATION = "backend.wsgi.application"
ASGI_APPLICATION = "backend.asgi.application"
CORS_ALLOW_ALL_ORIGINS = True

REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://46.31.79.7:5050",   # ⬅️ burayı ekle
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://46.31.79.7:5050",   # ⬅️ CSRF için de ekle
]

CORS_ALLOW_CREDENTIALS = True 
# SECURE_SSL_REDIRECT = False
# ALLOWED_HOSTS = ["localhost", "127.0.0.1"]
# -----------------------
# DATABASE (Postgres)
# -----------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("PG2_NAME", default="eurun_db"),
        "USER": config("PG2_USER", default="eurun_user"),
        "PASSWORD": config("PG2_PASSWORD", default="EurunPass123"),
        "HOST": config("PG2_HOST", default="127.0.0.1"),
        "PORT": config("PG2_PORT", default="5432"),
    },
}

# -----------------------
# MinIO (S3) Ayarları
# -----------------------
DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"

AWS_ACCESS_KEY_ID        = config("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY    = config("AWS_SECRET_ACCESS_KEY")
AWS_S3_ENDPOINT_URL      = config("AWS_S3_ENDPOINT_URL", default=None)
AWS_S3_REGION_NAME       = config("AWS_S3_REGION_NAME", default="us-east-1")
AWS_S3_SIGNATURE_VERSION = config("AWS_S3_SIGNATURE_VERSION", default="s3v4")
AWS_S3_ADDRESSING_STYLE  = config("AWS_S3_ADDRESSING_STYLE", default="path")

# Eski tek bucket (hala kullanıyorsan)
AWS_STORAGE_BUCKET_NAME  = config("AWS_STORAGE_BUCKET_NAME", default=None)

# Yeni public/private bucket adlarını da settings'e al:
AWS_PUBLIC_BUCKET_NAME   = config("AWS_PUBLIC_BUCKET_NAME", default=AWS_STORAGE_BUCKET_NAME)
AWS_PRIVATE_BUCKET_NAME  = config("AWS_PRIVATE_BUCKET_NAME", default=AWS_STORAGE_BUCKET_NAME)

# Diğer bayraklar
AWS_QUERYSTRING_AUTH     = config("AWS_QUERYSTRING_AUTH", cast=bool, default=False)
AWS_S3_FILE_OVERWRITE    = config("AWS_S3_FILE_OVERWRITE", cast=bool, default=False)

MEDIA_URL = "/media/"
AWS_DEFAULT_ACL = None

# Public URL kullanılsın (query string auth kapalı)
# AWS_QUERYSTRING_AUTH = False
# AWS_DEFAULT_ACL = None
# AWS_S3_FILE_OVERWRITE = False

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

# -----------------------
# MEDIA & STATIC
# -----------------------
STATIC_URL = "static/"
# MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# -----------------------
# REST & JWT
# -----------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    )
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# -----------------------
# AUTH / ALLAUTH
# -----------------------
AUTH_USER_MODEL = "accounts.CustomUser"
ACCOUNT_LOGIN_METHODS = {"email"} 
# ACCOUNT_EMAIL_REQUIRED = True
# ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_VERIFICATION = "none"
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
SITE_ID = 1

AUTHENTICATION_BACKENDS = (
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
)

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],  # templates klasörünüz (varsa)
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
# -----------------------
# CHANNELS / REDIS
# -----------------------

REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [{
                "address": (REDIS_HOST, REDIS_PORT),
                "password": REDIS_PASSWORD or None,
                "db": 0,
            }],
        },
    },
}

CELERY_BROKER_URL = "redis://localhost:6379/0"

# -----------------------
# DİĞER
# -----------------------
LANGUAGE_CODE = "tr-tr"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
