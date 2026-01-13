# Code Style and Conventions

## TypeScript Style

- Use `type` not `interface` (unless defining class contracts)
- Use `Array<T>` not `T[]`
- Use `null` for absent values (not `undefined`)
- Use function declarations for top-level functions
- Use named exports only (no default exports)
- Always type function returns explicitly
- Prefer type guards over `as` casts

## Error Handling

- Use neverthrow `Result<T, E>` for all fallible operations
- Core functions return Results, never throw
- Error types: `EncodeError` and `DecodeError`
- Use `.match()`, `.andThen()`, `.map()` for Result handling

## File Classification (MANDATORY)

Every source file in `packages/*/src/` MUST have a pattern comment:

```typescript
// pattern: Functional Core    // Pure functions, no I/O, returns Result types
// pattern: Imperative Shell   // I/O orchestration, may throw exceptions
```

## Binary Encoding Conventions

- All integers: little-endian
- 64-bit and 128-bit integers: JavaScript BigInt
- Timestamps: Unix seconds as bigint (core) / Luxon DateTime (schema)
- Maps: Always native JavaScript `Map<K, V>`

## Commit Messages

Conventional commits enforced by hooks:

- Format: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
- Scope: package name without @grounds/ prefix (e.g., `core`, `schema`, `stream`)

## Branch Naming

- Format: `<username>/<type>/<feature-name>`
- Example: `brajkovic/feat/encoder-implementation`

## Testing

- TDD approach (test first, then implement)
- Property-based tests with fast-check for roundtrip testing
- Test files: `packages/*/tests/*.test.ts`
