#!/usr/bin/env bash
# Puts the parts that are not moved to React yet next to the new hub in dist/:
# the careers copy, the team guide, privacy and about pages, logos, config.js, sw.js, manifest.
# Each one is removed from this list when its React version replaces it.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=..
VERSION="${VERSION:-$(git rev-parse --short=7 HEAD 2>/dev/null || date +%s)}"
cp "$ROOT"/config.js "$ROOT"/privacy.html "$ROOT"/about.html "$ROOT"/manifest.webmanifest "$ROOT"/sw.js dist/
cp -r "$ROOT"/apply "$ROOT"/help "$ROOT"/logos dist/
# a new address for the settings file on every publish, so browsers never use an old copy
sed -i "s#<script src=\"/config.js\"></script>#<script src=\"/config.js?v=${VERSION}\"></script>#" dist/index.html
grep -q "config.js?v=" dist/index.html
# Procurement: its logos and the made-up demo data (no real items, suppliers or prices) next to its page
cp -r procurement/logos procurement/demo-data.json dist/procurement/
sed -i "s#<script src=\"../config.js\"></script>#<script src=\"../config.js?v=${VERSION}\"></script>#" dist/hiring/index.html dist/apply/index.html dist/boards/index.html dist/procurement/index.html
echo "Added the pages not moved yet (version ${VERSION})"
