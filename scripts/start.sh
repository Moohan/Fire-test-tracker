#!/bin/sh
set -e

# Run migrations
npx prisma migrate deploy

# Run seed if explicitly allowed
if [ "$ALLOW_PRODUCTION_SEED" = "true" ]; then
  npx prisma db seed
fi

# Start Next.js
node server.js
