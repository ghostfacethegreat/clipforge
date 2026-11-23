#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

cleanup() {
  kill "${SERVER_PID:-}" "${WEB_PID:-}" 2>/dev/null || true
}
trap cleanup EXIT

"$ROOT/.venv/bin/uvicorn" app.main:app --app-dir "$ROOT/server" --host 127.0.0.1 --port 8000 &
SERVER_PID=$!

(cd "$ROOT/web" && npm run dev) &
WEB_PID=$!

echo "Clipforge running at http://localhost:3000 (API :8000)"
wait
