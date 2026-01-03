# @grounds/schema

Last verified: 2026-01-03

## Purpose

TypeBox-based schema definitions for Relish serialization. Bridges TypeBox's JSON Schema system with Relish's binary wire format by attaching Relish-specific metadata to schemas.

## Contracts

- **Exposes**:
  - Primitive constructors: `RNull`, `RBool`, `RU8`...`RTimestamp` (18 functions)
  - Container constructors: `RArray(element)`, `RMap(key, value)`, `ROptional(inner)`
  - Composite constructors: `RStruct(fields)`, `REnum(variants)`
  - Field/variant helpers: `field(id, schema)`, `variant(id, schema)`
  - Codec: `createCodec(schema)` returns `Codec<T>` with `encode(value): Result<Uint8Array, EncodeError>` and `decode(bytes): Result<T, DecodeError>`
  - Conversion: `toRelish(value, schema)` converts JS value to Relish bytes; `fromRelish(bytes, schema)` converts bytes to schema-typed value
  - Types: `TRNull`, `TRBool`, etc., `TRelishSchema`, `TStructField`, `TEnumVariant`, `TRStruct`, `TREnum`, `Codec<T>`
- **Guarantees**:
  - All schema constructors return TypeBox-compatible schemas
  - Every schema has `[RelishKind]` and `[RelishTypeCode]` symbol properties
  - Struct fields have numeric `fieldId` property
  - Enum variants have numeric `variantId` property
  - TypeScript static inference extracts correct JS types from schemas
- **Expects**:
  - Valid TypeBox schemas or Relish schemas as inputs
  - Field/variant IDs in valid range (0-127 for bit 7 rule)
  - Callers access metadata via exported symbols, not string keys

## Dependencies

- **Uses**: `@sinclair/typebox` (schema construction), `@grounds/core` (TypeCode constants, encode/decode functions, error types), `luxon` (DateTime in conversion)
- **Used by**: Codec implementation, user applications
- **Boundary**: Conversion logic bridges between schema-aware types and Relish wire format

## Key Decisions

- Symbol-based metadata: Avoids property conflicts with TypeBox schemas
- TypeBox integration: Enables runtime validation via TypeBox's `Value` module
- Field/variant ID on schema: Allows codec to extract IDs without separate mapping
- ROptional preserves inner TypeCode: Enables codec to know underlying type
- **True API symmetry** (ADR 0001):
  - `toRelish(value, schema)` now returns `Result<Uint8Array, EncodeError>` (not `RelishValue`)
  - `fromRelish(bytes, schema)` returns `Result<T, DecodeError>`
  - Both functions take/return the same format (bytes) and opposites (value ↔ bytes)
  - Codec.encode simplified: just calls toRelish directly (no more .andThen(encode))
  - Codec.decode calls fromRelish (which handles decoding + conversion)
  - Conversion logic internally uses `_toRelishValue` helper (not exported)
  - This keeps public API minimal and truly symmetric
  - See `docs/adrs/0001-symmetric-fromrelish-with-streaming-duplication.md` for full context

## API Surface

Following project-wide API design principles (see root CLAUDE.md), this package exports a minimal public API.

**Core conversion functions**:
- `toRelish(value, schema)`: Converts JS value to Relish binary bytes. Returns `Result<Uint8Array, EncodeError>`.
- `fromRelish(bytes, schema)`: Converts Relish binary bytes to schema-typed JS value. Returns `Result<T, DecodeError>`. Needed by `@grounds/stream` for schema-aware streaming.

**Not exported (internal implementation details)**:
- Symbols: `RelishKind`, `RelishTypeCode`, `RelishFieldId`, `RelishVariantId`, `RelishElementType`, `RelishKeyType`, `RelishValueType` (schema introspection)
- Internal helper: `_toRelishValue` (Codec uses this internally; users work with bytes instead of intermediate RelishValue forms)

If users request these for advanced use cases, we can design a better API or export the existing one. But we won't export speculatively.

## Invariants

- RelishKind is always a string matching constructor name (e.g., "RU8", "RStruct")
- RelishTypeCode matches @grounds/core TypeCode values (0x00-0x13)
- Struct `fields` object preserves all TStructField metadata
- Enum `variants` object preserves all TEnumVariant metadata

## Key Files

- `index.ts` - Public exports (re-exports from other modules)
- `types.ts` - Primitive schema constructors (RNull through RTimestamp)
- `symbols.ts` - Symbol definitions for metadata keys
- `struct.ts` - Struct schema support with field tagging
- `enum.ts` - Enum schema support with variant tagging
- `convert.ts` - Bidirectional conversion: `toRelish` (JS → bytes) and `fromRelish` (bytes → JS)
- `codec.ts` - Type-safe codec: `createCodec` function and `Codec<T>` type for end-to-end encoding/decoding

## Gotchas

- Schemas are TypeBox objects with extra symbol properties; spread loses symbols
- RMap uses custom format (TypeBox lacks native Map support)
- Use symbol imports to access metadata; string keys won't work
- BigInt schemas (u64, u128, i64, i128) use Type.BigInt() not Type.Integer()
