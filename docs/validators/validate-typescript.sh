#!/bin/bash
# TypeScript example validator for mdbook-validator
# This script runs inside the grounds-example-validator container OR on the host
#
# Input: TypeScript code via stdin
# Output: Exit 0 on success, non-zero on failure

set -euo pipefail

# Determine execution environment
IN_CONTAINER=false
if [ -d "/validator/packages" ]; then
  IN_CONTAINER=true
fi

if [ "$IN_CONTAINER" = true ]; then
  # --- Container execution ---
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

  # Install packages from tarballs
  if ! npm install /validator/packages/*.tgz --silent 2>/dev/null; then
    for pkg in /validator/packages/*.tgz; do
      npm install "$pkg" --silent 2>/dev/null || true
    done
  fi

  # Run the example
  tsx example.ts
else
  # --- Host execution ---
  # Find the project root
  PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")")")"

  # Create temp directory
  WORK_DIR=$(mktemp -d)
  trap 'rm -rf $WORK_DIR' EXIT

  cd "$WORK_DIR"

  # Copy the example code
  cat > example.ts

  # Create package.json
  cat > package.json << 'PKGJSON'
{
  "name": "example",
  "type": "module"
}
PKGJSON

  # Create a node_modules symlink to the project's node_modules
  # This allows the example to use the project's installed packages
  ln -s "$PROJECT_ROOT/node_modules" node_modules 2>/dev/null || true

  # If symlink fails, try creating a local npm package with the project as a dependency
  if [ ! -L node_modules ]; then
    # Use the project's dist files directly by setting NODE_PATH
    # Point tsx to look in the project's dist directory
    export NODE_PATH="$PROJECT_ROOT/node_modules"
  fi

  # Run the example with tsx
  # Use npx tsx with the proper NODE_PATH
  npx tsx example.ts
fi
