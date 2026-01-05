#!/bin/bash
# TypeScript example validator - runs inside container only
# Input: TypeScript code via stdin
# Output: Exit 0 on success, non-zero on failure

set -euo pipefail

# Read code from stdin
cat > example.ts

# Create minimal package.json for ESM support
# All dependencies are pre-installed in /example/node_modules
cat > package.json << 'PKGJSON'
{
  "name": "example",
  "type": "module"
}
PKGJSON

# Run the example (node_modules already exists in /example)
npx tsx example.ts
