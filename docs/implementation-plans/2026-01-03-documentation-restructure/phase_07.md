# Documentation Restructure Implementation Plan - Phase 7

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-an-implementation-plan to implement this plan task-by-task.

**Goal:** Enable example validation during doc build

**Architecture:** Custom Docker image contains pre-packaged @grounds/* libraries. mdbook-validator runs TypeScript examples in this container during build. Build fails if any example throws.

**Tech Stack:** Docker, mdbook-validator, Node.js 24, tsx

**Scope:** 8 phases from original design (this is phase 7 of 8)

**Codebase verified:** 2026-01-03

---

## Phase 7: Validation Integration

**Goal:** Enable example validation during doc build

**Dependencies:** Phase 6 (all content exists)

---

### Task 1: Create Dockerfile for validator container

**Files:**
- Create: `docs/Dockerfile`

**Step 1: Create the Dockerfile**

```dockerfile
# Validator container for mdbook TypeScript example validation
# IMPORTANT: Node version must match mise.toml
FROM node:24-slim

WORKDIR /validator

# Copy pre-packaged library tarballs
# These are created by `npm pack` during the build process
COPY packages/*.tgz ./packages/

# Install tsx globally for running TypeScript
RUN npm install -g tsx

# Install peer dependencies that examples need
RUN npm install -g @sinclair/typebox luxon neverthrow

# Create directory for example execution
RUN mkdir -p /example

WORKDIR /example
```

**Step 2: Verify file was created**

Run: `cat docs/Dockerfile`
Expected: Dockerfile content matches above

**Step 3: Commit**

```bash
git add docs/Dockerfile
git commit -m "$(cat <<'EOF'
docs: add dockerfile for example validator container

Custom container based on node:24-slim that includes:
- Pre-packaged @grounds/* libraries
- tsx for TypeScript execution
- Peer dependencies (typebox, luxon, neverthrow)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Update validator script

**Files:**
- Modify: `docs/validators/validate-typescript.sh`

**Step 1: Update the validator script**

Replace the contents of `docs/validators/validate-typescript.sh` with:

```bash
#!/bin/bash
# TypeScript example validator for mdbook-validator
# This script runs inside the grounds-example-validator container
#
# Input: TypeScript code via stdin
# Output: Exit 0 on success, non-zero on failure

set -euo pipefail

# Create temp directory for the example
WORK_DIR=$(mktemp -d)
trap "rm -rf $WORK_DIR" EXIT

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
```

**Step 2: Make script executable**

Run: `chmod +x docs/validators/validate-typescript.sh`

**Step 3: Commit**

```bash
git add docs/validators/validate-typescript.sh
git commit -m "$(cat <<'EOF'
docs: update validator script for container environment

Script now:
- Creates temp directory for each example
- Installs @grounds/* packages from pre-built tarballs
- Runs TypeScript code with tsx

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Add script to build validator container

**Files:**
- Create: `docs/build-validator.sh`

**Step 1: Create the build script**

```bash
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
```

**Step 2: Make script executable**

Run: `chmod +x docs/build-validator.sh`

**Step 3: Commit**

```bash
git add docs/build-validator.sh
git commit -m "$(cat <<'EOF'
docs: add script to build validator container

Script builds packages, packs them into tarballs, and builds
the Docker image with the packages included.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Add packages directory to .gitignore

**Files:**
- Modify: `docs/.gitignore` (create if needed)

**Step 1: Create docs/.gitignore**

```
# Temporary package tarballs for validator build
packages/
```

**Step 2: Commit**

```bash
git add docs/.gitignore
git commit -m "$(cat <<'EOF'
docs: ignore temporary package tarballs

The packages/ directory is used during validator image build
and should not be committed.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Update book.toml to use custom container

**Files:**
- Modify: `docs/book.toml`

**Step 1: Update book.toml**

Replace the contents of `docs/book.toml` with:

```toml
[book]
title = "Grounds"
authors = ["Bojan Rajkovic"]
language = "en"

[build]
build-dir = "book"

[preprocessor.validator]
command = "mdbook-validator"

[preprocessor.validator.validators.typescript]
# Custom container with @grounds/* packages pre-installed
# Build with: ./docs/build-validator.sh
container = "grounds-example-validator:latest"
script = "validators/validate-typescript.sh"
```

**Step 2: Commit**

```bash
git add docs/book.toml
git commit -m "$(cat <<'EOF'
docs: configure mdbook-validator with custom container

Use grounds-example-validator:latest which contains
pre-packaged @grounds/* libraries.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Update root package.json with validator build

**Files:**
- Modify: `package.json`

**Step 1: Add docs:build-validator script**

Add to the `"scripts"` section of `package.json`:

```json
"docs:build-validator": "./docs/build-validator.sh",
"docs:build": "pnpm docs:build-validator && mdbook build docs",
"docs:serve": "mdbook serve docs"
```

Note: This updates the existing `docs:build` to include validator image build.

**Step 2: Commit**

```bash
git add package.json
git commit -m "$(cat <<'EOF'
chore: update docs scripts to build validator container

- Add docs:build-validator to build the Docker image
- Update docs:build to build validator before running mdbook

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Build and test validator container

**Files:**
- None (verification only)

**Step 1: Build the validator container**

Run: `pnpm docs:build-validator`

Expected output:
```
=== Building packages ===
...
=== Packing packages ===
Packing @grounds/core...
Packing @grounds/schema...
Packing @grounds/stream...
=== Building Docker image ===
...
=== Done ===
Validator image built: grounds-example-validator:latest
```

**Step 2: Verify image was created**

Run: `docker images | grep grounds-example-validator`

Expected: Image listed with `latest` tag

**Step 3: Test the validator script manually**

Run:
```bash
echo 'console.log("Hello from validator!");' | docker run -i --rm grounds-example-validator:latest bash -c 'cat > /tmp/test.ts && tsx /tmp/test.ts'
```

Expected: Output `Hello from validator!`

---

### Task 8: Test validation with full docs build

**Files:**
- None (verification only)

**Step 1: Build docs with validation**

Run: `pnpm docs:build`

Expected: Build succeeds with all examples validated

**Step 2: Verify validation ran**

Check build output for validation messages indicating examples were executed.

---

### Task 9: Add validator attributes to all example code blocks

**Files:**
- Modify: `docs/src/getting-started/first-encode.md`
- Modify: `docs/src/core-concepts/encoding.md`
- Modify: `docs/src/core-concepts/decoding.md`
- Modify: `docs/src/core-concepts/error-handling.md`
- Modify: `docs/src/schema/structs.md`
- Modify: `docs/src/schema/enums.md`
- Modify: `docs/src/schema/codecs.md`
- Modify: `docs/src/schema/optional-fields.md`
- Modify: `docs/src/streaming/async-generators.md`
- Modify: `docs/src/streaming/web-streams.md`

**Step 1: Update all TypeScript code blocks to include validator attribute**

For each file, change code fences from:

````markdown
```typescript
{{#include ../../../examples/core/encode-match.ts}}
```
````

To:

````markdown
```typescript validator=typescript
{{#include ../../../examples/core/encode-match.ts}}
```
````

**Files to update:**

**docs/src/getting-started/first-encode.md:**
- Add `validator=typescript` to the `{{#include}}` code block

**docs/src/core-concepts/encoding.md:**
- Add `validator=typescript` to all three `{{#include}}` code blocks (encode-match, encode-transform, encode-collections)

**docs/src/core-concepts/decoding.md:**
- Add `validator=typescript` to the `{{#include}}` code block (encode-roundtrip)

**docs/src/core-concepts/error-handling.md:**
- Add `validator=typescript` to the `{{#include}}` code block (encode-error)

**docs/src/schema/structs.md:**
- Add `validator=typescript` to the `{{#include}}` code block (defining-structs)

**docs/src/schema/enums.md:**
- Add `validator=typescript` to the `{{#include}}` code block (defining-enums)

**docs/src/schema/codecs.md:**
- Add `validator=typescript` to the `{{#include}}` code block (using-codecs)

**docs/src/schema/optional-fields.md:**
- Add `validator=typescript` to the `{{#include}}` code block (optional-fields)

**docs/src/streaming/async-generators.md:**
- Add `validator=typescript` to the `{{#include}}` code block (async-generators)

**docs/src/streaming/web-streams.md:**
- Add `validator=typescript` to the `{{#include}}` code block (web-streams)

**Note:** Only add `validator=typescript` to code blocks with `{{#include}}` that reference runnable example files. Do NOT add it to:
- Inline code snippets that are incomplete examples
- Code blocks showing partial syntax or pseudocode
- Non-TypeScript code blocks (bash commands, json, etc.)

**Step 2: Commit**

```bash
git add docs/src/
git commit -m "$(cat <<'EOF'
docs: add validator=typescript to example code blocks

Mark all included example code blocks for validation during
doc build. Only complete, runnable examples are validated.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Test validation with marked examples

**Files:**
- None (verification only)

**Step 1: Build docs with validation**

Run: `pnpm docs:build`

Expected: Build succeeds with all marked examples validated. Check output for messages indicating which code blocks were executed.

**Step 2: Verify validation is actually running**

The build output should show the validator executing each marked code block.

---

### Task 11: Test validation catches broken examples

**Files:**
- Modify: `docs/src/core-concepts/encoding.md` (temporarily)

**Step 1: Add a deliberately broken example**

Add this to `docs/src/core-concepts/encoding.md` temporarily:

````markdown
## Test Broken Example (Remove After Testing)

```typescript validator=typescript
throw new Error("Intentional error for testing validation");
```
````

**Step 2: Run build and verify it fails**

Run: `pnpm docs:build`

Expected: Build FAILS with error about the thrown error

**Step 3: Remove the broken example**

Remove the "Test Broken Example" section from `docs/src/core-concepts/encoding.md`.

**Step 4: Verify build succeeds again**

Run: `pnpm docs:build`

Expected: Build succeeds

---

## Phase 7 Verification

After completing all tasks:

- [ ] `docs/Dockerfile` exists and defines validator container
- [ ] `docs/build-validator.sh` exists and is executable
- [ ] `docs/validators/validate-typescript.sh` is updated for container environment
- [ ] `docs/book.toml` uses `grounds-example-validator:latest`
- [ ] `pnpm docs:build-validator` builds the Docker image
- [ ] All `{{#include}}` code blocks have `validator=typescript` attribute
- [ ] `pnpm docs:build` runs validation as part of doc build
- [ ] Broken examples cause build failure (tested and reverted)
- [ ] All examples pass validation

## Troubleshooting

### Docker Build Fails

1. Ensure Docker is running: `docker ps`
2. Check Dockerfile syntax
3. Verify packages build successfully: `pnpm build`

### Package Tarballs Not Found

1. Ensure `npm pack` ran successfully
2. Check package names match in Dockerfile and validator script
3. Verify version stripping in build script works

### Examples Fail to Run

1. Check the validator script has correct tarball paths
2. Ensure peer dependencies are installed in container
3. Test manually with `docker run -it grounds-example-validator:latest bash`
