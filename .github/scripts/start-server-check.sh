#!/usr/bin/env bash
# Starts the backend the way the installed app starts it (uv, the locked packages without the
# test tools, a data folder of its own) and waits for it to answer. Used on the systems an
# installer is built for but the app cannot be opened on by hand.
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
work="$(mktemp -d)"
port=8765

export SOS_MY_ENGLISH_DATA_DIR="$work/data"
export UV_PROJECT_ENVIRONMENT="$work/venv"
export PYTHONDONTWRITEBYTECODE=1

cd "$root/backend"
uv run --project "$root/backend" --frozen --no-dev uvicorn app.main:app --host 127.0.0.1 --port "$port" > "$work/server.log" 2>&1 &

# Installing the packages comes first, so the wait is long.
for _ in $(seq 150); do
  if curl -sf "http://127.0.0.1:$port/api/health" > /dev/null; then
    echo "The server answered:"
    curl -s "http://127.0.0.1:$port/api/health"; echo
    curl -sf "http://127.0.0.1:$port/api/topics" | head -c 200; echo
    curl -sf "http://127.0.0.1:$port/api/models" | head -c 300; echo
    exit 0
  fi
  sleep 2
done
echo "The server did not answer in time. Its output:"
cat "$work/server.log"
exit 1
