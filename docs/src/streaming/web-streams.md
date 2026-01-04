# Web Streams

Use the WHATWG Streams API for encode/decode pipelines.

## Transform Streams

Use `createEncoderStream` and `createDecoderStream`:

```typescript validator=typescript
{{#include ../../../examples/stream/web-streams.ts}}
```

## createEncoderStream

Creates a `TransformStream` that encodes `RelishValue` to `Uint8Array`:

```typescript
const encoderStream = createEncoderStream();

valueStream
  .pipeThrough(encoderStream)
  .pipeTo(networkSink);
```

## createDecoderStream

Creates a `TransformStream` that decodes `Uint8Array` to `RelishValue`:

```typescript
const decoderStream = createDecoderStream();

networkSource
  .pipeThrough(decoderStream)
  .pipeTo(valueHandler);
```

## Pipeline Composition

Chain multiple transforms:

```typescript
sourceStream
  .pipeThrough(createEncoderStream())
  .pipeThrough(compressionStream)
  .pipeTo(networkSink);
```

## Browser Compatibility

Web Streams are supported in:

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Node.js 16+ (with `--experimental-fetch` or Node 18+)
- Deno
- Cloudflare Workers

## Next Steps

For type-safe streaming with schemas, see [Schema with Web Streams](./schema-web-streams.md).

See the [Reference](../reference/type-codes.md) section for wire format details.
