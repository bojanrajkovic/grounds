# Documentation Restructure Implementation Plan - Phase 1

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-an-implementation-plan to implement this plan task-by-task.

**Goal:** Add mdBook and validation infrastructure for documentation builds

**Architecture:** Three-layer documentation system with examples layer, documentation layer, and validation layer. This phase sets up the tooling foundation.

**Tech Stack:** Node.js 24, pnpm, Rust 1.92.0, mdBook, mdbook-validator, tsx

**Scope:** 8 phases from original design (this is phase 1 of 8)

**Codebase verified:** 2026-01-03

---

## Phase 1: Tooling Setup

**Goal:** Add mdBook and validation infrastructure

**Dependencies:** None (first phase)

---

### Task 1: Update mise.toml with documentation tooling

**Files:**
- Modify: `mise.toml`

**Step 1: Update mise.toml to add Rust and mdBook tools**

Replace the contents of `mise.toml` with:

```toml
[tools]
node = "24"
pnpm = "10.27.0"
rust = "1.92.0"
"cargo:mdbook" = "latest"
"cargo:mdbook-validator" = "latest"
"npm:@anthropic-ai/claude-code" = "latest"
```

**Step 2: Run mise install to verify tools install**

Run: `mise install`
Expected: All tools install successfully, including rust, mdbook, and mdbook-validator

**Step 3: Verify mdbook is available**

Run: `mdbook --version`
Expected: Version output (e.g., `mdbook v0.4.x`)

**Step 4: Commit**

```bash
git add mise.toml
git commit -m "$(cat <<'EOF'
chore: add rust and mdbook tooling to mise.toml

Add documentation build tooling:
- Pin Node to 24 (explicit LTS)
- Add Rust 1.92.0 for mdbook compilation
- Add cargo:mdbook for documentation generation
- Add cargo:mdbook-validator for example validation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add tsx dev dependency for running examples

**Files:**
- Modify: `package.json`

**Step 1: Install tsx as dev dependency**

Run: `pnpm add -D tsx`
Expected: tsx added to devDependencies in root package.json

**Step 2: Verify tsx works with an existing example**

Run: `pnpm exec tsx examples/basic-usage.ts`
Expected: Example runs and produces output (encoding primitives, arrays, decoding, etc.)

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: add tsx for running TypeScript examples

Add tsx dev dependency to enable direct execution of TypeScript
example files without compilation step.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create mdBook configuration

**Files:**
- Create: `docs/book.toml`

**Step 1: Create docs/book.toml**

```toml
[book]
title = "Grounds"
authors = ["Bojan Rajkovic"]
language = "en"

[build]
build-dir = "book"

# Validator preprocessor configuration
# Disabled until Phase 7 when examples are ready
# [preprocessor.validator]
# command = "mdbook-validator"
#
# [preprocessor.validator.validators.typescript]
# # IMPORTANT: Keep container version in sync with mise.toml node version
# container = "node:24"
# script = "validators/validate-typescript.sh"
```

**Step 2: Verify file was created correctly**

Run: `cat docs/book.toml`
Expected: Configuration content matches above

**Step 3: Commit**

```bash
git add docs/book.toml
git commit -m "$(cat <<'EOF'
docs: add mdbook configuration

Add initial book.toml for mdBook documentation generation.
Validator preprocessor is commented out until Phase 7.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Create validator script placeholder

**Files:**
- Create: `docs/validators/validate-typescript.sh`

**Step 1: Create validators directory**

Run: `mkdir -p docs/validators`

**Step 2: Create validate-typescript.sh**

```bash
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
```

**Step 3: Make script executable**

Run: `chmod +x docs/validators/validate-typescript.sh`

**Step 4: Verify script is executable**

Run: `ls -la docs/validators/validate-typescript.sh`
Expected: File shows executable permissions (-rwxr-xr-x or similar)

**Step 5: Commit**

```bash
git add docs/validators/
git commit -m "$(cat <<'EOF'
docs: add typescript validator script for mdbook

Add placeholder validator script that will run TypeScript examples
inside Docker container during doc build. Script installs tsx
and executes the example code.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Create initial SUMMARY.md placeholder

**Files:**
- Create: `docs/src/SUMMARY.md`
- Create: `docs/src/introduction.md`

**Step 1: Create docs/src directory**

Run: `mkdir -p docs/src`

**Step 2: Create SUMMARY.md with placeholder structure**

```markdown
# Summary

[Introduction](./introduction.md)

# Getting Started

- [Installation](./getting-started/installation.md)
- [First Encode](./getting-started/first-encode.md)

# Core Concepts

- [Encoding](./core-concepts/encoding.md)
- [Decoding](./core-concepts/decoding.md)
- [Error Handling](./core-concepts/error-handling.md)

# Schema

- [Structs](./schema/structs.md)
- [Enums](./schema/enums.md)
- [Codecs](./schema/codecs.md)
- [Optional Fields](./schema/optional-fields.md)

# Streaming

- [Async Generators](./streaming/async-generators.md)
- [Web Streams](./streaming/web-streams.md)

# Reference

- [Type Codes](./reference/type-codes.md)
- [Wire Format](./reference/wire-format.md)
```

**Step 3: Create placeholder introduction.md**

```markdown
# Grounds

TypeScript implementation of [Relish](https://github.com/alex/relish), a compact binary serialization format.

This documentation is under construction.
```

**Step 4: Commit**

```bash
git add docs/src/
git commit -m "$(cat <<'EOF'
docs: add mdbook summary and introduction placeholder

Add initial documentation structure with SUMMARY.md defining
the user journey through the documentation. Placeholder files
will be populated in subsequent phases.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Add docs scripts to root package.json

**Files:**
- Modify: `package.json`

**Step 1: Add docs:build and docs:serve scripts**

Add to the `"scripts"` section of `package.json`:

```json
"docs:build": "pnpm build && mdbook build docs",
"docs:serve": "mdbook serve docs"
```

**Step 2: Run docs:build to verify mdBook works**

Run: `pnpm docs:build`
Expected: Build may fail with missing files (placeholder pages don't exist), but mdbook should run and parse SUMMARY.md

**Step 3: Commit**

```bash
git add package.json
git commit -m "$(cat <<'EOF'
chore: add documentation build scripts

Add pnpm scripts for building and serving documentation:
- docs:build: Build packages first, then generate mdbook docs
- docs:serve: Serve docs locally for development

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Add docs/book to .gitignore

**Files:**
- Modify: `.gitignore`

**Step 1: Add docs/book/ to .gitignore**

Append to `.gitignore`:

```
# mdBook build output
docs/book/
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "$(cat <<'EOF'
chore: ignore mdbook build output

Add docs/book/ to .gitignore to prevent committing
generated documentation files.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 1 Verification

After completing all tasks:

- [ ] `mise install` succeeds with new tools
- [ ] `pnpm exec tsx examples/basic-usage.ts` runs existing example successfully
- [ ] `pnpm docs:build` runs (may fail on missing placeholder pages, but tooling works)
- [ ] `docs/validators/validate-typescript.sh` is executable
