# Grounds - Relish Serialization in TypeScript

Last verified: 2026-01-03

## Project Overview

TypeScript implementation of [Relish](https://github.com/alex/relish) binary serialization format.

## Monorepo Structure

- `packages/core` - Low-level T[L]V encoding (@grounds/core)
- `packages/schema` - TypeBox integration (@grounds/schema)
- `packages/stream` - Streaming utilities (@grounds/stream)

## Branch Naming

Branches should be prefixed with username and conventional commit type:
- `<username>/<type>/<feature-name>`
- Example: `brajkovic/feat/encoder-implementation`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`

## Development Workflow

### Worktree Usage

- **AI agents:** MUST always work in worktrees (`.worktrees/<branch-name>`)
- **Human developers:** MAY use worktrees if they choose to

### Feature Branch Workflow

1. **Create feature branch** named `<user>/<type>/<feature-name>`
2. **Implement changes** on the feature branch
3. **Open pull request** when implementation is finalized
   - Include detailed commit message describing changes
   - Reference any related issues or ADRs
4. **Wait for merge** before starting subsequent phases
   - When starting a new phase, check if previous phase's PR has been merged
   - If not merged, refuse to start and notify the user

### Pull Request Requirements

- **MANDATORY: Use conventional commit format for PR title**
  - Format: `<type>(<scope>): <description>`
  - Example: `feat(schema): add TypeBox-based schema types`
  - Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
  - Scope: package name without @grounds/ prefix (e.g., `core`, `schema`, `stream`)
  - **This is NOT optional** - all PRs must follow this format
- Clear description of changes and their purpose
- Links to relevant documentation or ADRs
- Test results and verification steps
- Breaking changes highlighted
- **Do not mention implementation phases** in PR titles or commit messages - describe what was built, not which phase it belongs to

## Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Run oxlint
pnpm --filter @grounds/core build  # Build specific package
```

## Code Patterns

### File Classification (MANDATORY)

Every source file MUST have a pattern comment:
```typescript
// pattern: Functional Core
// pattern: Imperative Shell
```

- **Functional Core**: Pure functions, no I/O, returns Result types
- **Imperative Shell**: I/O orchestration, may throw exceptions

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

| Type | Code | JS Type |
|------|------|---------|
| Null | 0x00 | `null` |
| Bool | 0x01 | `boolean` |
| u8 | 0x02 | `number` |
| u16 | 0x03 | `number` |
| u32 | 0x04 | `number` |
| u64 | 0x05 | `bigint` |
| u128 | 0x06 | `bigint` |
| i8 | 0x07 | `number` |
| i16 | 0x08 | `number` |
| i32 | 0x09 | `number` |
| i64 | 0x0a | `bigint` |
| i128 | 0x0b | `bigint` |
| f32 | 0x0c | `number` |
| f64 | 0x0d | `number` |
| String | 0x0e | `string` |
| Array | 0x0f | `Array<T>` |
| Map | 0x10 | `Map<K, V>` |
| Struct | 0x11 | `object` |
| Enum | 0x12 | tagged union |
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

### Future Work and Issues

Track future work in GitHub issues:
- **Before creating issues:** Show user proposed title, body, and labels for each issue
- Get explicit approval before creating
- Label appropriately (enhancement, bug, documentation, etc.)
