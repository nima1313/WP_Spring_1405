#!/bin/sh
# Migrate, seed the demo data (idempotent — skips if already seeded), then serve.
set -e

python manage.py migrate --no-input
python manage.py collectstatic --no-input >/dev/null 2>&1 || true
python manage.py seed

exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8321 \
  --workers 3 \
  --access-logfile - \
  --error-logfile -
