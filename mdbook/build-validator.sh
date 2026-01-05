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

echo "Building packages..."
cd "$ROOT_DIR"
pnpm build >/dev/null

echo "Packing packages..."
mkdir -p "$SCRIPT_DIR/packages"

# Pack each publishable package
for pkg in core schema stream; do
    cd "$ROOT_DIR/packages/$pkg"
    pnpm pack --pack-destination "$SCRIPT_DIR/packages" --silent >/dev/null
done

# Copy examples package.json for Dockerfile to use
cp "$ROOT_DIR/examples/package.json" "$SCRIPT_DIR/examples-package.json"

echo "Building Docker image..."
cd "$SCRIPT_DIR"
docker build -q -t grounds-example-validator:latest . 2>&1 >/dev/null

echo "Cleaning up..."
rm -rf "$SCRIPT_DIR/packages"
rm -f "$SCRIPT_DIR/examples-package.json"

echo "Validator image built: grounds-example-validator:latest"
echo
