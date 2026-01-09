# Git Hooks and CI Validation Implementation Plan - Phase 4

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Run full test suite before allowing push

**Architecture:** Create Husky pre-push hook that runs the existing test suite (`pnpm test`) before allowing push to remote. This provides the final local quality gate (~10-20 seconds) ensuring no test failures leave the local machine.

**Tech Stack:**
- Husky pre-push hook
- Vitest (existing test framework, configured in vitest.config.ts)
- Existing `pnpm test` command (runs `vitest run`)

**Scope:** Phase 4 of 5 from original design

**Codebase verified:** 2026-01-09 (`pnpm test` command confirmed working)

---

## Task 1: Create Pre-push Hook

**Files:**
- Create: `.husky/pre-push`

**Step 1: Create pre-push hook script**

Create `.husky/pre-push` with the following content:

```bash
#!/bin/sh
pnpm test
```

This script:
- Runs the full test suite via `pnpm test` (which runs `vitest run`)
- Tests all packages: `packages/*/tests/**/*.test.ts`
- Exits with non-zero if any tests fail (blocks push)
- Allows push if all tests pass

**Step 2: Make hook executable**

```bash
chmod +x .husky/pre-push
```

**Step 3: Verify hook file**

```bash
cat .husky/pre-push
```

Expected: Shows the two-line script

```bash
test -x .husky/pre-push && echo "SUCCESS: Hook is executable" || echo "FAIL: Hook not executable"
```

Expected: SUCCESS

**Step 4: Verify test command works**

```bash
pnpm test
```

Expected: All tests pass (green output from vitest)

**Step 5: Commit hook**

```bash
git add .husky/pre-push
git commit -m "chore: add pre-push hook for test suite validation"
```

---

## Phase 4 Verification

After completing all tasks, verify the phase works correctly with operational tests:

**Verification 1: Test suite passes (baseline)**

```bash
pnpm test
```

Expected: All tests pass with no failures

**Verification 2: Test blocking on failure (manual simulation)**

This verification requires manually breaking a test, committing, and attempting to push:

```bash
# Find an existing test file
ls packages/core/tests/*.test.ts
```

Pick one test file (e.g., `packages/core/tests/encoder.test.ts`)

1. Open the test file
2. Change an assertion to force failure (e.g., change `expect(result).toEqual(...)` to use wrong expected value)
3. Commit the change with `--no-verify` to bypass pre-commit:

```bash
git add packages/core/tests/encoder.test.ts
git commit --no-verify -m "test: intentionally broken test"
```

4. Try to push:

```bash
git push
```

Expected: Push blocked with vitest error output showing test failure

5. Restore the test file:

```bash
git reset --soft HEAD~1
git restore packages/core/tests/encoder.test.ts
```

**Verification 3: Test success on passing tests**

With all tests passing:

```bash
git push
```

Expected: Hook runs test suite (~10-20 seconds), all tests pass, push succeeds

Note: This only succeeds if you have a remote configured and tests actually pass. If no remote is configured, you'll get a different error (not from the hook).

**Verification 4: Verify bypass works**

```bash
git push --no-verify
```

Expected: Push proceeds without running tests (emergency bypass works)

**All verifications must pass before proceeding to Phase 5.**
