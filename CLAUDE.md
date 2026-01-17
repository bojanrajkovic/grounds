# Grounds - Relish Serialization in TypeScript

Last verified: 2026-01-17

## Project Overview

TypeScript implementation of [Relish](https://github.com/alex/relish) binary serialization format.

## Monorepo Structure

- `packages/core` - Low-level T[L]V encoding (@grounds/core)
- `packages/schema` - TypeBox integration (@grounds/schema)
- `packages/stream` - Streaming utilities (@grounds/stream)
- `packages/test-utils` - Shared test assertion helpers (@grounds/test-utils, private)
- `examples/` - Runnable usage examples organized by package (e.g., `examples/core/`)
- `docs/` - mdBook documentation content (markdown files)
- `mdbook/` - mdBook build configuration and validators

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **Major (1.0.0)**: Breaking API changes
- **Minor (0.1.0)**: New features, backward compatible
- **Patch (0.0.1)**: Bug fixes, backward compatible

**Pre-1.0 releases (0.x.x)**: API is considered unstable. Breaking changes may occur in minor versions. Once the API stabilizes and reaches 1.0.0, strict semver will be enforced.

## Branch Naming

Branches should be prefixed with username and conventional commit type:

- `<username>/<type>/<feature-name>`
- Example: `brajkovic/feat/encoder-implementation`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`

## Changesets & Release Workflow

### Conventional Commits Required

All commits MUST follow conventional commit format (enforced via hooks and PR title validation):

| Commit Type                          | Version Bump | Packages Affected                         |
| ------------------------------------ | ------------ | ----------------------------------------- |
| `feat(core):`                        | Minor        | core, schema, stream (all dependents)     |
| `feat(schema):`                      | Minor        | schema, stream (stream depends on schema) |
| `feat(stream):`                      | Minor        | stream only                               |
| `fix(core):`                         | Patch        | core, schema, stream (all dependents)     |
| `fix(schema):`                       | Patch        | schema, stream                            |
| `fix(stream):`                       | Patch        | stream only                               |
| `feat(core)!:` or `BREAKING CHANGE:` | Major        | core, schema, stream                      |
| `docs:`, `chore:`, `test:`, `ci:`    | None         | No version bump                           |

**Scope determines affected packages.** Breaking changes (`!` or `BREAKING CHANGE:`) trigger major bumps. During 0.x phase, breaking changes may occur in minor versions.

### Breaking Changes

Breaking changes trigger a major version bump. You MUST mark them explicitly for the `generate-changeset.ts` script to detect them:

- **Option 1:** Add `!` after the type: `feat!: change API to return Result types`
- **Option 2:** Include `BREAKING CHANGE:` in the commit footer:

  ```
  feat: change API to return Result types

  BREAKING CHANGE: All factory functions now return Result<T, ValidationError[]>
  instead of throwing exceptions. Callers must handle the Result type.
  ```

**Why this matters:** The `generate-changeset.ts` script parses conventional commits to determine version bumps. Without explicit breaking change markers, API-breaking changes will only trigger a minor bump instead of a major bump, violating semver.

### Linked Versioning

Packages use **linked versioning** via Changesets:

- Changes to `@grounds/core` bump core, schema, and stream
- Changes to `@grounds/schema` bump schema and stream
- Changes to `@grounds/stream` bump stream only

Packages can have different versions (e.g., core@1.2.0, schema@1.1.0, stream@1.0.5) but dependencies stay compatible.

### Alpha Publishing

**Automatic alpha packages** publish to npm after CI passes on `feat/*` and `fix/*` branches:

- **Version format:** `{version}-{branch-name}-{shortSha}`
- **Example:** `0.2.0-streaming-api-abc1234`
- **Dist-tag:** `@alpha`
- **Install:** `pnpm add @grounds/core@alpha`

Alpha packages let you test PR changes before merging:

```bash
# Install specific alpha version
pnpm add @grounds/core@0.2.0-my-feature-abc1234

# Or always use latest alpha
pnpm add @grounds/core@alpha
```

**All three packages** (@grounds/core, @grounds/schema, @grounds/stream) publish together with the same alpha version.

### Production Releases

**Automated workflow:**

1. **Merge PR to main** (squash-and-merge, PR title is commit message)
2. **Changesets auto-generates** changeset files from conventional commit
3. **"Version Packages" PR** created automatically with:
   - Updated package.json versions
   - Updated CHANGELOG.md entries
   - Linked version bumps for dependent packages
4. **Review Version Packages PR** to verify versions and changelog
5. **Merge Version Packages PR** → packages publish to npm with `@latest` tag

**No manual changeset creation needed** - conventional commits drive everything.

### Manual Changeset Creation (Optional)

If you need to create a changeset manually (rare):

```bash
pnpm run changeset
```

Follow prompts to select packages and version bump type.

### Installing Published Packages

```bash
# Latest stable release
pnpm add @grounds/core

# Specific version
pnpm add @grounds/core@0.1.0

# Latest alpha (pre-release from PR)
pnpm add @grounds/core@alpha
```

### Version Evolution

All packages start at **0.0.1** (pre-1.0 unstable API). Breaking changes permitted in minor versions during 0.x phase per semver. Once API stabilizes, move to 1.0.0 with strict semver enforcement.

## Development Workflow

### Worktree Usage

- **AI agents:** MUST always work in worktrees (`.worktrees/<branch-name>`)
- **Human developers:** MAY use worktrees if they choose to

### Git Hooks (Enforced)

The repository uses Husky git hooks that enforce quality gates:

| Hook       | Trigger      | What It Does                               |
| ---------- | ------------ | ------------------------------------------ |
| pre-commit | `git commit` | Runs oxlint + tsc on staged .ts/.tsx files |
| commit-msg | `git commit` | Validates conventional commit format       |
| pre-push   | `git push`   | Runs full test suite                       |

**These hooks cannot be bypassed in normal workflow.** If a hook fails:

- Fix the issue before proceeding
- Do not use `--no-verify` unless explicitly instructed

### Feature Branch Workflow

1. **Create feature branch** named `<user>/<type>/<feature-name>`
2. **Implement changes** on the feature branch
3. **Open pull request** when implementation is finalized
   - Include detailed commit message describing changes
   - Reference any related issues or ADRs
4. **Wait for merge** before starting subsequent phases
   - When starting a new phase, check if previous phase's PR has been merged
   - If not merged, refuse to start and notify the user

### Commit Message Format

**Conventional commits are enforced by the commit-msg hook.**

- Format: `<type>(<scope>): <description>`
- Example: `feat(schema): add TypeBox-based schema types`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
- Scope: package name without @grounds/ prefix (e.g., `core`, `schema`, `stream`, `test-utils`)

Commits that don't follow this format will be rejected by the hook.

### Pull Request Requirements

- **PR title must use conventional commit format** (same as commit messages)
- Clear description of changes and their purpose
- Links to relevant documentation or ADRs
- Test results and verification steps
- Breaking changes highlighted
- **Do not mention implementation phases** in PR titles or commit messages - describe what was built, not which phase it belongs to

## Commands

```bash
pnpm install               # Install dependencies
pnpm build                 # Build all packages
pnpm test                  # Run all tests
pnpm lint                  # Run oxlint
pnpm docs:build-validator  # Build Docker container for doc validation
pnpm docs:build            # Build documentation (mdBook)
pnpm docs:serve            # Serve documentation locally
pnpm --filter @grounds/core build  # Build specific package
```

## Documentation

### Building Documentation

```bash
pnpm docs:build          # Build validator container + mdbook docs
pnpm docs:build-validator # Build only the validator container
pnpm docs:serve          # Serve docs locally (no validation)
```

### Documentation Structure

- `docs/` - mdBook content (markdown files, SUMMARY.md)
- `docs/api/` - TypeDoc-generated API reference HTML (gitignored)
- `mdbook/` - mdBook configuration (book.toml, Dockerfile)
- `mdbook/book/` - Generated output (gitignored)
- `mdbook/validators/` - Validation scripts for examples
- `examples/` - Runnable example files, organized by package

### Example Validation

Examples are validated during doc build using mdbook-validator:

- Examples run in a Docker container (`grounds-example-validator`)
- Container includes pre-built @grounds/\* packages
- Build fails if any validated example throws an error
- Mark examples for validation with `validator=typescript` on the code fence

### Version Coupling

**CRITICAL:** These versions must stay in sync:

| Location            | What                | Must Match             |
| ------------------- | ------------------- | ---------------------- |
| `mise.toml`         | `node = "24"`       | Container base image   |
| `mdbook/Dockerfile` | `FROM node:24-slim` | mise.toml node version |

When upgrading Node:

1. Update `node` version in `mise.toml`
2. Update `FROM node:XX-slim` in `mdbook/Dockerfile`
3. Rebuild validator: `pnpm docs:build-validator`

### Adding New Examples

1. Create example file in `examples/<package>/<name>.ts`
2. Use idiomatic neverthrow patterns (`.match()`, `.andThen()`, `.map()`)
3. Test locally: `pnpm exec tsx examples/<package>/<name>.ts`
4. Include in docs with:
   ````markdown
   ```typescript validator=typescript
   {{#include ../../../examples/<package>/<name>.ts}}
   ```
   ````
5. Build to validate: `pnpm docs:build`

### API Documentation

API reference documentation is **auto-generated from TSDoc comments** using TypeDoc HTML output.

**Documentation Structure:**

- **Conceptual docs** (mdBook): Getting started, guides, examples in `docs/`
- **API reference** (TypeDoc HTML): Complete API documentation in `docs/api/` (generated, gitignored)
- **API index page**: `docs/API_README.md` provides landing page content for TypeDoc

The API docs are accessible from the mdBook sidebar under "API Reference" and link to the TypeDoc HTML interface.

**Build Process:**
TypeDoc generates HTML into docs/, which mdBook copies to output:

```bash
pnpm docs:build  # Builds packages → TypeDoc HTML → mdBook (copies docs/ to output)
```

Build order is important:

1. `pnpm build` - Compile packages (required for TypeDoc)
2. `pnpm docs:generate-api` - Generate TypeDoc HTML into `docs/api/`
3. `mdbook build mdbook` - Generate mdBook HTML, copies `docs/` (including `api/`) to output

**TypeDoc Configuration** (`typedoc.json`):

- **Entry point strategy**: `expand` - Generates full navigation trees with all exports
- **Module naming**: `@module` tags in each package's `index.ts` define clean names (@grounds/core, @grounds/schema, @grounds/stream)
- **Sidebar organization**: `@group` tags organize exports by semantic category (Encoding, Decoding, Schema Constructors: Primitives, etc.)
- **No version display**: Version numbers hidden from generated output
- **Index page**: Uses `docs/API_README.md` for landing page content

**TSDoc Guidelines:**

- Use active voice ("Encodes data" not "This function encodes data")
- Don't repeat type information (TypeScript provides types)
- Add `@param` for all parameters
- Add `@returns` documenting both Ok and Err cases for Result types
- Include `@example` blocks showing real neverthrow patterns (.match(), .andThen(), .map())
- Use `@remarks` for implementation details users should know
- Use `@see` for cross-references to related APIs
- **Add `@group` tags** to organize exports in sidebar (e.g., `@group Encoding`, `@group Schema Constructors: Primitives`)
- **Use `@module` tag** only in package index.ts files to set package display name

**Sidebar Organization by Package:**

- **@grounds/core**: Encoding, Decoding, Error Handling, Value Constructors
- **@grounds/schema**: Schema Constructors (Primitives, Containers, Structs, Enums), Codec API, Conversion Functions
- **@grounds/stream**: Encoding Streams, Decoding Streams

**CI Validation:**

- CI runs full docs build to verify TypeDoc succeeds
- Validates TSDoc syntax and detects broken cross-references
- No manual commit of generated HTML needed (output is gitignored)

**See also:**

- TypeDoc configuration in `typedoc.json`

## Code Patterns

### File Classification (MANDATORY)

Every source file in `packages/*/src/` MUST have a pattern comment:

```typescript
// pattern: Functional Core
// pattern: Imperative Shell
```

- **Functional Core**: Pure functions, no I/O, returns Result types
- **Imperative Shell**: I/O orchestration, may throw exceptions

**Scope:** Pattern comments are required only for source code in `packages/*/src/`. Test files (`packages/*/tests/`) and example files (`examples/`) do not require pattern comments.

### TypeScript Style

- Use `type` not `interface` (unless class contract)
- Use `Array<T>` not `T[]`
- Use `null` for absent values (not `undefined`)
- Use function declarations for top-level functions
- Use named exports only (no default exports)
- Always type function returns explicitly
- Prefer type guards over `as` casts: use `"prop" in obj` checks and type predicates (`x is T`) instead of unsafe type assertions

### Error Handling

- Use neverthrow `Result<T, E>` for all fallible operations
- Core functions return Results, never throw
- `EncodeError` and `DecodeError` are the error types

### Binary Encoding

- All integers: little-endian
- All 64-bit and 128-bit integers: JavaScript BigInt
- Timestamps: Unix seconds as bigint (core) / Luxon DateTime (schema)
- Maps: Always native JavaScript `Map<K, V>`

### API Surface Design

**Principle: Minimal first pass, expand on demand**

It's always easier to add things than to remove them. The first pass of any API should export only what users **need**, not everything that might be useful. Internal functions, symbols, and conversion helpers remain unexported until users request them.

**Hyrum's Law**: With a sufficient number of users of an API, it does not matter what you promise in the contract: all observable behaviors of your system will be depended on by somebody.

**Corollary**: Every export becomes a compatibility burden. If it's public, someone will use it in ways you didn't intend. Keep the public API minimal, and expand only when users demonstrate actual need.

**Guidelines**:

- Export only what users need to accomplish common tasks
- Keep internal implementation details unexported
- When users request advanced features, design a proper API (don't just export internals)
- Document what's intentionally not exported and why

## Testing

- Framework: Vitest
- Pattern: TDD (test first, then implement)
- Property-based: fast-check for roundtrip tests
- Test vectors: Extract from Rust reference implementation
- Location: `packages/*/tests/*.test.ts`

## Relish Type Codes

| Type      | Code | JS Type               |
| --------- | ---- | --------------------- |
| Null      | 0x00 | `null`                |
| Bool      | 0x01 | `boolean`             |
| u8        | 0x02 | `number`              |
| u16       | 0x03 | `number`              |
| u32       | 0x04 | `number`              |
| u64       | 0x05 | `bigint`              |
| u128      | 0x06 | `bigint`              |
| i8        | 0x07 | `number`              |
| i16       | 0x08 | `number`              |
| i32       | 0x09 | `number`              |
| i64       | 0x0a | `bigint`              |
| i128      | 0x0b | `bigint`              |
| f32       | 0x0c | `number`              |
| f64       | 0x0d | `number`              |
| String    | 0x0e | `string`              |
| Array     | 0x0f | `Array<T>`            |
| Map       | 0x10 | `Map<K, V>`           |
| Struct    | 0x11 | `object`              |
| Enum      | 0x12 | tagged union          |
| Timestamp | 0x13 | `bigint` / `DateTime` |

## Wire Format

- Type ID: 1 byte (0x00-0x13, bit 7 reserved)
- Length (varsize): Tagged varint
  - Bit 0 = 0: 7-bit length (0-127 bytes)
  - Bit 0 = 1: 4-byte little-endian (up to 2³¹-1 bytes)

## Documentation and Decision Making

### Architecture Decision Records (ADRs)

Record architectural decisions in `adrs/` directory using sequential naming:

- Format: `NNNN-<decision-name>.md` (e.g., `0000-use-neverthrow-for-errors.md`)
- Document context, decision, consequences, and alternatives considered
- Create ADRs during feature implementation when making significant architectural choices

### Documentation

The `docs/` directory should be updated during feature implementation:

- Add conceptual documentation explaining design and usage
- Include code examples demonstrating key features
- Update existing docs when behavior changes

**README.md updates:** When updating CLAUDE.md or project structure, also consider whether README.md needs corresponding updates. The README is user-facing documentation and should reflect:

- New packages or directories in the monorepo structure
- New commands or workflows
- Changes to examples or getting started instructions

### Future Work and Issues

Track future work in GitHub issues:

- **Before creating issues:** Show user proposed title, body, and labels for each issue
- Get explicit approval before creating
- Label appropriately (enhancement, bug, documentation, etc.)
