#!/usr/bin/env bash
# Builds the front-end-only site as plain files for GitHub Pages, into ./pages-out.
#
#   bash scripts/build-pages.sh            # works on a temporary copy; your folder is never changed
#   BASE_PATH=/my-repo bash scripts/...    # the repo name GitHub Pages serves the site under
#
# What changes for the plain-files build (on the copy only):
#   - server-only parts are left out: API routes, /admin, sign-in callbacks, print-status lookups, middleware
#   - pages that render per request are rendered once, at build time (force-dynamic → force-static)
# Everything a visitor saves is in their browser anyway, so nothing they can do needs a server.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
BASE_PATH=${BASE_PATH-/discover-egypt}
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

rsync -a --exclude node_modules --exclude .next --exclude .git --exclude out --exclude pages-out --exclude '.env*' "$ROOT/" "$WORK/"
cp -r "$ROOT/node_modules" "$WORK/node_modules" 2>/dev/null || ln -s "$ROOT/node_modules" "$WORK/node_modules"
cd "$WORK"

rm -rf src/app/api src/app/admin src/app/auth src/app/account/new-password src/app/memory-hunt/print src/middleware.ts
grep -rl 'export const dynamic = "force-dynamic";' src/app | xargs -r sed -i 's/export const dynamic = "force-dynamic";/export const dynamic = "force-static";/'

env STATIC_EXPORT=true NEXT_PUBLIC_STATIC_EXPORT=true NEXT_PUBLIC_BASE_PATH="$BASE_PATH" \
  DEMO_LOCAL_MODE=false NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= NEXT_PUBLIC_SUPABASE_ANON_KEY= \
  SUPABASE_SECRET_KEY= SUPABASE_SERVICE_ROLE_KEY= NEXT_TELEMETRY_DISABLED=1 \
  npx next build

rm -rf "$ROOT/pages-out"
cp -r out "$ROOT/pages-out"
touch "$ROOT/pages-out/.nojekyll" # serve the _next/ folder as-is
echo "Built $(find "$ROOT/pages-out" -name '*.html' | wc -l) pages into pages-out/ (served under ${BASE_PATH:-/})"
