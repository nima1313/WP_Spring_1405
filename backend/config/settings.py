"""
Django settings for the Nava backend (phase 2).

Env-driven (environs). The frontend was built first, so the backend adapts to
its conventions rather than the reverse:
  * served on port 8321 (the /api proxy target already baked into next.config.mjs)
  * CSRF cookie named `csrf_token`, header `X-CSRF-Token` — exactly what
    lib/api/client.ts reads/sends, so no frontend file has to change
  * camelCase JSON in/out so lib/types.ts stays the single source of truth
"""

from pathlib import Path

from environs import Env

BASE_DIR = Path(__file__).resolve().parent.parent

env = Env()
env.read_env(BASE_DIR / ".env", recurse=False)

SECRET_KEY = env.str("SECRET_KEY", "dev-insecure-change-me")
DEBUG = env.bool("DEBUG", True)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", ["localhost", "127.0.0.1", "backend"])

FRONTEND_URL = env.str("FRONTEND_URL", "http://localhost:3000")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third-party
    "rest_framework",
    "drf_spectacular",
    # local
    "core",
    "accounts",
    "catalog",
    "engagement",
    "billing",
    "support",
    "analytics",
]

MIDDLEWARE = [
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
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": env.str("DATABASE_PATH", str(BASE_DIR / "db.sqlite3")),
    }
}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 6}},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Tehran"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = env.str("MEDIA_ROOT", str(BASE_DIR / "media"))

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- CSRF / session: match lib/api/client.ts exactly ------------------------
CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "HTTP_X_CSRF_TOKEN"
CSRF_COOKIE_HTTPONLY = False  # the JS client must read it to echo it back
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", ["http://localhost:3000"])

# --- DRF --------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "djangorestframework_camel_case.render.CamelCaseJSONRenderer",
        "djangorestframework_camel_case.render.CamelCaseBrowsableAPIRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "djangorestframework_camel_case.parser.CamelCaseJSONParser",
        "djangorestframework_camel_case.parser.CamelCaseMultiPartParser",
        "djangorestframework_camel_case.parser.CamelCaseFormParser",
    ],
    # The frontend expects plain arrays, not {count, results} envelopes.
    "DEFAULT_PAGINATION_CLASS": None,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "core.exceptions.exception_handler",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Nava API",
    "DESCRIPTION": "Backend for the Nava music-streaming project (phase 2).",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "CAMELIZE_NAMES": True,
}

# --- Payments ---------------------------------------------------------------
PAYMENT_GATEWAY = env.str("PAYMENT_GATEWAY", "mock")
ZARINPAL_MERCHANT_ID = env.str(
    "ZARINPAL_MERCHANT_ID", "00000000-0000-0000-0000-000000000000"
)
ZARINPAL_SANDBOX = env.bool("ZARINPAL_SANDBOX", True)

# --- Artist reward formula (تومان) ------------------------------------------
REWARD_PER_STREAM = env.int("REWARD_PER_STREAM", 5)
REWARD_PER_LISTENER = env.int("REWARD_PER_LISTENER", 120)
