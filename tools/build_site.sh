#!/usr/bin/env bash
# Builds the public erp.forka.com site into _site/ (only the public files; never server/, platform/, tests/).
# Used by GitHub Pages (.github/workflows/test-and-deploy.yml) and by Firebase Hosting (firebase.json).
# VERSION: a short code put on config.js so browsers never use an old copy (git commit by default).
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION="${1:-$(git rev-parse --short=7 HEAD 2>/dev/null || date +%s)}"
rm -rf _site && mkdir _site
cp index.html config.js privacy.html about.html CNAME manifest.webmanifest sw.js _site/
cp -r hiring apply boards help logos _site/
sed -i "s#<script src=\"config.js\"></script>#<script src=\"config.js?v=${VERSION}\"></script>#" _site/index.html
grep -q "config.js?v=" _site/index.html
sed -i "s#<script src=\"../config.js\"></script>#<script src=\"../config.js?v=${VERSION}\"></script>#" _site/hiring/index.html _site/apply/index.html
echo "Built _site (version ${VERSION})"
