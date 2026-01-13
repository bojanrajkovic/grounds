# Compressed Streams

Combine schema-aware streams with the Web Streams CompressionStream API for efficient data transfer.

## Full Example

This example demonstrates encoding log entries, compressing them, then decompressing and decoding to verify the roundtrip:

```typescript validator=typescript
{{#include ../../examples/stream/compressed-streams.ts}}
```

## Composing with CompressionStream

Since `createSchemaEncoderStream` outputs `Uint8Array` and `CompressionStream` accepts `Uint8Array`, they compose directly:

```typescript
import { createSchemaEncoderStream } from "@grounds/stream";
import { RStruct, RString, field } from "@grounds/schema";

const MessageSchema = RStruct({
  sender: field(0, RString()),
  content: field(1, RString()),
});

// Encode → Compress pipeline
sourceStream
  .pipeThrough(createSchemaEncoderStream(MessageSchema))
  .pipeThrough(new CompressionStream("gzip"))
  .pipeTo(networkSink);
```

No adapters or conversion needed—standard Web Streams composition.

## Decompression Pipeline

The reverse pipeline decompresses then decodes:

```typescript
import { createSchemaDecoderStream } from "@grounds/stream";

// Decompress → Decode pipeline
networkSource
  .pipeThrough(new DecompressionStream("gzip"))
  .pipeThrough(createSchemaDecoderStream(MessageSchema))
  .pipeTo(messageHandler);
```

## Supported Algorithms

| Algorithm     | Description                               | Runtime Support |
| ------------- | ----------------------------------------- | --------------- |
| `gzip`        | Most compatible, includes header/checksum | All runtimes    |
| `deflate`     | Raw deflate with zlib header              | All runtimes    |
| `deflate-raw` | Raw deflate, no header                    | All runtimes    |
| `zstd`        | Fast, high compression ratio              | Bun only        |

**Note:** Brotli is not currently supported by any runtime's native CompressionStream API.

## Compression Ratios

Compression effectiveness depends on your data. The example uses [faker](https://fakerjs.dev/) to generate realistic, varied log entries:

```
20 log entries:  ~55% compression (5,763 → 2,576 bytes)
50 log entries:  ~58% compression (14,000 → 5,900 bytes)
100 log entries: ~60% compression (28,000 → 11,200 bytes)
```

Highly repetitive data (same messages, same IDs) would compress even better. Real-world data typically falls somewhere in between.

## TypeScript Considerations

The TypeScript DOM types for `CompressionStream` don't perfectly align with Web Streams generics. You may need type assertions:

```typescript
// Type assertion for TypeScript compatibility
.pipeThrough(
  new CompressionStream("gzip") as unknown as TransformStream<
    Uint8Array,
    Uint8Array
  >
)
```

This is a TypeScript type definition issue, not a runtime problem.

## Runtime Compatibility

CompressionStream is supported in:

- Chrome 80+
- Firefox 113+
- Safari 16.4+
- Edge 80+
- Node.js 18+
- Deno
- Bun (includes `zstd` support)

For older environments, consider polyfills like [compression-streams-polyfill](https://github.com/nicolo-ribaudo/compression-streams-polyfill).

## Next Steps

- See [Schema with Web Streams](./schema-web-streams.md) for more on typed streaming
- See the [Reference](../reference/type-codes.md) section for wire format details
