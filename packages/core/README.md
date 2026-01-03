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
    [{ type: TypeCode.String, value: "key" }, { type: TypeCode.U32, value: 123 }],
  ]),
});
```

### Decoding

```typescript
import { decode } from "@grounds/core";

const result = decode(bytes);
if (result.isOk()) {
  console.log(result.value); // RelishValue
} else {
  console.error(result.error); // DecodeError
}
```

### Error handling

All operations return `Result<T, E>` from neverthrow:

```typescript
import { encode } from "@grounds/core";

const result = encode({ type: TypeCode.U8, value: 256 }); // Out of range
if (result.isErr()) {
  console.error(result.error.code); // "INTEGER_OVERFLOW"
  console.error(result.error.message); // "u8 value 256 out of range"
}
```

## API reference

### Types

- `RelishValue` - Tagged union of all Relish value types
- `TypeCode` - Enum of type codes (0x00-0x13)
- `EncodeError` - Error type for encoding failures
- `DecodeError` - Error type for decoding failures

### Functions

- `encode(value: RelishValue): Result<Uint8Array, EncodeError>`
- `decode(bytes: Uint8Array): Result<RelishValue, DecodeError>`

## License

Apache 2.0
