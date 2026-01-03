# @grounds/stream

Streaming encode/decode utilities for Relish serialization.

## Installation

```bash
npm install @grounds/stream
```

## Usage

### AsyncGenerator API

```typescript
import { encodeIterable, decodeIterable } from "@grounds/stream";
import { TypeCode } from "@grounds/core";

// Encode values from async iterable
async function* values() {
  yield { type: TypeCode.String, value: "hello" };
  yield { type: TypeCode.U32, value: 42 };
}

for await (const result of encodeIterable(values())) {
  result.match(
    (bytes) => {
      // Send bytes (Uint8Array) to network/file
    },
    (err) => console.error("Encode failed:", err)
  );
}

// Decode from chunked input
async function* chunks() {
  yield await fetchNextChunk();
}

for await (const result of decodeIterable(chunks())) {
  result.match(
    (value) => console.log(value), // DecodedValue
    (err) => console.error("Decode failed:", err)
  );
}
```

### Web Streams API

```typescript
import { createEncoderStream, createDecoderStream } from "@grounds/stream";

// Encode: RelishValue -> Uint8Array
const encoded = valueStream.pipeThrough(createEncoderStream());

// Decode: Uint8Array -> RelishValue
const decoded = byteStream.pipeThrough(createDecoderStream());
```

### Schema-aware streaming

```typescript
import { createSchemaEncoderStream, createSchemaDecoderStream } from "@grounds/stream";
import { RStruct, RString, field } from "@grounds/schema";

const UserSchema = RStruct({
  name: field(0, RString()),
});

// Type-safe encode: User -> Uint8Array
const encoded = userStream.pipeThrough(createSchemaEncoderStream(UserSchema));

// Type-safe decode: Uint8Array -> User
const decoded = byteStream.pipeThrough(createSchemaDecoderStream(UserSchema));
```

## Error handling

Streaming decoders detect incomplete data at end of stream:

```typescript
for await (const result of decodeIterable(chunks())) {
  result.mapErr((error) => {
    if (error.code === "TRUNCATED_STREAM") {
      console.error("Incomplete value at end of input");
    }
  });
}
```

## API reference

### AsyncGenerator

- `encodeIterable(values)` - Yields `Result<Uint8Array, EncodeError>`
- `encodeIterableBytes(values)` - Yields `Uint8Array`, throws on error
- `decodeIterable(chunks)` - Yields `Result<RelishValue, DecodeError>`

### Web Streams

- `createEncoderStream()` - TransformStream<RelishValue, Uint8Array>
- `createDecoderStream()` - TransformStream<Uint8Array, RelishValue>
- `createSchemaEncoderStream(schema)` - Type-safe encoder
- `createSchemaDecoderStream(schema)` - Type-safe decoder

## License

Apache 2.0
