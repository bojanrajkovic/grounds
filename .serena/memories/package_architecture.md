# Package Architecture

## Dependency Graph

```
@grounds/core (no dependencies)
       ↓
@grounds/schema (depends on core + typebox + luxon)
       ↓
@grounds/stream (depends on schema)
```

## @grounds/core

**Purpose**: Low-level TLV encoding/decoding

**Key Exports**:

- `encode()` / `decode()` - Main entry points
- `RelishValue` - Tagged union of all Relish types
- `EncodeError` / `DecodeError` - Error types
- Value constructors: `rNull()`, `rBool()`, `rU32()`, etc.

**Characteristics**:

- No external dependencies (pure TypeScript)
- Works with raw `RelishValue` discriminated unions
- Returns `Result<T, Error>` from neverthrow

## @grounds/schema

**Purpose**: TypeBox-based schema definitions with type inference

**Key Exports**:

- Schema constructors: `RU8()`, `RString()`, `RArray()`, `RStruct()`, `REnum()`, etc.
- `createCodec()` - Creates encode/decode pair from schema
- `toRelish()` / `fromRelish()` - Direct encoding/decoding
- `Static<T>` - Type inference from schemas

**Characteristics**:

- Builds on TypeBox for schema definitions
- Full TypeScript type inference via `Static<T>`
- Validates values during encoding
- Uses Luxon DateTime for timestamps

## @grounds/stream

**Purpose**: Streaming encode/decode utilities

**Key Exports**:

- `RelishEncoderStream` / `RelishDecoderStream` - Web Streams API
- `encodeAsyncIterable()` / `decodeAsyncIterable()` - Async generators
- Schema-aware stream variants

**Characteristics**:

- Works with Web Streams API (TransformStream)
- Supports async iteration patterns
- Handles chunked/partial data

## @grounds/test-utils (private)

**Purpose**: Shared test helpers

**Key Exports**:

- `expectOk()` / `expectErr()` - Result assertions
- `hexToBytes()` / `bytesToHex()` - Binary helpers

**Characteristics**:

- Not published to npm
- Used only by other packages' tests
