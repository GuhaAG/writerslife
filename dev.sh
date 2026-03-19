#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$API_PID" "$APP_PID" 2>/dev/null
  wait "$API_PID" "$APP_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "Starting API server..."
cd "$ROOT/api/books-api"
go run main.go &
API_PID=$!

echo "Starting React app..."
cd "$ROOT/app"
npm start &
APP_PID=$!

echo "API PID: $API_PID | App PID: $APP_PID"
echo "Press Ctrl+C to stop both."

wait
