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

  # Try to install packages in the current directory
  # First, create a pnpm-workspace.yaml to understand the workspace:* protocol
  cat > pnpm-workspace.yaml << 'YAML'
packages:
  - "$PROJECT_ROOT/packages/*"
YAML

  # Pack the packages and try to install them
  # This will preserve the workspace: references
  mkdir -p ".packages"

  for pkg in core schema stream; do
    npm pack "$PROJECT_ROOT/packages/$pkg" --pack-destination ".packages" >/dev/null 2>&1 || true
  done

  # Try pnpm first (understands workspace:)
  if command -v pnpm >/dev/null 2>&1; then
    ls ".packages"/*.tgz 2>/dev/null | while read tgz; do
      pnpm install "$tgz" --silent 2>/dev/null || true
    done
  fi

  # If pnpm didn't work or isn't available, try npm with individual packages
  if [ ! -d "node_modules/@grounds" ]; then
    ls ".packages"/*.tgz 2>/dev/null | while read tgz; do
      npm install "$tgz" --silent 2>/dev/null || true
    done
  fi

  # If still no packages, set NODE_PATH to project's node_modules as fallback
  if [ ! -d "node_modules/@grounds" ]; then
    export NODE_PATH="$PROJECT_ROOT/node_modules"
  fi

  # Run the example with tsx
  npx tsx example.ts
fi
