# First Encode

Let's encode your first value using the low-level core API.

## Basic Encoding

The `encode` function takes a tagged value and returns a `Result`:

```typescript
{{#include ../../../examples/core/encode-match.ts}}
```

Run this example:

```bash
tsx examples/core/encode-match.ts
```

## Understanding the Result

Grounds uses [neverthrow](https://github.com/supermacro/neverthrow) for error handling. The `encode` function returns `Result<Uint8Array, EncodeError>`.

Use `.match()` to handle both success and error cases:

- **Success**: Receive the encoded `Uint8Array`
- **Error**: Receive an `EncodeError` with code and message

## What's in the Bytes?

The encoded bytes contain:

1. **Type byte** (1 byte) - identifies the value type (e.g., `0x0e` for String)
2. **Length** (1-5 bytes) - varint encoding of the payload length
3. **Payload** - the actual data (e.g., UTF-8 string bytes)

For complete wire format details, see the [Relish specification](https://github.com/alex/relish/blob/main/SPEC.md).

## Next Steps

Learn about [Encoding](../core-concepts/encoding.md) in depth, or jump to [Schema](../schema/structs.md) for type-safe serialization.
