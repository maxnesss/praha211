#!/usr/bin/env bash

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${1:-main}"
APP_NAME="${APP_NAME:-praha112}"
RUN_BACKFILL="${RUN_BACKFILL:-1}"

cd "$APP_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Remote repo has uncommitted changes. Deploy aborted."
  exit 1
fi

echo "== Deploy: fetching ${BRANCH} =="
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "== Deploy: install/build/migrate =="
npm ci
if ! npm run ocr:warmup; then
  echo "WARN: OCR warmup failed, lokální OCR validace může využít fallback na ruční schválení."
fi
npm run prisma:migrate

if [[ "$RUN_BACKFILL" == "1" ]]; then
  npm run score:backfill
fi

npm run build

echo "== Deploy: pm2 reload =="
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload "$APP_NAME" --update-env
else
  pm2 start npm --name "$APP_NAME" -- run start
fi
pm2 save

echo "== Deploy: health check =="
if [[ -f .env ]]; then
  set -a
  # shellcheck source=/dev/null
  source .env
  set +a
fi

if [[ -n "${HEALTHCHECK_SECRET:-}" ]]; then
  # Check the app process directly to avoid nginx virtual-host routing issues.
  HEALTH_URL="${HEALTHCHECK_URL:-http://127.0.0.1:3000/api/health/db}"
  HEALTH_OK=0
  for _ in {1..30}; do
    if curl -fsS -H "x-health-check-secret: ${HEALTHCHECK_SECRET}" "$HEALTH_URL" >/dev/null; then
      HEALTH_OK=1
      break
    fi
    sleep 1
  done

  if [[ "$HEALTH_OK" != "1" ]]; then
    echo "Health check failed after reload"
    exit 1
  fi

  echo "Health check OK"
else
  echo "HEALTHCHECK_SECRET missing, skipped health check"
fi

echo "== Deploy done =="
