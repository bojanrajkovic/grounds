#!/bin/bash
# Build the validator container image for mdbook example validation
#
# This script:
# 1. Builds all packages
# 2. Packs them into tarballs
# 3. Builds the Docker image with the tarballs included

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Building packages ==="
cd "$ROOT_DIR"
pnpm build

echo "=== Packing packages ==="
mkdir -p "$SCRIPT_DIR/packages"

# Pack each publishable package
for pkg in core schema stream; do
    echo "Packing @grounds/$pkg..."
    cd "$ROOT_DIR/packages/$pkg"
    npm pack --pack-destination "$SCRIPT_DIR/packages"
done

echo "=== Building Docker image ==="
cd "$SCRIPT_DIR"
docker build -t grounds-example-validator:latest .

echo "=== Cleaning up ==="
rm -rf "$SCRIPT_DIR/packages"

echo "=== Done ==="
echo "Validator image built: grounds-example-validator:latest"
