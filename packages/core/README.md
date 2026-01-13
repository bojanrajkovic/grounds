# @grounds/core

Low-level Relish binary serialization for TypeScript.

## Installation

```bash
npm install @grounds/core
```

## Usage

### Encoding

```typescript
import { encode, TypeCode } from "@grounds/core";

// Encode primitive values
const nullResult = encode({ type: TypeCode.Null, value: null });
const boolResult = encode({ type: TypeCode.Bool, value: true });
const u32Result = encode({ type: TypeCode.U32, value: 42 });
const stringResult = encode({ type: TypeCode.String, value: "hello" });

// Encode arrays
const arrayResult = encode({
  type: TypeCode.Array,
  value: [
    { type: TypeCode.U8, value: 1 },
    { type: TypeCode.U8, value: 2 },
  ],
});

// Encode maps
const mapResult = encode({
  type: TypeCode.Map,
  value: new Map([
    [
      { type: TypeCode.String, value: "key" },
      { type: TypeCode.U32, value: 123 },
    ],
  ]),
});
```

### Decoding

```typescript
import { decode } from "@grounds/core";

const result = decode(bytes);
result.match(
  (value) => console.log(value), // DecodedValue
  (error) => console.error(error), // DecodeError
);
```

### Error handling

All operations return `Result<T, E>` from neverthrow:

```typescript
import { encode, TypeCode } from "@grounds/core";

const result = encode({ type: TypeCode.U8, value: 256 }); // Out of range
result.mapErr((error) => {
  console.error(error.code); // "INTEGER_OVERFLOW"
  console.error(error.message); // "u8 value 256 out of range"
});

// Or use match for both success and error cases
result.match(
  (bytes) => console.log("Encoded:", bytes),
  (error) => console.error("Failed:", error.message),
);
```

## API reference

### Types

- `RelishValue` - Tagged union of all Relish value types
- `DecodedValue` - Union type for decoder output (raw JS values)
- `TypeCode` - Enum of type codes (0x00-0x13)
- `EncodeError` - Error type for encoding failures
- `DecodeError` - Error type for decoding failures

### Functions

- `encode(value: RelishValue): Result<Uint8Array, EncodeError>`
- `decode(bytes: Uint8Array): Result<DecodedValue, DecodeError>`

## License

Apache 2.0
