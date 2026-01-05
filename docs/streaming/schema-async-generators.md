# Schema with Async Generators

Stream encode and decode with type-safe schemas using async generators.

## Type-Safe Streaming

Use `createCodec` for schema-aware encoding and decoding:

```typescript validator=typescript
{{#include ../../examples/stream/schema-async-generators.ts}}
```

## Creating a Codec

Define a schema and create a typed codec:

```typescript
import { RStruct, RString, field, createCodec } from "@grounds/schema";
import { type Static } from "@sinclair/typebox";

const MessageSchema = RStruct({
  sender: field(0, RString()),
  content: field(1, RString()),
});

type Message = Static<typeof MessageSchema>;

const codec = createCodec(MessageSchema);
```

The codec provides:
- `codec.encode(value)`: Encodes typed values to `Uint8Array`
- `codec.decode(bytes)`: Decodes bytes to typed values
- Full TypeScript type inference from the schema

## Encoding with Codecs

Encode typed messages using the codec:

```typescript
async function* generateMessages(): AsyncGenerator<Message> {
  yield { sender: "alice", content: "hello" };
  yield { sender: "bob", content: "world" };
}

const chunks: Array<Uint8Array> = [];

for await (const message of generateMessages()) {
  const result = codec.encode(message);
  result.match(
    (bytes) => chunks.push(bytes),
    (err) => console.error(err.message),
  );
}
```

## Decoding with Codecs

Decode bytes back to typed messages:

```typescript
const decodedMessages: Array<Message> = [];

for (const chunk of chunks) {
  const result = codec.decode(chunk);
  result.match(
    (message) => decodedMessages.push(message),
    (err) => console.error(err.message),
  );
}
```

## Type Safety

TypeScript enforces schema types:

- `codec.encode()` accepts only values matching the schema type
- `codec.decode()` returns values with the correct TypeScript type
- Compile-time errors prevent type mismatches
- No manual type casting required

## Error Handling

Codecs return `Result` types for explicit error handling:

- Encoding errors for invalid schema values
- Decoding errors for malformed binary data
- Per-message error handling in streams
- Continue processing after recoverable errors

## Next Steps

Learn about [Schema with Web Streams](./schema-web-streams.md) for the WHATWG Streams API with type safety.
