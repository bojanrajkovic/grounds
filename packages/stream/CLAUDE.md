# @grounds/stream

Last verified: 2026-01-03

## Purpose

Streaming utilities for Relish serialization. Enables incremental encoding and decoding of binary data over async iterables and Web Streams API, supporting both raw binary and schema-aware streaming.

## Contracts

- **Exposes**:
  - `StreamBuffer` class - Accumulates chunks, exposes `tryDecodeOne()` for incremental decoding
  - `TryDecodeResult` type - Discriminated union: `{ status: "ok" | "needMore" | "error" }`
  - `encodeIterable(values)` - AsyncGenerator yielding `Result<Uint8Array, EncodeError>` per value
  - `encodeIterableBytes(values)` - AsyncGenerator yielding `Uint8Array`, throws on error
  - `decodeIterable(chunks)` - AsyncGenerator yielding `Result<DecodedValue, DecodeError>`
  - `createEncoderStream()` - Web TransformStream: `RelishValue` to `Uint8Array`
  - `createDecoderStream()` - Web TransformStream: `Uint8Array` to `DecodedValue`
  - `createSchemaEncoderStream(schema)` - Web TransformStream: `Static<T>` to `Uint8Array`
  - `createSchemaDecoderStream(schema)` - Web TransformStream: `Uint8Array` to `Static<T>`
- **Guarantees**:
  - Incomplete data returns `needMore` status (does not error until stream ends)
  - Trailing incomplete data at stream end yields `TRUNCATED_STREAM` error
  - Schema streams convert raw decoded values to TypeScript-typed values using `fromRelish`
  - Buffer correctly handles chunked input across message boundaries
- **Expects**:
  - Valid `RelishValue` inputs for encoding
  - Wire-compatible binary chunks for decoding
  - Valid `TRelishSchema` for schema-aware streams

## Dependencies

- **Uses**: `@grounds/core` (encode, decode, error types), `@grounds/schema` (createCodec, fromRelish)
- **Used by**: User applications needing streaming serialization
- **Boundary**: No direct I/O; wraps Web Streams API and async iterables

## Key Decisions

- AsyncGenerator over callbacks: Enables backpressure and natural async/await composition
- StreamBuffer class: Accumulates chunks, handles partial message boundaries
- Separate raw and schema streams: Raw streams work with `RelishValue`/`DecodedValue`, schema streams work with TypeScript-typed values
- TRUNCATED_STREAM error code: Distinguishes incomplete data at end-of-stream from mid-stream UNEXPECTED_EOF

## Invariants

- StreamBuffer never discards data until explicitly consumed
- `tryDecodeOne()` consumes exactly the bytes for one complete value
- Web Streams error on first decode failure (no partial error recovery)
- Schema streams use codec for encoding, decodedToTyped for decoding

## Key Files

- `index.ts` - Public exports
- `buffer.ts` - StreamBuffer class for chunk accumulation
- `encode.ts` - AsyncGenerator encoding functions
- `decode.ts` - AsyncGenerator decoding function
- `web-streams.ts` - Web Streams API wrappers (raw RelishValue)
- `schema-streams.ts` - Schema-aware Web Streams wrappers

## Gotchas

- `encodeIterableBytes` throws on error; use `encodeIterable` for Result-based handling
- Web Streams stop processing on first error (no continuation)
- `tryDecodeOne()` returns `needMore` for empty buffer (not an error)
- Schema decoder uses `fromRelish`, not full codec decode (avoids double-decode)
