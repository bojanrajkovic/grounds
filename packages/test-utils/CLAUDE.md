# @grounds/test-utils

Last verified: 2026-01-03

## Purpose

Shared test assertion helpers for type-safe testing across all Grounds packages. Provides assertion functions that combine Vitest expectations with TypeScript type narrowing.

## Contracts

- **Exposes**:
  - `expectOk(result)` - Assert Result is Ok, return unwrapped value
  - `expectErr(result)` - Assert Result is Err, return error
  - `expectArray(value)` - Type assertion for ReadonlyArray
  - `expectMap(value)` - Type assertion for ReadonlyMap
  - `expectDateTime(value)` - Type assertion for Luxon DateTime
  - `expectStruct(value)` - Type assertion for struct objects
  - `expectEnum(value)` - Type assertion for enum objects
- **Guarantees**:
  - All assertion functions fail fast with descriptive Vitest errors
  - Type assertions narrow types for subsequent code
  - `expectOk`/`expectErr` return values enable chained assertions
- **Expects**:
  - Callers use these in Vitest test files
  - Result types from neverthrow

## Dependencies

- **Uses**: `vitest` (assertions), `neverthrow` (Result types), `luxon` (DateTime type)
- **Used by**: Test files in `@grounds/core`, `@grounds/schema`, `@grounds/stream`
- **Boundary**: Test-only utilities, never used in production code

## Key Decisions

- Private package: Set `private: true` to prevent accidental publishing
- Vitest as runtime dependency: Required for `expect()` function
- Luxon as runtime dependency: Required for `DateTime.isDateTime()` check
- TypeScript assertion functions: Use `asserts value is T` for type narrowing

## Invariants

- All assertion functions call `expect()` before returning/asserting
- Failed assertions throw Vitest assertion errors (never return false)

## Key Files

- `index.ts` - All assertion helper exports

## Gotchas

- This package is for tests only - never import in production src/ code
- `expectOk`/`expectErr` use `_unsafeUnwrap` internally (safe due to prior assertion)
