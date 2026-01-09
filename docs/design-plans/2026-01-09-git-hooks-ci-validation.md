# Git Hooks and CI Validation Design

## Overview

Implement layered code quality validation using Git hooks for local developer feedback and GitHub Actions for server-side enforcement. System enforces linting, type checking, testing, and conventional commit format before code enters version control and remote repository.

**Goals:**
- Provide fast local feedback (3-5 sec commits, 10-20 sec pushes)
- Prevent broken code from entering git history
- Enforce conventional commit format with package scope validation
- Provide server-side enforcement via CI even when hooks bypassed
- Maintain consistency with existing tooling (oxlint, vitest, TypeScript)

**Success criteria:**
- Commits with lint/type errors blocked at pre-commit
- Commits with invalid messages blocked at commit-msg
- Pushes with test failures blocked at pre-push
- CI mirrors all hook checks and runs on every push/PR
- Installation automatic via `pnpm install` for new contributors

## Architecture

Three-layered validation strategy:

**Layer 1: Local Git Hooks (Developer Experience)**

Managed by Husky v9+, installed to `.husky/` directory:

- `pre-commit`: Validates staged files before commit
  - Runs oxlint on staged `.ts`/`.tsx` files via lint-staged
  - Runs TypeScript type checking on staged files via lint-staged
  - Fast scoped validation (~3-5 seconds)

- `commit-msg`: Validates commit message format
  - Enforces conventional commits via commitlint
  - Validates scope against package names (core, schema, stream, test-utils)
  - Uses `@commitlint/config-conventional` base rules

- `pre-push`: Validates test suite before push
  - Runs full test suite via `pnpm test`
  - Blocks push on any test failures (~10-20 seconds)

**Layer 2: CI/CD Pipeline (Server-Side Enforcement)**

GitHub Actions workflow (`.github/workflows/ci.yml`):
- Triggers: Every push to any branch, every PR to main
- Steps: lint → typecheck → test (sequential)
- Uses mise for tooling (Node 24, pnpm 10.27.0 from mise.toml)
- Manually caches pnpm store (avoids duplicate Node installation)
- Provides enforcement even when `--no-verify` used locally

**Layer 3: Emergency Bypass**

Developers can bypass hooks with `git commit --no-verify` / `git push --no-verify` in emergencies. CI catches issues that bypass local hooks. Code review provides final quality gate.

**Tool Stack:**
- **Husky**: Git hooks manager (installs via `prepare` script)
- **lint-staged**: Staged file processor (runs commands on git add files only)
- **commitlint**: Commit message validator (extends conventional config)
- **GitHub Actions**: CI orchestration (mirrors all hook checks)

## Existing Patterns

Investigation found existing validation infrastructure:

**Linting:**
- oxlint configured in `oxlint.json`
- Command: `pnpm lint` runs `oxlint --deny-warnings`
- Rules: `no-unused-vars` (error), `no-console` (warn), `eqeqeq` (error)

**Testing:**
- Vitest configured in `vitest.config.ts`
- Command: `pnpm test` runs `vitest run`
- Test location: `packages/*/tests/**/*.test.ts`

**Type Checking:**
- TypeScript 5.7.2 with strict configuration
- Base config: `tsconfig.base.json` extends `@tsconfig/strictest/2.0.5`
- Per-package configs extend base

**CI Patterns:**
- Existing docs workflow (`.github/workflows/docs.yml`) uses mise-action
- Manual pnpm cache setup (avoids duplicate Node installation via setup-node)
- Pattern: Get pnpm store path → cache store → install with lockfile

**Divergence:**
- Existing docs workflow uses `pnpm install` without `--frozen-lockfile`
- This design fixes both workflows to use `--frozen-lockfile` for reproducibility

**No Existing Patterns:**
- No Git hooks currently configured (`.git/hooks/` only has sample files)
- No commit message validation
- No CI validation for code quality (only docs deployment)

This design introduces hooks and CI while integrating with existing tooling.

## Implementation Phases

### Phase 1: Dependencies and Husky Setup

**Goal:** Install Git hooks infrastructure and initialize Husky

**Components:**
- Modify: `package.json` (add devDependencies and prepare script)
- Create: `.husky/` directory (via husky init)
- Install: `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`

**Dependencies:** None (first phase)

**Done when:**
- `pnpm install` succeeds
- `.husky/` directory exists
- `package.json` contains `"prepare": "husky"` script
- `pnpm exec husky --version` shows installed version

### Phase 2: Pre-commit Hook Configuration

**Goal:** Implement linting and type checking on staged files

**Components:**
- Create: `.lintstagedrc.json` (lint-staged configuration)
- Create: `.husky/pre-commit` (hook script)

**Dependencies:** Phase 1 (Husky installed)

**Done when:**
- Committing file with lint error blocks commit with oxlint error output
- Committing file with type error blocks commit with tsc error output
- Committing clean files succeeds
- Hook only checks staged files (not entire codebase)

**Verification commands:**
```bash
# Test lint blocking
echo "const x = 123;;" >> packages/core/src/test-file.ts
git add packages/core/src/test-file.ts
git commit -m "test: should fail"  # Expected: blocked by oxlint

# Test type checking blocking
echo "const x: number = 'string';" >> packages/core/src/test-file.ts
git add packages/core/src/test-file.ts
git commit -m "test: should fail"  # Expected: blocked by tsc

# Cleanup
git restore packages/core/src/test-file.ts
```

### Phase 3: Commit Message Validation

**Goal:** Enforce conventional commit format with package scope validation

**Components:**
- Create: `.commitlintrc.json` (commitlint configuration)
- Create: `.husky/commit-msg` (hook script)

**Dependencies:** Phase 1 (Husky installed)

**Done when:**
- Commit with invalid format blocked: `git commit -m "bad message"` fails
- Commit with invalid scope blocked: `git commit -m "feat(invalid): test"` fails
- Commit with valid format succeeds: `git commit -m "feat(core): test"` succeeds
- Valid types accepted: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf`
- Valid scopes enforced: `core`, `schema`, `stream`, `test-utils`

**Verification commands:**
```bash
# Test invalid format
git commit --allow-empty -m "bad message"  # Expected: blocked

# Test invalid scope
git commit --allow-empty -m "feat(typo): test"  # Expected: blocked

# Test valid commit
git commit --allow-empty -m "feat(core): test"  # Expected: succeeds
```

### Phase 4: Pre-push Testing Hook

**Goal:** Run full test suite before allowing push

**Components:**
- Create: `.husky/pre-push` (hook script)

**Dependencies:**
- Phase 1 (Husky installed)
- Existing test infrastructure (`pnpm test` command)

**Done when:**
- Breaking a test and pushing blocks push with test failure output
- All tests passing allows push to succeed
- Hook runs `pnpm test` (full test suite across all packages)

**Verification commands:**
```bash
# Test blocking on failure (manual test - break a test, commit, try to push)
# Expected: Push blocked with vitest error output

# Test success on passing (with all tests passing)
git push  # Expected: Succeeds after ~10-20 seconds
```

### Phase 5: CI Workflow and Workflow Fixes

**Goal:** Create CI validation workflow and fix existing workflow

**Components:**
- Create: `.github/workflows/ci.yml` (new CI workflow)
- Modify: `.github/workflows/docs.yml` (add `--frozen-lockfile`)

**Dependencies:**
- Phases 1-4 (validates same checks as hooks)
- Existing mise configuration (`mise.toml`)

**Done when:**
- Pushing to any branch triggers CI workflow
- Opening PR to main triggers CI workflow
- CI runs: lint → typecheck → test (all must pass)
- CI uses mise for tooling (Node 24, pnpm 10.27.0)
- CI caches pnpm store (matches docs workflow pattern)
- Both workflows use `pnpm install --frozen-lockfile`
- CI status shows in GitHub PR checks

**Verification commands:**
```bash
# Push to branch and verify CI runs
git push origin <branch-name>
# Check GitHub Actions tab for "CI" workflow run

# Verify CI catches issues (push with --no-verify)
# Break lint/test, commit with --no-verify, push
# Expected: Local hooks bypassed, CI fails

# Verify lockfile enforcement
# Modify package.json without updating pnpm-lock.yaml, push
# Expected: CI fails with lockfile mismatch error
```

## Additional Considerations

**Performance:** Pre-commit hooks use lint-staged to check only staged files, keeping commit time under 5 seconds. Pre-push runs full test suite (~10-20 seconds currently, may grow with project).

**Emergency bypass:** `--no-verify` flag allows bypassing hooks in emergencies (critical hotfixes, transient tool issues). CI provides server-side enforcement regardless of bypass. Team should document when bypass is acceptable.

**Maintenance:** When adding new packages to monorepo, manually update `scope-enum` array in `.commitlintrc.json` to include new package name. Consider adding verification to CI that scope-enum matches actual packages in `packages/*/package.json`.

**CI performance:** Sequential execution of lint → typecheck → test is acceptable for current project size (~1-2 minutes total). Can split into parallel jobs if runtime becomes bottleneck (>5 minutes).

**Frozen lockfile:** Both CI workflows use `--frozen-lockfile` to ensure reproducible builds and catch cases where developers forgot to commit lockfile changes after dependency modifications.
