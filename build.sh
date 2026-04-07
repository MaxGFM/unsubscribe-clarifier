#!/usr/bin/env bash
# Reproducible build: produces an identical .xpi from an identical source tree.
# Anyone should be able to run this and get the same bytes as the AMO upload.
set -euo pipefail

VERSION=$(grep -o '"version": *"[^"]*"' manifest.json | head -1 | cut -d'"' -f4)
OUT="unsubscribe-clarifier-${VERSION}.xpi"

FILES=(
  manifest.json
  background.js
  content.js
  lexicons.js
  content.css
  fantasticIcon48.png
  fantasticIcon96.png
  _locales
)

rm -f "$OUT"

# Zero out timestamps so the zip is byte-identical across machines and times.
# -X strips extra file attributes. SOURCE_DATE_EPOCH is honored by zip 3.0+.
SOURCE_DATE_EPOCH=0 TZ=UTC zip -r -X -q "$OUT" "${FILES[@]}"

echo "Built: $OUT"
sha256sum "$OUT"