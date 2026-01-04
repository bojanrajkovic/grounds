#!/bin/bash
# TypeScript example validator for mdbook-validator
# This script runs inside the grounds-example-validator container
#
# Input: TypeScript code via stdin
# Output: Exit 0 on success, non-zero on failure

set -euo pipefail

# Create temp directory for the example
WORK_DIR=$(mktemp -d)
trap 'rm -rf $WORK_DIR' EXIT

cd "$WORK_DIR"

# Read code from stdin
cat > example.ts

# Initialize a minimal package.json for ESM support
cat > package.json << 'PKGJSON'
{
  "name": "example",
  "type": "module"
}
PKGJSON

# Install the packages directly from tarballs (handles any version)
npm install /validator/packages/*.tgz --silent 2>/dev/null

# Run the example
tsx example.ts
