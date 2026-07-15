#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

step() { printf '\n[%s/11] %s\n' "$1" "$2"; }

step 1 "Assignment-wide static audit"
node "$ROOT/scripts/static-audit.mjs"

step 2 "TypeScript/TSX syntax transpilation (including Prisma seed)"
node "$ROOT/scripts/syntax-check.mjs"

step 3 "Server semantic type-check"
(cd "$ROOT/server" && npm run typecheck:offline)

step 4 "Mobile strict type-check"
(cd "$ROOT/mobile" && npm run typecheck)

step 5 "Admin production build"
(cd "$ROOT/admin" && npm run build)

step 6 "JSON validation"
python3 - "$ROOT" <<'PY'
import json, pathlib, sys
root=pathlib.Path(sys.argv[1])
count=0
for path in root.rglob('*.json'):
    if 'node_modules' not in path.parts and 'dist' not in path.parts and 'build' not in path.parts:
        json.loads(path.read_text())
        count += 1
print(f'{count} JSON files are valid.')
PY

step 7 "Merge-conflict and accidental debug scan"
if grep -RInE '^(<<<<<<<|=======|>>>>>>>)' \
  "$ROOT/server/src" "$ROOT/server/prisma" "$ROOT/admin/src" "$ROOT/mobile/src" >/dev/null; then
  echo "Release-blocking merge-conflict marker found." >&2
  exit 1
fi
if grep -RInE 'TODO_SUBMISSION_BLOCKER|FIXME_SUBMISSION_BLOCKER' \
  "$ROOT/server/src" "$ROOT/server/prisma" "$ROOT/admin/src" "$ROOT/mobile/src" >/dev/null; then
  echo "Release-blocking TODO marker found." >&2
  exit 1
fi

step 8 "Secret and signing-file scan"
if find "$ROOT" -type f \( -name '.env' -o -name '.env.local' -o -name '*.keystore' -o -name '*.jks' -o -name '*.p12' -o -name '*.mobileprovision' \) \
  -not -path '*/node_modules/*' | grep -q .; then
  echo "Release-blocking secret or signing file found." >&2
  exit 1
fi

step 9 "Production URL placeholder scan"
if grep -E "localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\." \
  "$ROOT/admin/.env.production.example" "$ROOT/mobile/.env.production.example" >/dev/null; then
  echo "Production environment examples still contain local URLs." >&2
  exit 1
fi

step 10 "Portable npm lockfiles"
if grep -RIE "applied-caas|ace-research|internal\.api\.openai|artifactory/api/npm" \
  "$ROOT/server/package-lock.json" "$ROOT/admin/package-lock.json" "$ROOT/mobile/package-lock.json" >/dev/null; then
  echo "Package lock contains a private registry URL." >&2
  exit 1
fi
for app in server admin mobile; do
  (cd "$ROOT/$app" && npm ci --ignore-scripts --dry-run --no-audit --no-fund >/dev/null)
done

step 11 "Migration and submission assets"
test -f "$ROOT/server/prisma/migrations/migration_lock.toml"
find "$ROOT/server/prisma/migrations" -mindepth 2 -maxdepth 2 -name migration.sql -print -quit | grep -q .
test -f "$ROOT/mobile/eas.json"
test -f "$ROOT/DEPLOYMENT.md"
test -f "$ROOT/APK_BUILD.md"
test -f "$ROOT/DEMO_VIDEO_SCRIPT.md"

echo
echo "Release source checks passed."
echo "On an internet-enabled machine, also run Prisma generation/validation, MySQL migration + seed, and scripts/e2e-smoke.mjs before deployment."
