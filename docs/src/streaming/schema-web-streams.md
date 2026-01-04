# Schema with Web Streams

Use the WHATWG Streams API with type-safe schema encoding and decoding.

## Type-Safe Transform Streams

Use `createSchemaEncoderStream` and `createSchemaDecoderStream`:

```typescript
{{#include ../../../examples/stream/schema-web-streams.ts}}
```

## createSchemaEncoderStream

Creates a `TransformStream` that encodes typed values to `Uint8Array`:

```typescript
import { createSchemaEncoderStream } from "@grounds/stream";
import { RStruct, RString, field } from "@grounds/schema";

const MessageSchema = RStruct({
  sender: field(0, RString()),
  content: field(1, RString()),
});

const encoderStream = createSchemaEncoderStream(MessageSchema);

// Stream accepts typed Message values, outputs Uint8Array
messageStream
  .pipeThrough(encoderStream)
  .pipeTo(networkSink);
```

The encoder stream:
- Accepts values matching the schema type
- Automatically converts to Relish wire format
- Outputs `Uint8Array` chunks
- Validates values against schema

## createSchemaDecoderStream

Creates a `TransformStream` that decodes `Uint8Array` to typed values:

```typescript
const decoderStream = createSchemaDecoderStream(MessageSchema);

// Stream accepts Uint8Array, outputs typed Message values
networkSource
  .pipeThrough(decoderStream)
  .pipeTo(messageHandler);
```

The decoder stream:
- Accepts `Uint8Array` chunks
- Parses Relish wire format
- Outputs typed values matching the schema
- Validates decoded data against schema

## Pipeline Composition

Chain schema transforms with other streams:

```typescript
sourceStream
  .pipeThrough(createSchemaEncoderStream(MessageSchema))
  .pipeThrough(compressionStream)
  .pipeTo(networkSink);

networkSource
  .pipeThrough(decompressionStream)
  .pipeThrough(createSchemaDecoderStream(MessageSchema))
  .pipeTo(messageHandler);
```

## Type Safety

TypeScript enforces schema types throughout pipelines:

- Encoder input must match schema type
- Decoder output is typed by schema
- Compile-time errors for type mismatches
- No manual validation needed

## Browser Compatibility

Schema streams work in the same environments as basic streams:

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Node.js 16+ (with `--experimental-fetch` or Node 18+)
- Deno
- Cloudflare Workers

## Next Steps

See the [Reference](../reference/type-codes.md) section for wire format details.
