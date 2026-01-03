# @grounds/stream

Last verified: 2026-01-03

## Purpose

Streaming utilities for Relish serialization. Enables incremental encoding and decoding of binary data over async iterables and Web Streams API, supporting both raw binary and schema-aware streaming.

## Contracts

- **Exposes**:
  - `encodeIterable(values)` - AsyncGenerator yielding `Result<Uint8Array, EncodeError>` per value
  - `encodeIterableBytes(values)` - AsyncGenerator yielding `Uint8Array`, throws on error
  - `decodeIterable(chunks)` - AsyncGenerator yielding `Result<DecodedValue, DecodeError>`
  - `createEncoderStream()` - Web TransformStream: `RelishValue` to `Uint8Array`
  - `createDecoderStream()` - Web TransformStream: `Uint8Array` to `DecodedValue`
  - `createSchemaEncoderStream(schema)` - Web TransformStream: `Static<T>` to `Uint8Array`
  - `createSchemaDecoderStream(schema)` - Web TransformStream: `Uint8Array` to `Static<T>`
- **Internal** (not exported):
  - `StreamBuffer` class - Accumulates chunks for incremental decoding
  - `TryDecodeResult` type - Internal status type for buffer operations
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
- **Intentional duplication of conversion logic** (ADR 0001):
  - `_decodeValueToTyped` in this package duplicates logic from `@grounds/schema`
  - Streaming layer needs direct Decoder access for byte tracking
  - Both packages implement identical conversion algorithm independently
  - This keeps packages self-contained and avoids inter-package coupling
  - See `docs/adrs/0001-symmetric-fromrelish-with-streaming-duplication.md` for context
  - **Maintenance note:** If conversion algorithm changes in schema package, update `_decodeValueToTyped` here

## Invariants

- StreamBuffer never discards data until explicitly consumed
- `tryDecodeOne()` consumes exactly the bytes for one complete value
- Web Streams error on first decode failure (no partial error recovery)
- Schema streams use codec for encoding, fromRelish for decoding

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
- **Error handling asymmetry between encode/decode iterables**:
  - `encodeIterable`: Yields error Result and **continues** to next value (errors are isolated per-value)
  - `decodeIterable`: Yields error Result and **stops** (stream corruption makes remaining data unreliable)
  - This difference is intentional: encoding errors are independent (bad value doesn't affect others), but decoding errors indicate stream corruption (byte boundaries are lost)
