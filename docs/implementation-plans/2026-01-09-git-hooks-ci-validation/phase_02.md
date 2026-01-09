# Git Hooks and CI Validation Implementation Plan - Phase 2

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement linting and type checking on staged files via pre-commit hook

**Architecture:** Configure lint-staged to run oxlint and TypeScript type checking on staged `.ts`/`.tsx` files only. Create Husky pre-commit hook that delegates to lint-staged. This provides fast local feedback (~3-5 seconds) by scoping validation to changed files only.

**Tech Stack:**
- lint-staged (staged file processor)
- oxlint (linter, already configured in oxlint.json)
- TypeScript compiler (type checker, already configured in tsconfig.base.json)
- Husky pre-commit hook

**Scope:** Phase 2 of 5 from original design

**Codebase verified:** 2026-01-09

---

## Task 1: Create lint-staged Configuration

**Files:**
- Create: `.lintstagedrc.json`

**Step 1: Create .lintstagedrc.json**

Create the file with the following content:

```json
{
  "*.{ts,tsx}": [
    "oxlint --deny-warnings",
    "tsc --noEmit --skipLibCheck"
  ]
}
```

This configuration:
- Matches all staged `.ts` and `.tsx` files
- Runs two commands sequentially:
  1. `oxlint --deny-warnings` - Treats warnings as errors (fails on any lint issue)
  2. `tsc --noEmit --skipLibCheck` - Type checks without emitting files, skips library checks for speed

**Step 2: Verify configuration file**

```bash
cat .lintstagedrc.json
```

Expected: Shows the JSON configuration exactly as written

```bash
pnpm exec lint-staged --help
```

Expected: Shows lint-staged help (confirms binary is accessible)

**Step 3: Commit configuration**

```bash
git add .lintstagedrc.json
git commit -m "chore: add lint-staged configuration for pre-commit checks"
```

---

## Task 2: Create Pre-commit Hook

**Files:**
- Create: `.husky/pre-commit`

**Step 1: Create pre-commit hook script**

Create `.husky/pre-commit` with the following content:

```bash
#!/bin/sh
pnpm exec lint-staged
```

This script:
- Runs lint-staged which processes all staged files according to `.lintstagedrc.json`
- Exits with non-zero if any command fails (blocks commit)

**Step 2: Make hook executable**

```bash
chmod +x .husky/pre-commit
```

**Step 3: Verify hook file**

```bash
cat .husky/pre-commit
```

Expected: Shows the two-line script

```bash
test -x .husky/pre-commit && echo "SUCCESS: Hook is executable" || echo "FAIL: Hook not executable"
```

Expected: SUCCESS

**Step 4: Commit hook**

```bash
git add .husky/pre-commit
git commit -m "chore: add pre-commit hook for lint and type checking"
```

---

## Phase 2 Verification

After completing all tasks, verify the phase works correctly with operational tests:

**Verification 1: Test lint blocking**

Create a file with intentional lint error:

```bash
cat > packages/core/src/test-file.ts << 'EOF'
// pattern: Functional Core
const x = 123;;
EOF
git add packages/core/src/test-file.ts
git commit -m "test: should fail"
```

Expected: Commit blocked with oxlint error output showing double semicolon syntax error

```bash
rm packages/core/src/test-file.ts
```

**Verification 2: Test type checking blocking**

Create a file with intentional type error:

```bash
cat > packages/core/src/test-file.ts << 'EOF'
// pattern: Functional Core
const x: number = 'string';
EOF
git add packages/core/src/test-file.ts
git commit -m "test: should fail"
```

Expected: Commit blocked with tsc error output showing type mismatch

```bash
rm packages/core/src/test-file.ts
```

**Verification 3: Test clean files succeed**

Create a valid file:

```bash
cat > packages/core/src/test-file.ts << 'EOF'
// pattern: Functional Core
export const validCode = 42;
EOF
git add packages/core/src/test-file.ts
git commit -m "test: should succeed"
```

Expected: Commit succeeds (hook runs, finds no errors, allows commit)

```bash
git reset --soft HEAD~1
git restore --staged packages/core/src/test-file.ts
rm packages/core/src/test-file.ts
```

**Verification 4: Confirm staged-only checking**

Create a file with an error but don't stage it:

```bash
echo "const x = 123;;" >> packages/core/src/unstaged-file.ts
git commit --allow-empty -m "test: unstaged errors ignored"
```

Expected: Commit succeeds (lint-staged ignores unstaged files)

```bash
rm packages/core/src/unstaged-file.ts
```

**All verifications must pass before proceeding to Phase 3.**
