# Documentation Restructure Design

## Overview

Restructure examples and documentation to improve clarity and maintainability. Each example demonstrates one concept, pairs with conceptual documentation, and is validated during build.

**Goals:**

- One concept per example file (currently multiple concepts per file)
- Examples embedded in conceptual docs via `{{#include}}`
- Examples validated by actual execution during doc build
- Documentation organized as progressive user journey
- Runnable examples both standalone and in docs

## Architecture

Three-layer documentation system:

**1. Examples Layer** (`examples/`)

- Standalone TypeScript files, one concept per file (~10-20 lines)
- Runnable independently via `tsx examples/<path>.ts`
- Organized by package: `examples/core/`, `examples/schema/`, `examples/stream/`
- Idiomatic neverthrow usage (`.match()`, `.andThen()`, `.map()`)

**2. Documentation Layer** (`docs/`)

- mdBook-based documentation
- Organized by user journey (Getting Started → Core → Schema → Streaming → Reference)
- Embeds examples via `{{#include ../../examples/<path>.ts}}`
- Narrative text explains concepts between example includes

**3. Validation Layer** (mdbook-validator)

- Runs during `mdbook build`
- Executes TypeScript examples in Docker container (Node 24)
- Custom validator script checks exit code and assertions
- Build fails if any example throws

**Data flow:**

```
examples/*.ts → {{#include}} → mdBook → mdbook-validator → Docker → validate → HTML
```

## Existing Patterns

Investigation found:

- 3 existing example files in `examples/` covering multiple concepts each
- Vitest for testing with property-based tests via fast-check
- pnpm workspace with packages in `packages/`
- No existing documentation tooling (mdBook is new)
- `mise.toml` manages Node.js tooling

This design introduces new patterns:

- mdBook for documentation (Rust-based, new toolchain)
- Docker-based validation via mdbook-validator
- Fine-grained example files (one concept each)

Existing patterns followed:

- Examples remain executable TypeScript in monorepo
- Pattern comments (`// pattern: Imperative Shell`) on example files
- Idiomatic neverthrow usage consistent with existing code

## Implementation Phases

### Phase 1: Tooling Setup

**Goal:** Add mdBook and validation infrastructure

**Components:**

- Modify: `mise.toml` (add rust, cargo:mdbook, cargo:mdbook-validator)
- Create: `docs/book.toml` (mdBook configuration with validator)
- Create: `docs/validators/validate-typescript.sh` (TypeScript validator script)
- Create: `docs/src/SUMMARY.md` (table of contents placeholder)
- Modify: `package.json` (add docs:build, docs:serve scripts)
- Modify: `package.json` (add tsx dev dependency)

**Dependencies:** None (first phase)

**Testing:**

- `mise install` succeeds with new tools
- `pnpm docs:build` runs (may fail on missing content, but tooling works)
- Validator script is executable

### Phase 2: Example Restructure - Core Package

**Goal:** Break existing `examples/basic-usage.ts` into focused files

**Components:**

- Create: `examples/core/encode-match.ts` (basic encode + .match())
- Create: `examples/core/encode-roundtrip.ts` (.andThen() chaining)
- Create: `examples/core/encode-transform.ts` (.map() transformation)
- Create: `examples/core/encode-error.ts` (.mapErr() for context)
- Create: `examples/core/encode-collections.ts` (arrays, maps)
- Delete: `examples/basic-usage.ts` (replaced by above)

**Dependencies:** Phase 1 (tsx available)

**Testing:**

- Each example runs successfully: `tsx examples/core/<file>.ts`
- No runtime errors, clean exit

### Phase 3: Example Restructure - Schema Package

**Goal:** Break existing `examples/schema-usage.ts` into focused files

**Components:**

- Create: `examples/schema/defining-structs.ts` (RStruct, field())
- Create: `examples/schema/defining-enums.ts` (REnum, variant())
- Create: `examples/schema/using-codecs.ts` (createCodec, encode/decode)
- Create: `examples/schema/optional-fields.ts` (ROptional, null handling)
- Delete: `examples/schema-usage.ts` (replaced by above)

**Dependencies:** Phase 2 (pattern established)

**Testing:**

- Each example runs successfully: `tsx examples/schema/<file>.ts`
- No runtime errors, clean exit

### Phase 4: Example Restructure - Stream Package

**Goal:** Break existing `examples/streaming.ts` into focused files

**Components:**

- Create: `examples/stream/async-generators.ts` (encodeIterable, decodeIterable)
- Create: `examples/stream/web-streams.ts` (createEncoderStream, createDecoderStream)
- Delete: `examples/streaming.ts` (replaced by above)

**Dependencies:** Phase 3 (pattern established)

**Testing:**

- Each example runs successfully: `tsx examples/stream/<file>.ts`
- No runtime errors, clean exit

### Phase 5: Documentation Structure

**Goal:** Create mdBook documentation structure with user journey

**Components:**

- Create: `docs/src/introduction.md`
- Create: `docs/src/getting-started/installation.md`
- Create: `docs/src/getting-started/first-encode.md`
- Create: `docs/src/core-concepts/encoding.md` (includes core examples)
- Create: `docs/src/core-concepts/decoding.md`
- Create: `docs/src/core-concepts/error-handling.md`
- Update: `docs/src/SUMMARY.md` (complete table of contents)

**Dependencies:** Phase 2 (core examples exist)

**Testing:**

- `pnpm docs:build` produces HTML
- Navigation works in generated site
- Examples render correctly

### Phase 6: Schema and Streaming Docs

**Goal:** Complete documentation for schema and streaming packages

**Components:**

- Create: `docs/src/schema/structs.md` (includes schema examples)
- Create: `docs/src/schema/enums.md`
- Create: `docs/src/schema/codecs.md`
- Create: `docs/src/schema/optional-fields.md`
- Create: `docs/src/streaming/async-generators.md` (includes stream examples)
- Create: `docs/src/streaming/web-streams.md`
- Create: `docs/src/reference/type-codes.md`
- Create: `docs/src/reference/wire-format.md`
- Update: `docs/src/SUMMARY.md`

**Dependencies:** Phases 3, 4, 5 (schema/stream examples exist, structure established)

**Testing:**

- `pnpm docs:build` produces complete HTML
- All sections render correctly
- All examples included and displayed

### Phase 7: Validation Integration

**Goal:** Enable example validation during doc build

**Components:**

- Update: `docs/book.toml` (enable validator preprocessor)
- Update: `docs/validators/validate-typescript.sh` (complete implementation)
- Add assertion blocks to documentation markdown files
- Test validation catches broken examples

**Dependencies:** Phase 6 (all content exists)

**Testing:**

- `pnpm docs:build` runs all examples in Docker
- Intentionally broken example fails build
- All examples pass validation

### Phase 8: CI and CLAUDE.md Updates

**Goal:** Integrate with CI and document maintenance requirements

**Components:**

- Create: `.github/workflows/docs.yml` (build and deploy workflow)
- Modify: `CLAUDE.md` (add documentation build section, version coupling notes)

**Dependencies:** Phase 7 (validation working)

**Testing:**

- CI workflow runs successfully
- GitHub Pages deployment works (on main branch)
- CLAUDE.md documents version coupling

## Additional Considerations

**Version coupling:** Node version in `mise.toml` must match Docker container in `docs/book.toml`. Documented in CLAUDE.md to prevent drift.

**Standalone execution:** Examples must work both via `tsx examples/<file>.ts` and when included in docs. Requires self-contained files with explicit imports.

**Build dependencies:** Doc build requires packages to be built first (`pnpm build` before `pnpm docs:build`) since examples import from `@grounds/*`.
