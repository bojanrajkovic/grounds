# Git Hooks and CI Validation Implementation Plan - Phase 3

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Enforce conventional commit format with package scope validation

**Architecture:** Configure commitlint to enforce conventional commit format (`type(scope): description`) and validate that scope matches actual package names (core, schema, stream, test-utils). Create Husky commit-msg hook that runs commitlint on every commit message.

**Tech Stack:**
- commitlint (commit message validator)
- @commitlint/config-conventional (conventional commit rules)
- Husky commit-msg hook

**Scope:** Phase 3 of 5 from original design

**Codebase verified:** 2026-01-09 (four packages confirmed: core, schema, stream, test-utils)

---

## Task 1: Create commitlint Configuration

**Files:**
- Create: `.commitlintrc.json`

**Step 1: Create .commitlintrc.json**

Create the file with the following content:

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "scope-empty": [0],
    "scope-enum": [2, "always", ["core", "schema", "stream", "test-utils"]]
  }
}
```

This configuration:
- Extends `@commitlint/config-conventional` which provides:
  - Valid types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf`, `style`, `build`, `revert`
  - Format enforcement: `type(scope): description` or `type: description`
  - Description min length: 1 character
- Adds custom rules:
  - `scope-empty` disabled (level 0) - allows commits without scope (e.g., `chore: update deps`)
  - `scope-enum` at level 2 (error) - when scope is present, must be one of: core, schema, stream, test-utils

**Step 2: Verify configuration file**

```bash
cat .commitlintrc.json
```

Expected: Shows the JSON configuration exactly as written

```bash
echo "feat(core): test message" | pnpm exec commitlint
```

Expected: No output (valid commit message passes)

```bash
echo "invalid message" | pnpm exec commitlint
```

Expected: Error output showing format violation

**Step 3: Commit configuration**

```bash
git add .commitlintrc.json
git commit -m "chore: add commitlint configuration for conventional commits"
```

---

## Task 2: Create Commit-msg Hook

**Files:**
- Create: `.husky/commit-msg`

**Step 1: Create commit-msg hook script**

Create `.husky/commit-msg` with the following content:

```bash
#!/bin/sh
pnpm exec commitlint --edit $1
```

This script:
- Runs commitlint with `--edit $1` flag
- `$1` is the path to `.git/COMMIT_EDITMSG` (passed by Git automatically)
- `--edit` tells commitlint to read the commit message from that file
- Exits with non-zero if validation fails (blocks commit)

**Step 2: Make hook executable**

```bash
chmod +x .husky/commit-msg
```

**Step 3: Verify hook file**

```bash
cat .husky/commit-msg
```

Expected: Shows the two-line script

```bash
test -x .husky/commit-msg && echo "SUCCESS: Hook is executable" || echo "FAIL: Hook not executable"
```

Expected: SUCCESS

**Step 4: Commit hook**

```bash
git add .husky/commit-msg
git commit -m "chore: add commit-msg hook for message validation"
```

---

## Phase 3 Verification

After completing all tasks, verify the phase works correctly with operational tests:

**Verification 1: Test invalid format blocking**

```bash
git commit --allow-empty -m "bad message"
```

Expected: Commit blocked with commitlint error output showing format violation

**Verification 2: Test invalid scope blocking**

```bash
git commit --allow-empty -m "feat(typo): test invalid scope"
```

Expected: Commit blocked with error showing "typo" is not in scope-enum

```bash
git commit --allow-empty -m "feat(invalid-pkg): test"
```

Expected: Commit blocked with error showing "invalid-pkg" is not in scope-enum

**Verification 3: Test valid scopes accepted**

Test each valid scope:

```bash
git commit --allow-empty -m "feat(core): test core scope"
git commit --allow-empty -m "feat(schema): test schema scope"
git commit --allow-empty -m "feat(stream): test stream scope"
git commit --allow-empty -m "feat(test-utils): test test-utils scope"
```

Expected: All four commits succeed

**Verification 4: Test valid types accepted**

Test various valid types:

```bash
git commit --allow-empty -m "fix(core): test fix type"
git commit --allow-empty -m "docs(core): test docs type"
git commit --allow-empty -m "chore(core): test chore type"
git commit --allow-empty -m "refactor(core): test refactor type"
git commit --allow-empty -m "test(core): test test type"
git commit --allow-empty -m "ci(core): test ci type"
```

Expected: All commits succeed

**Verification 5: Test scopeless commits accepted**

Test commits without scope (cross-cutting changes):

```bash
git commit --allow-empty -m "chore: update dependencies"
git commit --allow-empty -m "docs: fix typo in README"
git commit --allow-empty -m "ci: update workflow"
```

Expected: All three commits succeed (scope is optional)

**Verification 6: Clean up test commits**

Record the current commit before creating test commits:

```bash
BEFORE_TESTS=$(git rev-parse HEAD)
```

After all verifications (1-5) complete, reset to the commit before tests:

```bash
git reset --hard $BEFORE_TESTS
```

This removes all test commits created during verification without needing to count them.

**All verifications must pass before proceeding to Phase 4.**
