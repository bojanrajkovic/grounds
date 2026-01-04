# Codecs

Create type-safe encoders and decoders with `createCodec`.

## Creating a Codec

Use `createCodec` to create an encoder/decoder pair:

```typescript
{{#include ../../../examples/schema/using-codecs.ts}}
```

## Codec API

A codec provides two methods:

### encode(value)

Encodes a value to bytes:

```typescript
const result: Result<Uint8Array, EncodeError> = codec.encode(value);
```

### decode(bytes)

Decodes bytes to a value:

```typescript
const result: Result<T, DecodeError> = codec.decode(bytes);
```

## Chaining Operations

Use `.andThen()` for roundtrip operations:

```typescript
codec.encode(value)
  .andThen((bytes) => codec.decode(bytes))
  .match(
    (decoded) => console.log("Success:", decoded),
    (err) => console.error("Failed:", err.message),
  );
```

## Type Safety

The codec enforces types at compile time:

```typescript
const userCodec = createCodec(UserSchema);

// TypeScript error: missing 'name' property
userCodec.encode({ id: 1 });

// TypeScript error: 'age' is not a number
userCodec.encode({ id: 1, name: "Alice", age: "thirty" });
```

## Next Steps

Learn about [Optional Fields](./optional-fields.md) for nullable values.
