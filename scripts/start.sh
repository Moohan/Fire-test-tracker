#!/bin/sh
set -e

echo "Starting deployment script..."

# Run migrations
echo "Running migrations..."
npx prisma migrate deploy

# Run seed if explicitly allowed
if [ "$ALLOW_PRODUCTION_SEED" = "true" ]; then
  echo "Seeding allowed, running seed..."
  npx prisma db seed
else
  echo "Seeding skipped (ALLOW_PRODUCTION_SEED != true)"
fi

echo "Starting application..."
# Start Next.js
node server.js
