#!/usr/bin/env bash
# Locus backend deploy/update script.
# Run this on the DigitalOcean droplet inside the backend/ directory.
#
# First-time setup:
#   1. Copy .env.example -> .env and fill in real secrets.
#   2. ./deploy.sh         (builds, migrates, starts; seeds if DB empty)
#
# Subsequent updates:
#   git pull
#   ./deploy.sh
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "ERROR: .env not found. Copy .env.example to .env and edit it first." >&2
  exit 1
fi

echo "==> Pulling latest images & rebuilding api"
docker compose pull db
docker compose build api

echo "==> Starting db"
docker compose up -d db

echo "==> Waiting for Postgres to be healthy"
until docker compose exec -T db pg_isready -U "$(grep ^POSTGRES_USER .env | cut -d= -f2)" >/dev/null 2>&1; do
  sleep 1
done

echo "==> Starting api (runs prisma migrate deploy on boot)"
docker compose up -d api

echo "==> Checking if seed is needed"
SUBJECT_COUNT=$(docker compose exec -T db psql -U "$(grep ^POSTGRES_USER .env | cut -d= -f2)" \
  -d "$(grep ^POSTGRES_DB .env | cut -d= -f2)" -tAc \
  "SELECT COUNT(*) FROM \"Subject\";" 2>/dev/null || echo 0)
SUBJECT_COUNT=$(echo "$SUBJECT_COUNT" | tr -d '[:space:]')

if [ "$SUBJECT_COUNT" = "0" ]; then
  echo "==> Database empty — running seed"
  docker compose exec -T api npm run seed
else
  echo "==> Skipping seed ($SUBJECT_COUNT subjects already present)"
fi

echo "==> Done. API: http://127.0.0.1:$(grep ^HOST_PORT .env | cut -d= -f2)"
docker compose ps
