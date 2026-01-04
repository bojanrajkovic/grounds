#!/bin/bash
# TypeScript example validator for mdbook-validator
# This script runs inside the Docker container specified in book.toml
#
# IMPORTANT: Container image node version must match mise.toml node version
#
# Input: TypeScript code via stdin
# Output: Exit 0 on success, non-zero on failure

set -euo pipefail

# Create temp file for the TypeScript code
TEMP_FILE=$(mktemp --suffix=.ts)
trap "rm -f $TEMP_FILE" EXIT

# Read code from stdin
cat > "$TEMP_FILE"

# Install tsx if not present (for running TypeScript directly)
if ! command -v tsx &> /dev/null; then
    npm install -g tsx
fi

# Run the TypeScript file
tsx "$TEMP_FILE"
