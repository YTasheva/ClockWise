#!/bin/zsh
set -euo pipefail

ROOT_DIR="/Users/stellatasheva/Downloads/bootcamp/ClockWise"

cd "$ROOT_DIR"

npm run dev >/tmp/clockwise-dev.log 2>/tmp/clockwise-dev.err &
DEV_PID=$!

for _ in {1..30}; do
  if curl -sf "http://localhost:5173" >/dev/null; then
    open "http://localhost:5173"
    break
  fi
  sleep 1
done

wait "$DEV_PID"
