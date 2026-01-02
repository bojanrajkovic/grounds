# @grounds/core

Last verified: 2026-01-02

## Purpose

Low-level Relish wire format implementation. Provides type-safe value construction, type codes, and error types for encoding/decoding binary Relish data.

## Contracts

- **Exposes**:
  - `TypeCode` - Constant object mapping type names to byte codes (0x00-0x13)
  - `RelishValue` - Discriminated union of all Relish value types
  - Value constructors: `Null`, `Bool`, `U8`...`Timestamp` (19 functions + 1 singleton)
  - `EncodeError`, `DecodeError` - Error types with factory methods
  - `DecodedValue` - Union type for decoder output (raw JS values)
- **Guarantees**:
  - All RelishValue types are readonly/immutable
  - Array/Map constructors validate element types at runtime
  - 64-bit and 128-bit integers use BigInt
  - Timestamps use BigInt (Unix seconds); Luxon DateTime available via re-export
- **Expects**:
  - Callers provide correctly-typed values to constructors
  - BigInt for u64/u128/i64/i128/timestamp values

## Dependencies

- **Uses**: `luxon` (DateTime re-export for schema layer convenience)
- **Used by**: Future encoder/decoder implementations, @grounds/schema
- **Boundary**: No I/O operations; pure functional core only

## Key Decisions

- Discriminated union over classes: Enables exhaustive pattern matching, smaller bundle
- Runtime validation in Array_/Map_: Catches type mismatches early despite TypeScript erasure
- Separate DecodedValue type: Decoder returns raw JS values, not wrapped RelishValue

## Invariants

- TypeCode values are 0x00-0x13; bit 7 is always 0
- All RelishValue objects have readonly `type` discriminator
- Struct fields keyed by numeric field ID, not string names
- Map entries use native JavaScript Map (ordered insertion)

## Key Files

- `index.ts` - Public exports (re-exports from other modules)
- `types.ts` - TypeCode constants and RelishValue type definitions
- `values.ts` - Value constructor functions
- `errors.ts` - EncodeError and DecodeError classes

## Gotchas

- `String_`, `Array_`, `Map_` named with underscore to avoid shadowing globals
- Composite types in arrays/maps hold RelishValue, primitives hold raw JS values
