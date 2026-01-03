# @grounds/schema

Last verified: 2026-01-02

## Purpose

TypeBox-based schema definitions for Relish serialization. Bridges TypeBox's JSON Schema system with Relish's binary wire format by attaching Relish-specific metadata to schemas.

## Contracts

- **Exposes**:
  - Primitive constructors: `RNull`, `RBool`, `RU8`...`RTimestamp` (18 functions)
  - Container constructors: `RArray(element)`, `RMap(key, value)`, `ROptional(inner)`
  - Composite constructors: `RStruct(fields)`, `REnum(variants)`
  - Field/variant helpers: `field(id, schema)`, `variant(id, schema)`
  - Codec: `createCodec(schema)` returns `Codec<T>` with `encode(value): Result<Uint8Array, EncodeError>` and `decode(bytes): Result<T, DecodeError>`
  - Conversion functions: `jsToRelish(value, schema)` - JS value → RelishValue, `decodedToTyped(value, schema)` - DecodedValue → schema-aware typed JS
  - Symbols: `RelishKind`, `RelishTypeCode`, `RelishFieldId`, `RelishVariantId`, `RelishElementType`, `RelishKeyType`, `RelishValueType`
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
- `convert.ts` - Bidirectional conversion: `jsToRelish` (JS → RelishValue) and `decodedToTyped` (DecodedValue → schema-aware typed JS)
- `codec.ts` - Type-safe codec: `createCodec` function and `Codec<T>` type for end-to-end encoding/decoding

## Gotchas

- Schemas are TypeBox objects with extra symbol properties; spread loses symbols
- RMap uses custom format (TypeBox lacks native Map support)
- Use symbol imports to access metadata; string keys won't work
- BigInt schemas (u64, u128, i64, i128) use Type.BigInt() not Type.Integer()
