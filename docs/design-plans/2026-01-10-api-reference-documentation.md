# API Reference Documentation Design

## Overview

Add comprehensive API reference documentation to the mdBook documentation site using TypeDoc to automatically generate markdown from enhanced TSDoc comments in source code. Covers all public exports from @grounds/core, @grounds/schema, and @grounds/stream packages.

**Goals:**

- Complete API reference for all public functions, types, classes, and constants
- TypeScript signatures with parameter and return type documentation
- Runnable code examples demonstrating real-world usage patterns
- Cross-references between related API elements
- Integrated into existing mdBook documentation site
- Maintainable via enhanced TSDoc comments in source code

**Success criteria:**

- Every public export has comprehensive TSDoc with @param, @returns, @example, @see tags
- TypeDoc generates valid markdown integrated into mdBook SUMMARY.md
- Generated API docs committed to git for PR review
- CI enforces up-to-date generated documentation
- Developers can regenerate docs locally with single command

## Architecture

TypeDoc with typedoc-plugin-markdown generates API reference markdown from enhanced TSDoc comments via build-time generation. Generated files committed to git for review-ability.

**Core workflow:**

1. Enhance TSDoc comments in `packages/*/src/**/*.ts` with complete @param, @returns, @example, @remarks, @see tags
2. Run TypeDoc to generate markdown files to `docs/api/` directory (one markdown file per module/export)
3. Commit generated markdown alongside source code changes
4. mdBook includes generated files via SUMMARY.md references
5. CI validates generated docs match source (prevents stale docs)

**Key architectural decisions:**

- **Build-time generation** (not preprocessor): TypeDoc runs before mdBook as separate step, generating static markdown
- **Committed generated files**: Generated markdown committed to git so API doc changes reviewable in PRs
- **Monorepo-aware**: TypeDoc packages mode handles all three packages in single configuration
- **Separate from examples**: Generated API docs in `docs/api/`, runnable examples remain in `examples/` directory validated by mdbook-validator

**Integration points:**

- TypeDoc generates to `docs/api/` before mdBook build
- mdBook SUMMARY.md links to generated package documentation
- CI `docs:build` pipeline runs TypeDoc → mdBook in sequence
- GitHub Actions workflow validates docs are current

## Existing Patterns

Investigation found no existing TypeDoc setup. Project uses manual documentation with mdBook:

**Current documentation patterns:**

- Manual markdown files organized by topic (not by package)
- Reference section minimal (type-codes.md, wire-format.md only)
- Examples validated via mdbook-validator Docker container
- JSDoc comments exist but sparse (mostly one-liners)
- No auto-generated API documentation

**Build infrastructure patterns:**

- `pnpm docs:build-validator` builds Docker container for example validation
- `mdbook build mdbook` generates HTML from markdown source
- Source in `docs/`, output in `docs/book/` (gitignored)
- mise.toml and Dockerfile Node versions must stay synchronized

**Documentation style patterns:**

- Concise introductions (1-2 sentences)
- Runnable code examples with context comments
- Tables for structured information
- "Next Steps" sections linking related docs
- Links to external specs (Relish SPEC.md) and source implementations

**This design follows:**

- Existing mdBook structure (adds to it, doesn't replace)
- Validation-first approach (CI enforces correctness)
- Committed documentation for review (like manual docs)
- Build pipeline pattern (pre-step before mdBook)

**This design introduces:**

- TypeDoc for automated API doc generation
- TSDoc enhancement workflow (generate → review → commit)
- CI check for documentation freshness
- API reference organization (by package, not topic)

## Implementation Phases

### Phase 1: Setup & Configuration

**Goal:** Install TypeDoc, configure for monorepo, integrate into build pipeline

**Components:**

- Modify: `package.json` (root) - Add typedoc and typedoc-plugin-markdown to devDependencies
- Create: `typedoc.json` (root) - Configuration for monorepo with packages mode
- Modify: `package.json` scripts - Add `docs:generate-api` script, update `docs:build` to run TypeDoc first
- Modify: `.github/workflows/ci.yml` - Add step to verify generated docs are up-to-date
- Modify: `.gitignore` - Ensure `docs/api/` is NOT ignored (we commit generated files)

**Dependencies:** None (first phase)

**Done when:**

- `pnpm install` succeeds with TypeDoc packages
- `pnpm docs:generate-api` runs without errors (may generate empty/minimal docs initially)
- `pnpm docs:build` succeeds (TypeDoc → mdBook pipeline works)
- CI check for stale docs passes (verifies `git diff docs/api/` is clean after generation)

### Phase 2: TSDoc Enhancement - @grounds/core

**Goal:** Add comprehensive TSDoc comments to all @grounds/core public exports

**Components:**

- Modify: `packages/core/src/encoder.ts` - Add @param, @returns, @example, @remarks, @see to encode(), Encoder class
- Modify: `packages/core/src/decoder.ts` - Document decode(), Decoder class, DecodedValue type
- Modify: `packages/core/src/types.ts` - Document TypeCode enum, RelishValue union, isPrimitiveTypeCode(), all type variants
- Modify: `packages/core/src/values.ts` - Document all value constructors (Null, Bool, U8-U128, I8-I128, F32, F64, String*, Array*, Map\_, Struct, Enum, Timestamp)
- Modify: `packages/core/src/errors.ts` - Document EncodeError and DecodeError with error codes
- Modify: `packages/core/src/index.ts` - Verify all exports have documentation (module-level summary)

**Dependencies:** Phase 1 (TypeDoc configured)

**Done when:**

- All exported functions have @param, @returns, @example tags
- All exported types have summary descriptions
- All exported classes have class summary + method documentation
- Error types document all error codes
- `pnpm docs:generate-api` produces comprehensive markdown for @grounds/core
- Generated markdown reviewed and committed
- Build succeeds with no TypeDoc warnings

### Phase 3: TSDoc Enhancement - @grounds/schema

**Goal:** Add comprehensive TSDoc comments to all @grounds/schema public exports

**Components:**

- Modify: `packages/schema/src/types.ts` - Document all schema type constructors (RNull, RBool, RU8-RU128, RI8-RI128, RF32, RF64, RString, RTimestamp)
- Modify: `packages/schema/src/struct.ts` - Document RStruct, field() helper, struct field definitions
- Modify: `packages/schema/src/enum.ts` - Document REnum, variant() helper, enum variant definitions
- Modify: `packages/schema/src/codec.ts` - Document createCodec with type-safe usage examples, Codec<T> interface
- Modify: `packages/schema/src/convert.ts` - Document toRelish/fromRelish with symmetry explanation in @remarks
- Modify: `packages/schema/src/index.ts` - Verify exports, add module summary explaining TypeBox integration

**Dependencies:** Phase 2 (@grounds/core docs as reference for style)

**Done when:**

- All schema constructors documented with usage examples
- Composite types (RArray, RMap, ROptional, RStruct, REnum) have detailed @example blocks
- Conversion API documents symmetry pattern (toRelish ↔ fromRelish)
- createCodec examples show type inference and safety benefits
- `pnpm docs:generate-api` produces comprehensive markdown for @grounds/schema
- Generated markdown reviewed and committed
- Build succeeds with no TypeDoc warnings

### Phase 4: TSDoc Enhancement - @grounds/stream

**Goal:** Add comprehensive TSDoc comments to all @grounds/stream public exports

**Components:**

- Modify: `packages/stream/src/encode.ts` - Document encodeIterable with async generator examples
- Modify: `packages/stream/src/decode.ts` - Document decodeIterable with streaming decode patterns
- Modify: `packages/stream/src/web-streams.ts` - Document createEncoderStream, createDecoderStream with Web Streams API usage
- Modify: `packages/stream/src/schema-streams.ts` - Document createSchemaEncoderStream, createSchemaDecoderStream with type-safe streaming
- Modify: `packages/stream/src/buffer.ts` - Document internal buffer utilities (if exported; mark @internal if not)
- Modify: `packages/stream/src/index.ts` - Verify exports, add module summary explaining streaming approach

**Dependencies:** Phase 3 (@grounds/schema docs show how schemas integrate)

**Done when:**

- AsyncGenerator API documented with async/await examples
- Web Streams API documented with TransformStream usage patterns
- Schema-aware streams show type inference in action
- Real-world streaming examples included (not just trivial cases)
- `pnpm docs:generate-api` produces comprehensive markdown for @grounds/stream
- Generated markdown reviewed and committed
- Build succeeds with no TypeDoc warnings

### Phase 5: mdBook Integration & Documentation

**Goal:** Integrate generated API reference into mdBook site and document workflow

**Components:**

- Modify: `docs/SUMMARY.md` - Add "API Reference" section with links to generated package docs
- Modify: `CLAUDE.md` - Add "API Documentation" section to Development Workflow explaining when/how to regenerate docs
- Modify: `README.md` - Add mention of API reference documentation availability with link to published docs
- Create: `docs/api-reference-intro.md` (optional) - Brief intro page explaining API reference organization if needed

**Dependencies:** Phases 2, 3, 4 (all packages documented)

**Done when:**

- API Reference section visible in mdBook table of contents
- Links to @grounds/core, @grounds/schema, @grounds/stream documentation work correctly
- CLAUDE.md documents developer workflow: change code → enhance TSDoc → run `pnpm docs:generate-api` → commit both
- CLAUDE.md explains CI check (enforces docs freshness)
- README.md mentions API reference with link to published site
- Full documentation build succeeds: `pnpm docs:build` produces complete site
- Published documentation site (GitHub Pages) shows API reference

## Additional Considerations

**TSDoc writing guidelines:**

Follow writing-for-a-technical-audience skill when enhancing TSDoc comments:

- Active voice: "Encodes data" not "This function encodes data"
- Don't repeat type info (TypeScript already provides types)
- Use @remarks for implementation details users should know (performance characteristics, design decisions, cross-package concerns)
- Document both Ok and Err paths for Result<T, E> return types
- Include @example blocks showing real neverthrow usage patterns (.match(), .andThen(), .map())
- Use @see for cross-references to related functions/types

**Quality gates:**

Code review checklist for TSDoc PRs:

- All public exports have complete JSDoc comments
- @param descriptions are clear and don't repeat type info
- @returns documents both Ok and Err cases for Result types
- @example blocks show real-world usage with neverthrow patterns
- @remarks explain important implementation details
- @see cross-references link to related APIs
- Generated markdown committed alongside source changes

**Maintenance workflow:**

When APIs change:

1. Developer updates source code and TSDoc comments together
2. Developer runs `pnpm docs:generate-api` to regenerate
3. Developer commits both source and generated docs in same commit
4. CI validates docs are up-to-date on every PR

**Future improvements:**

- TypeDoc theme customization if default markdown needs adjustment
- TypeDoc plugin for better Result<T, E> type rendering if needed
- Expand @example blocks with more real-world scenarios as API evolves
- Automated API diff reports in PRs showing breaking changes

**Non-goals (explicitly out of scope):**

- Auto-generating conceptual documentation (stays manual in docs/)
- Replacing existing getting-started guides (they're example-driven, not API reference)
- Generating docs from private/internal APIs (TypeDoc configured to exclude via excludePrivate, excludeInternal)
- Interactive API playground (out of scope for static site)
- Migrating existing reference docs (type-codes.md, wire-format.md remain manual - they document wire format, not API)
