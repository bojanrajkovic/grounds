# Decoding

Decode bytes back to typed values.

## Roundtrip with .andThen()

Chain encoding and decoding operations:

```typescript validator=typescript
{{#include ../../../examples/core/encode-roundtrip.ts}}
```

The `.andThen()` method chains fallible operations. If encoding fails, decoding is skipped and the error propagates.

## Decoding Standalone

You can also decode bytes directly:

```typescript
import { decode } from "@grounds/core";

// Decode some bytes
decode(bytes).match(
  (value) => console.log("Decoded:", value),
  (err) => console.error("Failed:", err.message),
);
```

## Type Information

Decoded values include their type code:

```typescript
decode(bytes).match(
  (value) => {
    console.log("Type:", value.type);  // e.g., TypeCode.String
    console.log("Value:", value.value); // e.g., "hello"
  },
  (err) => console.error(err.message),
);
```

## Next Steps

Learn about [Error Handling](./error-handling.md) for robust error management.
