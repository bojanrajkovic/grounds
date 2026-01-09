# Git Hooks and CI Validation Implementation Plan - Phase 1

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Install Git hooks infrastructure and initialize Husky

**Architecture:** Install Husky v9+ as the Git hooks manager, along with lint-staged for staged file processing and commitlint for commit message validation. Husky installs hooks to `.husky/` directory and auto-installs via `prepare` script in package.json.

**Tech Stack:**
- Husky v9+ (Git hooks manager)
- lint-staged (staged file processor)
- commitlint (commit message validator)
- @commitlint/config-conventional (conventional commit rules)

**Scope:** Phase 1 of 5 from original design

**Codebase verified:** 2026-01-09 (all assumptions confirmed accurate)

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json` (add devDependencies)

**Step 1: Add dependencies to package.json**

Run the following command to add all required dependencies:

```bash
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional
```

This will:
- Add the four packages to `devDependencies` in root `package.json`
- Update `pnpm-lock.yaml` with resolved versions
- Install packages to `node_modules/`

**Step 2: Verify installation**

Run: `pnpm exec husky --version`
Expected: Shows installed Husky version (likely 9.x.x)

Run: `pnpm exec lint-staged --version`
Expected: Shows installed lint-staged version

Run: `pnpm exec commitlint --version`
Expected: Shows installed commitlint version

**Step 3: Commit dependency changes**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add Git hooks dependencies (husky, lint-staged, commitlint)"
```

---

## Task 2: Initialize Husky

**Files:**
- Modify: `package.json` (add prepare script)
- Create: `.husky/` directory

**Step 1: Initialize Husky**

Run the Husky initialization command:

```bash
pnpm exec husky init
```

This will:
- Create `.husky/` directory
- Add `"prepare": "husky"` script to package.json
- Create a sample pre-commit hook (we'll replace this in Phase 2)

**Step 2: Verify Husky initialization**

Check that `.husky/` directory exists:

```bash
ls -la .husky/
```

Expected: Directory exists with at least one hook file

Check that prepare script was added:

```bash
grep -A 1 '"scripts"' package.json | grep prepare
```

Expected: Shows `"prepare": "husky"` (or similar)

**Step 3: Test prepare script**

Run the prepare script to verify it works:

```bash
pnpm run prepare
```

Expected: No errors, completes successfully

**Step 4: Commit Husky initialization**

```bash
git add package.json .husky/
git commit -m "chore: initialize Husky for Git hooks management"
```

---

## Phase 1 Verification

After completing all tasks, verify the phase is complete:

**Verification 1: pnpm install succeeds**

```bash
# Simulate fresh install
rm -rf node_modules
pnpm install
```

Expected: Installs successfully, runs prepare script automatically

**Verification 2: .husky/ directory exists**

```bash
test -d .husky && echo "SUCCESS: .husky/ exists" || echo "FAIL: .husky/ missing"
```

Expected: SUCCESS

**Verification 3: package.json contains prepare script**

```bash
grep '"prepare"' package.json
```

Expected: Shows `"prepare": "husky"` line

**Verification 4: Husky version check**

```bash
pnpm exec husky --version
```

Expected: Displays version number (e.g., `9.1.7`)

**All verifications must pass before proceeding to Phase 2.**
