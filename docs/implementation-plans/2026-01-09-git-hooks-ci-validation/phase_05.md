# Git Hooks and CI Validation Implementation Plan - Phase 5

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Create CI validation workflow and fix existing workflow for reproducible builds

**Architecture:** Create new `.github/workflows/ci.yml` that mirrors all hook checks (lint → typecheck → test) and runs on every push/PR. Fix existing docs workflow to use `--frozen-lockfile`. Both workflows use mise for tooling and manual pnpm cache setup to avoid duplicate Node installation.

**Tech Stack:**
- GitHub Actions (CI orchestration)
- mise (tool version management from mise.toml)
- jdx/mise-action@v2 (GitHub Action for mise)
- actions/cache@v4 (pnpm store caching)

**Scope:** Phase 5 of 5 from original design

**Codebase verified:** 2026-01-09 (docs workflow confirmed uses mise-action pattern)

---

## Task 1: Create CI Workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create CI workflow file**

Create `.github/workflows/ci.yml` with the following content:

```yaml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Code Quality
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup mise
        uses: jdx/mise-action@v2

      # Cache pnpm store manually instead of using setup-node's built-in cache.
      # Rationale: mise-action already installs Node from mise.toml. Adding
      # setup-node would install Node twice, wasting time and resources.
      # Manual caching gives us the benefits of package caching without duplication.
      - name: Get pnpm store directory
        shell: bash
        run: echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm exec tsc --build

      - name: Test
        run: pnpm test
```

This workflow:
- Triggers on all branch pushes and PRs to main
- Uses mise to install Node 24 and pnpm 10.27.0 from mise.toml
- Caches pnpm store for faster subsequent runs
- Uses `--frozen-lockfile` to ensure reproducible builds
- Runs three quality checks sequentially:
  1. Lint (oxlint)
  2. Type check (tsc --build)
  3. Test (vitest run)

**Step 2: Verify workflow file syntax**

```bash
cat .github/workflows/ci.yml
```

Expected: Shows the YAML content exactly as written

Optionally, validate YAML syntax:

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"
```

Expected: No output (valid YAML)

**Step 3: Commit CI workflow**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add code quality validation workflow"
```

---

## Task 2: Fix Docs Workflow Lockfile

**Files:**
- Modify: `.github/workflows/docs.yml` (line 40)

**Step 1: Update docs workflow to use frozen lockfile**

Modify `.github/workflows/docs.yml` line 40:

**OLD:**
```yaml
      - name: Install dependencies
        run: pnpm install
```

**NEW:**
```yaml
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
```

**Step 2: Verify the change**

```bash
grep -A 1 "Install dependencies" .github/workflows/docs.yml
```

Expected: Shows the updated line with `--frozen-lockfile`

**Step 3: Commit docs workflow fix**

```bash
git add .github/workflows/docs.yml
git commit -m "ci(docs): use frozen lockfile for reproducible builds"
```

---

## Phase 5 Verification

After completing all tasks, verify the phase works correctly:

**Verification 1: Push to branch triggers CI**

Push your current branch to remote:

```bash
git push origin <branch-name>
```

Expected:
- GitHub Actions tab shows new "CI" workflow run
- Workflow runs all steps: checkout → mise → cache → install → lint → typecheck → test

**Verification 2: CI passes all checks**

Check the GitHub Actions run:

```bash
# Open in browser or use gh CLI:
gh run list --workflow=ci.yml
gh run view <run-id>
```

Expected:
- All steps complete successfully
- Lint step passes (green)
- Type check step passes (green)
- Test step passes (green)

**Verification 3: CI uses correct Node/pnpm versions**

Check the workflow logs for "Setup mise" step:

Expected output should show:
- Node 24.x.x installed
- pnpm 10.27.0 installed

**Verification 4: CI enforces frozen lockfile**

Test that lockfile enforcement works:

1. Modify `package.json` to add a dependency without updating `pnpm-lock.yaml`:

```bash
# Backup lockfile
cp pnpm-lock.yaml pnpm-lock.yaml.backup

# Add dependency to package.json manually (don't run pnpm add)
# This simulates the case where someone forgot to commit lockfile changes
```

2. Commit and push:

```bash
git add package.json
git commit -m "test: intentional lockfile mismatch"
git push origin <branch-name>
```

Expected: CI fails with error about lockfile mismatch

3. Restore:

```bash
git reset --soft HEAD~1
git restore package.json
mv pnpm-lock.yaml.backup pnpm-lock.yaml
```

**Verification 5: CI catches issues bypassed locally**

Test that CI catches code that bypassed local hooks:

1. Break lint (add syntax error):

```bash
echo "const x = 123;;" >> packages/core/src/test-file.ts
git add packages/core/src/test-file.ts
```

2. Commit with --no-verify (bypass pre-commit hook):

```bash
git commit --no-verify -m "test: bypass hooks"
```

3. Push:

```bash
git push origin <branch-name>
```

Expected: CI fails at "Lint" step with oxlint error

4. Restore:

```bash
git reset --soft HEAD~1
git restore packages/core/src/test-file.ts
```

**Verification 6: PR checks work**

Open a PR to main:

```bash
gh pr create --title "test: verify CI on PR" --body "Testing CI workflow"
```

Expected:
- PR shows "CI / Code Quality" check
- Check must pass before merge is allowed

Close the test PR:

```bash
gh pr close <pr-number>
```

**All verifications must pass. Phase 5 complete!**
