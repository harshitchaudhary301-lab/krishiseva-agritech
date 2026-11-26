#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "==> Upgrading pip..."
pip install --upgrade pip

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Collecting static files..."
python manage.py collectstatic --no-input

echo "==> Running database migrations..."
python manage.py migrate

echo "==> Seeding initial service categories and master data..."
python manage.py seed_demo_data --skip-admin --preserve-existing

echo "==> Seeding crop workflow templates..."
python manage.py seed_crop_templates || true

echo "==> Importing agricultural reference data..."
python manage.py import_agricultural_reference_data || true

echo "==> AgroUday backend build completed successfully!"
