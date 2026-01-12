# @grounds/core

Last verified: 2026-01-11

## Purpose

Low-level Relish wire format implementation. Provides type-safe value construction, type codes, and error types for encoding/decoding binary Relish data.

## Contracts

- **Exposes**:
  - `TypeCode` - Constant object mapping type names to byte codes (0x00-0x13)
  - `RelishValue` - Discriminated union of all Relish value types (branded with internal symbol)
  - Value constructors: `Null`, `Bool`, `U8`...`Timestamp` (19 functions + 1 singleton)
  - `encode(value: RelishValue) -> Result<Uint8Array, EncodeError>` - Encode a value to bytes
  - `Encoder` class - Reusable encoder with pre-allocated buffer for performance
  - `decode(bytes: Uint8Array) -> Result<DecodedValue, DecodeError>` - Decode bytes to raw JS values
  - `Decoder` class - Cursor-based binary decoder with validation
  - `EncodeError` - Error type with factory methods: `unsortedFields()`, `invalidFieldId()`, `invalidTypeCode()`, `unsupportedType()`, `unknownVariant()`, `integerOutOfRange()`, `notAnInteger()`
  - `DecodeError` - Error type with `code` property and factory methods: `unexpectedEnd()`, `unknownTypeCode()`, `invalidTypeCode()`, `unsortedFields()`, `duplicateMapKey()`, `invalidUtf8()`, `enumLengthMismatch()`, `invalidFieldId()`, `invalidVariantId()`, `missingRequiredField()`, `unknownVariantId()`, `unsupportedType()`, `truncatedStream()`
  - `DecodeErrorCode` - Discriminated union type for error classification: "UNEXPECTED_EOF" | "INVALID_TYPE_CODE" | "INVALID_LENGTH" | "INVALID_UTF8" | "INTEGER_OVERFLOW" | "TRUNCATED_STREAM" | "UNSORTED_FIELDS" | "DUPLICATE_MAP_KEY" | "ENUM_LENGTH_MISMATCH" | "INVALID_FIELD_ID" | "INVALID_VARIANT_ID" | "MISSING_REQUIRED_FIELD" | "UNKNOWN_VARIANT_ID" | "UNSUPPORTED_TYPE"
  - `DecodedValue` - Union type for decoder output (raw JS values: number | bigint | boolean | null | string | DateTime | ReadonlyArray | ReadonlyMap | object)
- **Guarantees**:
  - All RelishValue types are readonly/immutable and branded (cannot be constructed with object literals)
  - RelishValue must be created through value constructor functions (U8(), String_(), etc.)
  - Integer value constructors (U8-U128, I8-I128) validate range at runtime, throw `Error` on invalid input
  - Encoder validates integer values (defense in depth), returns `EncodeError` for invalid values
  - Array/Map constructors validate element types at runtime
  - 64-bit and 128-bit integers use BigInt
  - Timestamps use BigInt (Unix seconds) in encoding; Luxon DateTime in decoding
  - Encoder produces wire-compatible output matching Rust reference implementation
  - Decoder accepts wire-compatible binary format from Rust reference implementation
  - Struct fields encoded/decoded in ascending field ID order
  - Map keys validated for uniqueness
  - Enum length validated for correctness
- **Expects**:
  - Callers use value constructor functions to create RelishValue (not object literals)
  - Callers handle thrown `Error` from value constructors when passing invalid input (programmer error)
  - Decoder callers provide complete, valid binary data
  - BigInt for u64/u128/i64/i128/timestamp values in RelishValue
  - Struct field IDs in range 0-127

## Dependencies

- **Uses**: `luxon` (DateTime for timestamp decoding), `neverthrow` (Result types)
- **Used by**: @grounds/schema, streaming utilities
- **Boundary**: No I/O operations; pure functional core only

## Key Decisions

- Discriminated union over classes: Enables exhaustive pattern matching, smaller bundle
- Branded types via `RELISH_BRAND` symbol: Prevents object literal construction, enforces use of constructor functions
- Defense-in-depth validation: Encoder re-validates integers even with branded types (catches bypasses at runtime)
- Runtime validation in Array_/Map_: Catches type mismatches early despite TypeScript erasure
- Separate DecodedValue type: Decoder returns raw JS values, not wrapped RelishValue
- Encoder class with reusable buffer: Avoids allocation overhead for repeated encoding
- Decoder class with cursor: Tracks position for streaming decoding capability
- Tagged varint for lengths: Short form (1 byte) for <128, long form (4 bytes) otherwise
- Duplicate key detection via JSON serialization: Catches map encoding violations
- Length validation for Enum: Ensures declared content length matches actual bytes read
- Integer constructors throw on invalid input: Programmer error (invalid range, non-integer) is fail-fast, not Result

## Invariants

- TypeCode values are 0x00-0x13; bit 7 is always 0
- All RelishValue objects have readonly `type` discriminator and `RELISH_BRAND` symbol property
- RelishValue cannot be created with object literals (TypeScript compiler error due to branded symbol)
- Integer values are always within type-specific bounds (enforced at construction and encoding)
- Struct fields keyed by numeric field ID, not string names
- Map entries use native JavaScript Map (ordered insertion)
- Field IDs and variant IDs must have bit 7 clear (valid range 0-127)
- Struct field IDs must be strictly ascending
- Map keys must be unique (validated during decoding)

## Key Files

- `index.ts` - Public exports (re-exports from other modules)
- `types.ts` - TypeCode constants, RelishValue/DecodedValue type definitions, RELISH_BRAND symbol
- `values.ts` - Value constructor functions (with validation)
- `errors.ts` - EncodeError and DecodeError classes with factory methods
- `encoder.ts` - Encoder class and encode() function (with defense-in-depth validation)
- `decoder.ts` - Decoder class and decode() function
- `encoding-helpers.ts` - Tagged varint encoding, type code mapping
- `integer-bounds.ts` - Internal: integer range constants and validation functions (shared by values.ts and encoder.ts)

## Gotchas

- `String_`, `Array_`, `Map_` named with underscore to avoid shadowing globals
- RelishValue cannot be created with `{ type: "u8", value: 42 }` - use `U8(42)` constructor
- Composite types in arrays/maps hold RelishValue, primitives hold raw JS values
- Encoder.encode() resets position; reuse same Encoder instance for performance
- Encoder validates integers even if value constructors are bypassed (defense in depth)
- Array/Map elements encoded without type tag (type in container header)
- Decoder validates all constraints (field order, map keys, enum length, bit 7 rules)
- DateTime decoding may lose precision for extremely large Unix seconds values
- `RELISH_BRAND` symbol is internal and not exported (prevents external type manipulation)
