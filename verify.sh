#!/usr/bin/env bash
# Verify a downloaded .xpi matches what this source tree would produce.
# Usage: ./verify.sh path/to/downloaded.xpi
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <path-to-xpi>"
  exit 1
fi

DOWNLOADED="$1"
./build.sh > /dev/null
BUILT=$(ls unsubscribe-clarifier-*.xpi | head -1)

DOWNLOADED_HASH=$(sha256sum "$DOWNLOADED" | cut -d' ' -f1)
BUILT_HASH=$(sha256sum "$BUILT" | cut -d' ' -f1)

echo "Downloaded: $DOWNLOADED_HASH"
echo "Built:      $BUILT_HASH"

if [ "$DOWNLOADED_HASH" = "$BUILT_HASH" ]; then
  echo "MATCH: the downloaded .xpi was built from this source tree."
  exit 0
else
  echo "MISMATCH: the downloaded .xpi does NOT match this source tree."
  exit 1
fi