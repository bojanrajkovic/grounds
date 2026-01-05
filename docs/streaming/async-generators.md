# Async Generators

Stream encode and decode with async generators.

## Streaming Encode/Decode

Use `encodeIterable` and `decodeIterable` for streaming:

```typescript validator=typescript
{{#include ../../examples/stream/async-generators.ts}}
```

## encodeIterable

Encodes values from an async generator:

```typescript
async function* values(): AsyncGenerator<RelishValue> {
  yield { type: TypeCode.String, value: "hello" };
  yield { type: TypeCode.U32, value: 42 };
}

for await (const result of encodeIterable(values())) {
  result.match(
    (bytes) => sendChunk(bytes),
    (err) => console.error(err),
  );
}
```

## decodeIterable

Decodes values from an async generator of byte chunks:

```typescript
async function* chunks(): AsyncGenerator<Uint8Array> {
  yield await receiveChunk();
}

for await (const result of decodeIterable(chunks())) {
  result.match(
    (value) => processValue(value),
    (err) => console.error(err),
  );
}
```

## Error Handling

Each yielded item is a `Result`, allowing per-item error handling:

- Continue processing after recoverable errors
- Accumulate errors for batch reporting
- Stop on first error if needed

## Next Steps

Learn about [Web Streams](./web-streams.md) for the WHATWG Streams API.

For type-safe streaming with schemas, see [Schema with Async Generators](./schema-async-generators.md).
