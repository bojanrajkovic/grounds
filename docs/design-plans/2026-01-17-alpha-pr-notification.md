# Alpha PR Notification Design

## Overview

Enhance the `publish-alpha` workflow to notify PR authors when alpha packages are published. After successful alpha publishing, the workflow comments on the originating PR with published package versions and updates commit status to show publish state.

**Goals:**

- Provide visibility into alpha package publishing on PRs
- Enable easy installation of alpha packages from PR comments
- Show publish status as a commit check

## Architecture

The implementation extends `publish-alpha.yml` with three capabilities using `actions/github-script@v7`:

1. **Commit status updates** - Set pending status early, success status after publish
2. **Version extraction** - Read package.json files after `changeset version --snapshot`
3. **PR comment management** - Find/update existing comment or create new one

**Data flow:**

1. Workflow triggered via `workflow_run` event after CI passes on feat/fix branch
2. Early step sets commit status to "pending" with link to workflow run
3. Existing publish steps run (changeset version, changeset publish)
4. Post-publish step reads all three package.json files for versions
5. Final step finds PR from branch, creates/updates comment with versions, sets status to "success"

**Key design decisions:**

- Use `actions/github-script@v7` for cleaner JavaScript-based GitHub API access
- Use Status API (not Checks API) for simplicity
- Update existing comments (via hidden marker) rather than creating duplicates
- List all three packages every time (simpler than detecting which changed)
- Graceful degradation: if no PR found, log warning but don't fail workflow

## Existing Patterns

Investigation found these patterns in `.github/workflows/`:

**Data passing between steps:**

- `$GITHUB_ENV` for shell variables (used in `publish-alpha.yml:42-47`)
- `$GITHUB_OUTPUT` with `id:` for step results used in conditionals

**Permissions:**

- Minimal, explicit permissions per job
- `id-token: write` for npm publishing
- Caller workflow (`publish-switch.yml`) passes permissions via `secrets: inherit`

**Error handling:**

- Use `if:` conditions on steps, not `continue-on-error`
- Extract complex conditionals to step outputs first

**New patterns introduced:**

- `actions/github-script@v7` for GitHub API access (not previously used)
- PR commenting with marker-based update logic
- Commit status updates via Status API

## Implementation Phases

### Phase 1: Permissions and Status Setup

**Goal:** Add required permissions and implement pending status on workflow start

**Components:**

- `publish-switch.yml` - Add `pull-requests: write` and `statuses: write` permissions to publish-alpha job
- `publish-alpha.yml` - Add step using `actions/github-script` to set pending commit status early in workflow

**Dependencies:** None (first phase)

**Done when:** Workflow sets "pending" status visible on PR commits when alpha publish starts

### Phase 2: Version Extraction

**Goal:** Extract published package versions after changeset snapshot

**Components:**

- `publish-alpha.yml` - Add step after `changeset version --snapshot` that reads all three package.json files and outputs versions to `$GITHUB_OUTPUT`

**Dependencies:** Phase 1

**Done when:** Versions are available as step outputs for use in subsequent steps

### Phase 3: PR Comment and Success Status

**Goal:** Comment on PR with package versions and set success status

**Components:**

- `publish-alpha.yml` - Add final step using `actions/github-script` that:
  - Finds PR from branch name via `pulls.list({ head: branch })`
  - Searches for existing comment with `<!-- alpha-publish-comment -->` marker
  - Creates or updates comment with version table and install instructions
  - Sets commit status to "success"

**Dependencies:** Phase 2 (needs version outputs)

**Done when:** PR receives comment with all three package versions and commit shows success status

## Additional Considerations

**No PR found:** If branch has no associated PR (direct push without PR), the workflow logs a warning and skips commenting. The commit status is still set to success since packages published successfully. This is graceful degradation - the primary goal (npm publish) succeeded.

**Comment format:** Uses markdown table for scannable version display. Includes both specific version install command and `@alpha` tag option. Hidden HTML marker (`<!-- alpha-publish-comment -->`) enables finding/updating existing comment on subsequent pushes.
