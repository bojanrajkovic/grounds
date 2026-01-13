# Grounds: Relish Serialization in TypeScript

## Overview

Grounds is a TypeScript implementation of Alex Gaynor's [Relish](https://github.com/alex/relish) binary serialization format. The library provides efficient binary encoding with explicit backwards compatibility through field tagging.

**Goals:**

- Full Relish spec compliance (20 type IDs, T[L]V encoding, validation rules)
- Cross-platform support (Node.js, browser, edge runtimes)
- Two-layer architecture: low-level wire format + schema-driven TypeBox integration
- High performance with pure TypeScript, balanced with readability
- Type-safe API with Result types (neverthrow) for all fallible operations

**Success criteria:**

- Byte-level compatibility with Rust reference implementation
- All Rust test vectors pass
- Full TypeScript type inference from schemas
- Streaming encode/decode support

## Architecture

Monorepo with three packages:

```
grounds/
├── packages/
│   ├── core/           # @grounds/core - Low-level T[L]V encoding
│   ├── schema/         # @grounds/schema - TypeBox integration
│   └── stream/         # @grounds/stream - Streaming utilities
├── pnpm-workspace.yaml
├── mise.toml
└── CLAUDE.md
```

### @grounds/core

Low-level Relish wire format implementation.

**Exports:**

- `TypeCode` - Enum of all 20 Relish type IDs (0x00-0x13)
- `RelishValue` - Discriminated union of all value types
- Value constructors: `Null`, `Bool()`, `U8()`, ..., `Struct()`, `Enum()`
- `encode(value: RelishValue): Result<Uint8Array, EncodeError>`
- `decode(bytes: Uint8Array): Result<RelishValue, DecodeError>`
- `Encoder` / `Decoder` classes for instance reuse (performance)
- Error types: `EncodeError`, `DecodeError`

**Dependencies:** `neverthrow`

### @grounds/schema

TypeBox integration for schema-driven serialization.

**Exports:**

- Type constructors: `RNull()`, `RBool()`, `RU8()`, ..., `RTimestamp()`
- Collection types: `RArray()`, `RMap()`, `ROptional()`
- Composite types: `RStruct()`, `REnum()`, `field()`, `variant()`
- `createCodec(schema): Codec<T>` - Creates type-safe encoder/decoder
- `Codec<T>` interface with `encode()` and `decode()` methods

**Dependencies:** `@grounds/core`, `neverthrow`
**Peer dependencies:** `@sinclair/typebox`, `luxon`

### @grounds/stream

Streaming encode/decode utilities.

**Exports:**

- `encodeIterable(values): AsyncGenerator<Uint8Array>` - Primary streaming encoder
- `decodeIterable(chunks): AsyncGenerator<Result<RelishValue, DecodeError>>` - Primary streaming decoder
- `createEncoderStream()` / `createDecoderStream()` - Web Streams wrappers
- Schema-aware streaming helpers

**Dependencies:** `@grounds/core`, `neverthrow`

### Data Flow

```
JavaScript Value
      │
      ▼ (schema layer)
   Codec.encode()
      │
      ▼ (conversion)
   RelishValue
      │
      ▼ (core layer)
   encode()
      │
      ▼
   Uint8Array (wire format)
      │
      ▼ (network/storage)
   ...
      │
      ▼
   Uint8Array
      │
      ▼ (core layer)
   decode()
      │
      ▼
   RelishValue
      │
      ▼ (conversion)
   Codec.decode()
      │
      ▼
JavaScript Value
```

### Wire Format Summary

Relish uses Type-Length-Value encoding:

- **Type ID**: 1 byte (0x00-0x13, bit 7 reserved)
- **Length** (varsize types only): Tagged varint
  - Bit 0 = 0: 7-bit length (0-127 bytes)
  - Bit 0 = 1: 4-byte little-endian (up to 2³¹-1 bytes)
- **Value**: Type-specific encoding, little-endian for multi-byte integers

### Type Mapping

| Relish Type | TypeCode  | JS Type            | Schema Type                 |
| ----------- | --------- | ------------------ | --------------------------- |
| Null        | 0x00      | `null`             | `RNull()`                   |
| Bool        | 0x01      | `boolean`          | `RBool()`                   |
| u8-u32      | 0x02-0x04 | `number`           | `RU8()`, `RU16()`, `RU32()` |
| u64, u128   | 0x05-0x06 | `bigint`           | `RU64()`, `RU128()`         |
| i8-i32      | 0x07-0x09 | `number`           | `RI8()`, `RI16()`, `RI32()` |
| i64, i128   | 0x0a-0x0b | `bigint`           | `RI64()`, `RI128()`         |
| f32, f64    | 0x0c-0x0d | `number`           | `RF32()`, `RF64()`          |
| String      | 0x0e      | `string`           | `RString()`                 |
| Array       | 0x0f      | `T[]`              | `RArray(T)`                 |
| Map         | 0x10      | `Map<K, V>`        | `RMap(K, V)`                |
| Struct      | 0x11      | `object`           | `RStruct({...})`            |
| Enum        | 0x12      | tagged union       | `REnum({...})`              |
| Timestamp   | 0x13      | `DateTime` (Luxon) | `RTimestamp()`              |

## Existing Patterns

This is a greenfield project. No existing codebase patterns to follow.

**Patterns adopted from user's other projects (~/Code):**

- Vitest for testing
- Oxlint for linting (strict rules)
- Mise for tool management
- pnpm for package management
- ESM modules (`"type": "module"`)
- Strict TypeScript settings (@tsconfig/strictest)
- `src/` for source, `tests/` for tests

**Patterns from Relish ecosystem:**

- Test vectors extracted from Rust reference implementation
- Byte-level compatibility validation

## Implementation Phases

### Phase 1: Project Scaffolding

**Goal:** Initialize monorepo with tooling and CLAUDE.md

**Components:**

- Create: `packages/core/package.json`
- Create: `packages/schema/package.json`
- Create: `packages/stream/package.json`
- Create: `pnpm-workspace.yaml`
- Create: `mise.toml` (node = "lts", pnpm = "latest")
- Create: `tsconfig.json` (strict, ESM, extends @tsconfig/strictest)
- Create: `tsconfig.base.json` (shared config for packages)
- Create: `oxlint.json` (strict rules)
- Create: `vitest.config.ts`
- Create: `CLAUDE.md` (project rules)
- Create: `.gitignore`

**Dependencies:** None (first phase)

**Testing:**

- `pnpm install` succeeds
- `pnpm build` succeeds (empty packages)
- `pnpm lint` runs without error
- `pnpm test` runs (no tests yet)

### Phase 2: @grounds/core - Types & Values

**Goal:** Implement type system and value constructors

**Components:**

- Create: `packages/core/src/types.ts` (TypeCode enum, RelishValue union)
- Create: `packages/core/src/values.ts` (Null, Bool, U8...Enum constructors)
- Create: `packages/core/src/errors.ts` (EncodeError, DecodeError classes)
- Create: `packages/core/src/index.ts` (exports)
- Create: `packages/core/tests/values.test.ts`

**Dependencies:** Phase 1 complete

**Testing:**

- Value constructors create correct RelishValue objects
- TypeCode constants match Relish spec (0x00-0x13)
- Error classes have correct structure and static factory methods

### Phase 3: @grounds/core - Encoder

**Goal:** Implement binary encoding for all types

**Components:**

- Create: `packages/core/src/encoder.ts`
  - `encode(value: RelishValue): Result<Uint8Array, EncodeError>`
  - `class Encoder` with pre-allocated buffer
  - Tagged varint length encoding
  - Little-endian integer encoding via DataView
  - Struct field ordering validation
- Create: `packages/core/tests/encoder.test.ts`
- Create: `packages/core/tests/fixtures/` (reference test vectors from Rust)

**Dependencies:** Phase 2 complete

**Testing:**

- All primitive types encode correctly
- Structs encode with ascending field IDs
- Maps encode with consistent key/value types
- Enums encode variant ID + value
- Reference test vectors from Rust implementation pass
- Invalid inputs (unsorted fields, etc.) return EncodeError

### Phase 4: @grounds/core - Decoder

**Goal:** Implement binary decoding with full validation

**Components:**

- Create: `packages/core/src/decoder.ts`
  - `decode(bytes: Uint8Array): Result<RelishValue, DecodeError>`
  - `class Decoder` for instance reuse
  - Tagged varint length decoding
  - UTF-8 validation for strings
  - Field ID ordering validation
  - Map key uniqueness validation
  - Enum length matching validation
- Create: `packages/core/tests/decoder.test.ts`
- Create: `packages/core/tests/roundtrip.test.ts` (property-based)

**Dependencies:** Phase 3 complete

**Testing:**

- All primitive types decode correctly
- Invalid type IDs (bit 7 set) rejected
- Unsorted struct field IDs rejected
- Duplicate map keys rejected
- Invalid UTF-8 rejected
- Enum length mismatches rejected
- Roundtrip: encode(decode(bytes)) === bytes
- Reference test vectors from Rust pass

### Phase 5: @grounds/schema - Types

**Goal:** Implement TypeBox-based schema type constructors

**Components:**

- Create: `packages/schema/src/types.ts`
  - `RNull()`, `RBool()`, `RU8()`...`RF64()`, `RString()`, `RTimestamp()`
  - `RArray<T>()`, `RMap<K, V>()`, `ROptional<T>()`
  - Symbol-based metadata for type codes
- Create: `packages/schema/src/struct.ts`
  - `field(fieldId, schema)` helper
  - `RStruct({ name: field(1, RString()), ... })`
  - `RelishStructSchema<T>` type
- Create: `packages/schema/src/enum.ts`
  - `variant(variantId, schema)` helper
  - `REnum({ variant1: variant(1, RU32()), ... })`
  - `RelishEnumSchema<T>` type
- Create: `packages/schema/src/index.ts`
- Create: `packages/schema/tests/types.test.ts`
- Create: `packages/schema/tests/inference.test.ts` (compile-time type tests)

**Dependencies:** Phase 4 complete

**Testing:**

- Schema types carry correct TypeCode metadata
- TypeScript infers correct static types from schemas
- ROptional wraps schemas correctly
- RTimestamp integrates with Luxon DateTime

### Phase 6: @grounds/schema - Codec

**Goal:** Implement type-safe encoding/decoding with schema

**Components:**

- Create: `packages/schema/src/convert.ts`
  - `toRelish(value, schema): Result<RelishValue, EncodeError>`
  - `fromRelish(value, schema): Result<T, DecodeError>`
  - DateTime <-> Timestamp conversion
- Create: `packages/schema/src/codec.ts`
  - `createCodec(schema): Codec<T>`
  - `Codec<T>.encode(value): Result<Uint8Array, EncodeError>`
  - `Codec<T>.decode(bytes): Result<T, DecodeError>`
- Create: `packages/schema/tests/codec.test.ts`
- Create: `packages/schema/tests/conversion.test.ts`

**Dependencies:** Phase 5 complete

**Testing:**

- Struct encoding/decoding with type inference
- Enum encoding/decoding with variant discrimination
- Optional fields omitted when undefined
- Unknown struct fields ignored (forward compatibility)
- DateTime values roundtrip through Timestamp
- Map<K, V> uses native Map in JavaScript

### Phase 7: @grounds/stream

**Goal:** Implement streaming encode/decode

**Components:**

- Create: `packages/stream/src/buffer.ts`
  - `StreamBuffer` class for chunk accumulation
  - `append()`, `peek()`, `consume()`, `tryDecodeOne()`
- Create: `packages/stream/src/encode.ts`
  - `encodeIterable(values): AsyncGenerator<Uint8Array>`
  - `createEncoderStream(values): ReadableStream<Uint8Array>`
- Create: `packages/stream/src/decode.ts`
  - `decodeIterable(chunks): AsyncGenerator<Result<RelishValue, DecodeError>>`
  - `createDecoderStream(): TransformStream`
- Create: `packages/stream/src/schema.ts`
  - `encodeSchemaIterable(codec, values)`
  - `decodeSchemaIterable(codec, chunks)`
- Create: `packages/stream/src/index.ts`
- Create: `packages/stream/tests/encode.test.ts`
- Create: `packages/stream/tests/decode.test.ts`
- Create: `packages/stream/tests/chunking.test.ts`

**Dependencies:** Phase 6 complete

**Testing:**

- Multiple values encode to stream correctly
- Decoding handles chunk boundaries (value split across chunks)
- Incomplete final value returns error
- Web Streams API works in Node.js
- Schema-aware streaming preserves type safety

### Phase 8: Documentation & Polish

**Goal:** Prepare for npm publish

**Components:**

- Create: `packages/core/README.md`
- Create: `packages/schema/README.md`
- Create: `packages/stream/README.md`
- Create: `README.md` (root, links to packages)
- Add: TSDoc comments to all public exports
- Create: `examples/` directory with usage examples
- Create: `benchmarks/` directory with performance tests
- Update: `package.json` files with publish metadata
- Create: `LICENSE` (Apache 2.0)

**Dependencies:** Phase 7 complete

**Testing:**

- All READMEs render correctly
- TSDoc generates API docs
- Examples compile and run
- Benchmarks show reasonable performance
- `npm pack` produces valid packages

## Additional Considerations

**BigInt handling:** All 64-bit and 128-bit integers use JavaScript BigInt. No automatic conversion to number. Users convert as needed.

**Map representation:** Decoded maps always use native JavaScript `Map<K, V>`, even for string keys. This provides consistent API regardless of key type.

**Timestamp representation:** Schema layer uses Luxon `DateTime`. Core layer uses `bigint` (Unix seconds). Conversion happens in schema codec.

**Browser compatibility:** Uses `Uint8Array` and `DataView` everywhere. No Node.js-specific APIs in core. Web Streams API (ReadableStream/WritableStream) for streaming.

**Performance considerations:**

- Pre-allocated buffers in `Encoder` class
- Instance reuse for repeated encode/decode
- DataView for multi-byte integers (V8 optimized)
- Zero-copy with `subarray()` where possible

**Reference compatibility:** Test vectors extracted from Rust implementation ensure byte-level compatibility. Property-based testing for roundtrip verification.
