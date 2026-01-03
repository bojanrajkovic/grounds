# @grounds/core

Last verified: 2026-01-02

## Purpose

Low-level Relish wire format implementation. Provides type-safe value construction, type codes, and error types for encoding/decoding binary Relish data.

## Contracts

- **Exposes**:
  - `TypeCode` - Constant object mapping type names to byte codes (0x00-0x13)
  - `RelishValue` - Discriminated union of all Relish value types
  - Value constructors: `Null`, `Bool`, `U8`...`Timestamp` (19 functions + 1 singleton)
  - `encode(value: RelishValue) -> Result<Uint8Array, EncodeError>` - Encode a value to bytes
  - `Encoder` class - Reusable encoder with pre-allocated buffer for performance
  - `decode(bytes: Uint8Array) -> Result<DecodedValue, DecodeError>` - Decode bytes to raw JS values
  - `Decoder` class - Cursor-based binary decoder with validation
  - `EncodeError`, `DecodeError` - Error types with factory methods
  - `DecodedValue` - Union type for decoder output (raw JS values: number | bigint | boolean | null | string | DateTime | ReadonlyArray | ReadonlyMap | object)
- **Guarantees**:
  - All RelishValue types are readonly/immutable
  - Array/Map constructors validate element types at runtime
  - 64-bit and 128-bit integers use BigInt
  - Timestamps use BigInt (Unix seconds) in encoding; Luxon DateTime in decoding
  - Encoder produces wire-compatible output matching Rust reference implementation
  - Decoder accepts wire-compatible binary format from Rust reference implementation
  - Struct fields encoded/decoded in ascending field ID order
  - Map keys validated for uniqueness
  - Enum length validated for correctness
- **Expects**:
  - Callers provide correctly-typed values to constructors for encoding
  - Decoder callers provide complete, valid binary data
  - BigInt for u64/u128/i64/i128/timestamp values in RelishValue
  - Struct field IDs in range 0-127

## Dependencies

- **Uses**: `luxon` (DateTime for timestamp decoding), `neverthrow` (Result types)
- **Used by**: @grounds/schema, streaming utilities
- **Boundary**: No I/O operations; pure functional core only

## Key Decisions

- Discriminated union over classes: Enables exhaustive pattern matching, smaller bundle
- Runtime validation in Array_/Map_: Catches type mismatches early despite TypeScript erasure
- Separate DecodedValue type: Decoder returns raw JS values, not wrapped RelishValue
- Encoder class with reusable buffer: Avoids allocation overhead for repeated encoding
- Decoder class with cursor: Tracks position for streaming decoding capability
- Tagged varint for lengths: Short form (1 byte) for <128, long form (4 bytes) otherwise
- Duplicate key detection via JSON serialization: Catches map encoding violations
- Length validation for Enum: Ensures declared content length matches actual bytes read

## Invariants

- TypeCode values are 0x00-0x13; bit 7 is always 0
- All RelishValue objects have readonly `type` discriminator
- Struct fields keyed by numeric field ID, not string names
- Map entries use native JavaScript Map (ordered insertion)
- Field IDs and variant IDs must have bit 7 clear (valid range 0-127)
- Struct field IDs must be strictly ascending
- Map keys must be unique (validated during decoding)

## Key Files

- `index.ts` - Public exports (re-exports from other modules)
- `types.ts` - TypeCode constants and RelishValue/DecodedValue type definitions
- `values.ts` - Value constructor functions
- `errors.ts` - EncodeError and DecodeError classes with factory methods
- `encoder.ts` - Encoder class and encode() function
- `decoder.ts` - Decoder class and decode() function
- `encoding-helpers.ts` - Tagged varint encoding, type code mapping

## Gotchas

- `String_`, `Array_`, `Map_` named with underscore to avoid shadowing globals
- Composite types in arrays/maps hold RelishValue, primitives hold raw JS values
- Encoder.encode() resets position; reuse same Encoder instance for performance
- Array/Map elements encoded without type tag (type in container header)
- Decoder validates all constraints (field order, map keys, enum length, bit 7 rules)
- DateTime decoding may lose precision for extremely large Unix seconds values
