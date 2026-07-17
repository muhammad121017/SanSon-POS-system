#!/bin/sh

echo "Waiting for database..."
python -c "
import socket
import time
import sys

port = 3306
for _ in range(60):
    try:
        with socket.create_connection(('db', port), timeout=1):
            sys.exit(0)
    except OSError:
        time.sleep(1)
sys.exit(1)
"

if [ $? -ne 0 ]; then
  echo "Database connection failed. Exiting."
  exit 1
fi

echo "Database is ready!"

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn server..."
exec gunicorn --bind 0.0.0.0:8000 --workers 3 config.wsgi:application
