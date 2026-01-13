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

The standard CompressionStream API supports:

| Algorithm | Description | Use Case |
|-----------|-------------|----------|
| `gzip` | Most compatible, includes header/checksum | General purpose, HTTP compression |
| `deflate` | Raw deflate with zlib header | Legacy compatibility |
| `deflate-raw` | Raw deflate, no header | Custom protocols |

**Note:** Advanced algorithms like Brotli and Zstd are not part of the standard CompressionStream API and require polyfills or platform-specific implementations.

## Compression Ratios

Compression effectiveness depends on your data. Structured data with repeated values compresses well:

```
20 log entries:  ~71% compression (2,112 → 600 bytes)
50 log entries:  ~80% compression (5,262 → 1,024 bytes)
100 log entries: ~84% compression (10,508 → 1,650 bytes)
```

Relish's binary format is already compact, but compression adds significant savings for larger payloads with repetitive content.

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

## Browser Compatibility

CompressionStream is supported in:

- Chrome 80+
- Firefox 113+
- Safari 16.4+
- Edge 80+
- Node.js 18+ (global)
- Deno

For older environments, consider polyfills like [compression-streams-polyfill](https://github.com/nicolo-ribaudo/compression-streams-polyfill).

## Next Steps

- See [Schema with Web Streams](./schema-web-streams.md) for more on typed streaming
- See the [Reference](../reference/type-codes.md) section for wire format details
