#!/bin/bash
set -e

# Check if database exists and is not empty
if [ ! -f /app/database/database.sqlite ] || [ ! -s /app/database/database.sqlite ]; then
    echo "ERROR: Database file missing or empty at /app/database/database.sqlite"
    exit 1
fi

# Start Laravel
echo "Starting Laravel application on port ${PORT:-8000}"
exec php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
