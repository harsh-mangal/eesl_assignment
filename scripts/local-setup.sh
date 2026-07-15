#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_PID=""
cleanup() {
  if [ -n "$SERVER_PID" ]; then kill "$SERVER_PID" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT

command -v node >/dev/null || { echo "Node.js is required." >&2; exit 1; }
command -v npm >/dev/null || { echo "npm is required." >&2; exit 1; }
command -v docker >/dev/null || { echo "Docker Desktop is required for the provided local MySQL setup." >&2; exit 1; }

printf '\n[1/9] Starting local MySQL\n'
(cd "$ROOT" && docker compose up -d mysql)

printf '\n[2/9] Preparing environment files\n'
for app in server admin mobile; do
  if [ ! -f "$ROOT/$app/.env" ]; then cp "$ROOT/$app/.env.example" "$ROOT/$app/.env"; fi
done

printf '\n[3/9] Installing dependencies\n'
(cd "$ROOT/server" && npm ci)
(cd "$ROOT/admin" && npm ci)
(cd "$ROOT/mobile" && npm ci)

printf '\n[4/9] Waiting for MySQL\n'
for attempt in {1..45}; do
  if docker compose -f "$ROOT/docker-compose.yml" exec -T mysql mysqladmin ping -h localhost -u member_app -pmember_app_password --silent >/dev/null 2>&1; then break; fi
  if [ "$attempt" = 45 ]; then echo "MySQL did not become ready." >&2; exit 1; fi
  sleep 2
done

printf '\n[5/9] Generating Prisma Client and applying committed migration\n'
(cd "$ROOT/server" && npm run prisma:generate && npx prisma validate && npm run prisma:deploy)

printf '\n[6/9] Loading deterministic seed data\n'
(cd "$ROOT/server" && npm run prisma:seed)

printf '\n[7/9] Running source release checks\n'
"$ROOT/scripts/release-check.sh"

printf '\n[8/9] Building and starting the API for runtime smoke testing\n'
(cd "$ROOT/server" && npm run build)
(cd "$ROOT/server" && npm start > "$ROOT/.local-smoke-server.log" 2>&1) &
SERVER_PID=$!
for attempt in {1..40}; do
  if curl --fail --silent http://127.0.0.1:4001/ready >/dev/null 2>&1; then break; fi
  if [ "$attempt" = 40 ]; then
    cat "$ROOT/.local-smoke-server.log" >&2 || true
    echo "API did not become ready." >&2
    exit 1
  fi
  sleep 2
done

printf '\n[9/9] Running read-only end-to-end smoke tests\n'
SERVER_BASE_URL=http://127.0.0.1:4001 node "$ROOT/scripts/e2e-smoke.mjs"
cleanup
SERVER_PID=""
rm -f "$ROOT/.local-smoke-server.log"

echo
echo "Local database setup, migration, seed, build and smoke tests completed."
echo "Start the apps in three terminals:"
echo "  cd server && npm run dev"
echo "  cd admin && npm run dev"
echo "  cd mobile && npm start"
