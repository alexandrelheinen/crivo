#!/usr/bin/env bash
# Runs every automated gate. CI runs this same script, so a green run here
# and a green run there mean the same thing.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> matcher tests, gated at 90% lines and branches"
node \
  --experimental-test-coverage \
  --test-coverage-lines=90 \
  --test-coverage-branches=90 \
  --test-coverage-include='matcher.js' \
  --test matcher.test.js

echo "==> manifest"
node scripts/check-manifest.js

echo
echo "All gates passed."
