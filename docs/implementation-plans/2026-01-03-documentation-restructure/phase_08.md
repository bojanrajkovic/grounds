# Documentation Restructure Implementation Plan - Phase 8

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-an-implementation-plan to implement this plan task-by-task.

**Goal:** Integrate with CI and document maintenance requirements

**Architecture:** GitHub Actions workflow builds validator container, runs mdbook with validation, and deploys to GitHub Pages on main branch.

**Tech Stack:** GitHub Actions, Docker, mdBook, GitHub Pages

**Scope:** 8 phases from original design (this is phase 8 of 8)

**Codebase verified:** 2026-01-03

---

## Phase 8: CI and CLAUDE.md Updates

**Goal:** Integrate with CI and document maintenance requirements

**Dependencies:** Phase 7 (validation working)

---

### Task 1: Create GitHub Actions workflow for docs

**Files:**
- Create: `.github/workflows/docs.yml`

**Step 1: Create the workflow file**

```yaml
name: Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    permissions:
      contents: read

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup mise
        uses: jdx/mise-action@v2

      - name: Install dependencies
        run: pnpm install

      - name: Build documentation
        run: pnpm docs:build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        if: github.ref == 'refs/heads/main'
        with:
          path: docs/book

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    permissions:
      pages: write
      id-token: write

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Step 2: Verify file was created**

Run: `cat .github/workflows/docs.yml`
Expected: Workflow content matches above

**Step 3: Commit**

```bash
git add .github/workflows/docs.yml
git commit -m "$(cat <<'EOF'
ci: add documentation build and deploy workflow

Build documentation with example validation on every push/PR.
Deploy to GitHub Pages on main branch.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Update CLAUDE.md with documentation section

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add documentation section to CLAUDE.md**

Add the following section after the "Commands" section:

```markdown
## Documentation

### Building Documentation

```bash
pnpm docs:build          # Build validator container + mdbook docs
pnpm docs:build-validator # Build only the validator container
pnpm docs:serve          # Serve docs locally (no validation)
```

### Documentation Structure

- `docs/src/` - mdBook source files
- `docs/book/` - Generated output (gitignored)
- `docs/validators/` - Validation scripts for examples
- `examples/` - Runnable example files, organized by package

### Example Validation

Examples are validated during doc build using mdbook-validator:
- Examples run in a Docker container (`grounds-example-validator`)
- Container includes pre-built @grounds/* packages
- Build fails if any validated example throws an error
- Mark examples for validation with `validator=typescript` on the code fence

### Version Coupling

**CRITICAL:** These versions must stay in sync:

| Location | What | Must Match |
|----------|------|------------|
| `mise.toml` | `node = "24"` | Container base image |
| `docs/Dockerfile` | `FROM node:24-slim` | mise.toml node version |

When upgrading Node:
1. Update `node` version in `mise.toml`
2. Update `FROM node:XX-slim` in `docs/Dockerfile`
3. Rebuild validator: `pnpm docs:build-validator`

### Adding New Examples

1. Create example file in `examples/<package>/<name>.ts`
2. Add `// pattern: Imperative Shell` comment at top
3. Use idiomatic neverthrow patterns (`.match()`, `.andThen()`, `.map()`)
4. Test locally: `pnpm exec tsx examples/<package>/<name>.ts`
5. Include in docs with:
   ````markdown
   ```typescript validator=typescript
   {{#include ../../../examples/<package>/<name>.ts}}
   ```
   ````
6. Build to validate: `pnpm docs:build`
```

**Step 2: Verify content was added**

Run: `grep -A 5 "## Documentation" CLAUDE.md`
Expected: New documentation section visible

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: add documentation build and maintenance section to CLAUDE.md

Document:
- Build commands for documentation
- Directory structure
- Example validation process
- Version coupling requirements
- Steps for adding new examples

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Enable GitHub Pages in repository settings

**Files:**
- None (manual GitHub configuration)

**Step 1: Document required GitHub configuration**

The following must be configured in GitHub repository settings:

1. Go to repository Settings → Pages
2. Under "Build and deployment":
   - Source: "GitHub Actions"
3. Save changes

**Step 2: Note for user**

This step requires manual configuration in GitHub. After merging this PR:
1. Navigate to the repository's Settings → Pages
2. Select "GitHub Actions" as the source
3. The docs workflow will deploy on next push to main

---

### Task 4: Test CI workflow locally (optional)

**Files:**
- None (verification only)

**Step 1: Verify workflow syntax**

Run: `cat .github/workflows/docs.yml | head -20`
Expected: Valid YAML syntax

**Step 2: Verify all referenced scripts exist**

Run: `ls -la docs/build-validator.sh docs/Dockerfile docs/validators/validate-typescript.sh`
Expected: All files exist and are properly configured

**Step 3: Test full build locally**

Run: `pnpm docs:build`
Expected: Build succeeds with validation

---

### Task 5: Final verification

**Files:**
- None (verification only)

**Step 1: Run complete build**

Run: `pnpm docs:build`
Expected: Packages build, validator container builds, mdbook builds with validation

**Step 2: Serve locally and verify**

Run: `pnpm docs:serve`
Expected: Documentation serves at localhost, all pages render correctly

**Step 3: Verify all changes are committed**

Run: `git status`
Expected: Working tree clean (all changes committed)

---

## Phase 8 Verification

After completing all tasks:

- [ ] `.github/workflows/docs.yml` exists with build and deploy jobs
- [ ] `CLAUDE.md` includes documentation section with version coupling notes
- [ ] GitHub Pages configuration documented (requires manual setup)
- [ ] `pnpm docs:build` runs complete build with validation
- [ ] All changes committed and ready for PR

## Post-Merge Steps

After this PR is merged:

1. Configure GitHub Pages source to "GitHub Actions" in repository settings
2. Verify first deployment succeeds
3. Check deployed documentation at `https://<username>.github.io/grounds/`
