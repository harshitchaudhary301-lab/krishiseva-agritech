"""
Django settings for KrishiSeva project.
Production-ready configuration supporting local SQLite and Render PostgreSQL.
"""

from pathlib import Path
from django.core.exceptions import ImproperlyConfigured
import os

try:
    from dotenv import load_dotenv
    # Load .env from backend or root directory if present
    load_dotenv(Path(__file__).resolve().parent.parent / '.env')
    load_dotenv(Path(__file__).resolve().parent.parent.parent / '.env')
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent

# -----------------------------------------------------------------------------
# Security & Debug Configuration
# -----------------------------------------------------------------------------
# Automatically detect Render or production environment
IS_RENDER = 'RENDER' in os.environ

debug_env = os.environ.get('DEBUG')
if debug_env is not None:
    DEBUG = debug_env.lower() in ('true', '1', 't', 'yes')
else:
    # Safe default: False on Render / production, True in local development
    DEBUG = not IS_RENDER

secret_key_env = os.environ.get('DJANGO_SECRET_KEY')
if secret_key_env:
    SECRET_KEY = secret_key_env
elif DEBUG:
    SECRET_KEY = 'krishiseva-dev-only-insecure-key-change-in-production'
else:
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY environment variable is missing! In production, a secure secret key must be set."
    )

# -----------------------------------------------------------------------------
# Hosts & Network Access
# -----------------------------------------------------------------------------
allowed_hosts_env = os.environ.get('ALLOWED_HOSTS', '')
if allowed_hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_env.split(',') if h.strip()]
elif DEBUG:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]', 'testserver']
else:
    ALLOWED_HOSTS = []

# Support test runner
if 'testserver' not in ALLOWED_HOSTS and (DEBUG or 'test' in os.sys.argv):
    ALLOWED_HOSTS.append('testserver')

# Render provides RENDER_EXTERNAL_HOSTNAME automatically (e.g. krishiseva-backend.onrender.com)
render_hostname = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if render_hostname and render_hostname not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(render_hostname)

# Allow wildcard onrender.com subdomains if deployed on Render
if IS_RENDER and '.onrender.com' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('.onrender.com')

# -----------------------------------------------------------------------------
# Application Definition
# -----------------------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',

    # KrishiSeva Core Apps
    'accounts',
    'services',
    'bookings',
    'farm_projects',
    'matching',
]

try:
    import whitenoise
    HAS_WHITENOISE = True
except ImportError:
    HAS_WHITENOISE = False

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
]

if HAS_WHITENOISE:
    MIDDLEWARE.append('whitenoise.middleware.WhiteNoiseMiddleware')

MIDDLEWARE.extend([
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
])

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# -----------------------------------------------------------------------------
# Database Configuration
# Local Development: SQLite
# Production: PostgreSQL (via DATABASE_URL on Render / external database)
# -----------------------------------------------------------------------------
database_url = os.environ.get('DATABASE_URL')
if database_url:
    try:
        import dj_database_url
        DATABASES = {
            'default': dj_database_url.config(
                default=database_url,
                conn_max_age=600,
                conn_health_checks=True,
            )
        }
    except ImportError:
        import urllib.parse
        parsed = urllib.parse.urlparse(database_url)
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': parsed.path.lstrip('/'),
                'USER': parsed.username,
                'PASSWORD': parsed.password,
                'HOST': parsed.hostname,
                'PORT': parsed.port or 5432,
            }
        }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# -----------------------------------------------------------------------------
# Django REST Framework
# -----------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'accounts.authentication.ExpiringTokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

# -----------------------------------------------------------------------------
# Email Configuration (Isolated Local Delivery for Password Recovery)
# -----------------------------------------------------------------------------
EMAIL_BACKEND = os.environ.get(
    'EMAIL_BACKEND',
    'django.core.mail.backends.console.EmailBackend'
)
DEFAULT_FROM_EMAIL = 'support@krishiseva.in'
TOKEN_EXPIRE_DAYS = int(os.environ.get('TOKEN_EXPIRE_DAYS', '30'))

# -----------------------------------------------------------------------------
# CORS & CSRF Configuration
# -----------------------------------------------------------------------------
cors_origins_env = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if cors_origins_env:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in cors_origins_env.split(',') if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
    ]

# If FRONTEND_URL is explicitly set (e.g. Vercel deployment URL), add it
frontend_url = os.environ.get('FRONTEND_URL')
if frontend_url and frontend_url.strip() not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append(frontend_url.strip())

# Support dynamic Vercel preview domains
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/.*\.vercel\.app$",
]

# Only allow all origins if explicitly requested AND in DEBUG mode
CORS_ALLOW_ALL_ORIGINS = DEBUG and os.environ.get('CORS_ALLOW_ALL_ORIGINS', 'False').lower() in ('true', '1')
CORS_ALLOW_CREDENTIALS = True

csrf_trusted_env = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
if csrf_trusted_env:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in csrf_trusted_env.split(',') if o.strip()]
else:
    CSRF_TRUSTED_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]
    for origin in CORS_ALLOWED_ORIGINS:
        if origin.startswith('http://') or origin.startswith('https://'):
            if origin not in CSRF_TRUSTED_ORIGINS:
                CSRF_TRUSTED_ORIGINS.append(origin)

if render_hostname:
    render_origin = f"https://{render_hostname}"
    if render_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(render_origin)

CSRF_TRUSTED_ORIGINS.append("https://*.vercel.app")
CSRF_TRUSTED_ORIGINS.append("https://*.onrender.com")

# -----------------------------------------------------------------------------
# Production HTTPS & Cookie Security
# -----------------------------------------------------------------------------
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1', 't', 'yes')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# -----------------------------------------------------------------------------
# Internationalization & Timezone
# -----------------------------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# -----------------------------------------------------------------------------
# Static & Media Files
# -----------------------------------------------------------------------------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

if HAS_WHITENOISE and not DEBUG:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} [{name}:{lineno}] {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING' if not DEBUG else 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
