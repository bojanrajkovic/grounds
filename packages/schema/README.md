# @grounds/schema

TypeBox-based schema definitions for Relish serialization.

## Installation

```bash
npm install @grounds/schema @sinclair/typebox luxon
npm install -D @types/luxon
```

## Usage

### Defining schemas

```typescript
import {
  RStruct, REnum, RArray, RMap, ROptional,
  RNull, RBool, RU8, RU16, RU32, RU64, RString, RTimestamp,
  field, variant,
} from "@grounds/schema";

// Struct with fields
const UserSchema = RStruct({
  id: field(0, RU64()),
  name: field(1, RString()),
  email: field(2, ROptional(RString())),
  createdAt: field(3, RTimestamp()),
});

// Enum with variants
const MessageSchema = REnum({
  text: variant(0, RStruct({ content: field(0, RString()) })),
  image: variant(1, RStruct({ url: field(0, RString()), width: field(1, RU32()) })),
});

// Collections
const TagsSchema = RArray(RString);
const MetadataSchema = RMap(RString, RString);
```

### Creating codecs

```typescript
import { createCodec } from "@grounds/schema";
import { DateTime } from "luxon";

const userCodec = createCodec(UserSchema);

// Encode
const encoded = userCodec.encode({
  id: 123n,
  name: "Alice",
  email: "alice@example.com",
  createdAt: DateTime.now(),
});

encoded.match(
  (bytes) => console.log("Encoded:", bytes),
  (err) => console.error("Encode failed:", err)
);

// Decode
const decoded = userCodec.decode(bytes);
decoded.match(
  (user) => console.log("Decoded:", user),
  (err) => console.error("Decode failed:", err)
);
```

### Type inference

Schemas provide full TypeScript type inference:

```typescript
import { Static } from "@sinclair/typebox";

type User = Static<typeof UserSchema>;
// { id: bigint; name: string; email: string | null; createdAt: DateTime }

// Enum schemas infer unwrapped union types
type Message = Static<typeof MessageSchema>;
// { content: string } | { url: string; width: number }

// Users handle variant discrimination via type guards on their own discriminator fields
```

## API reference

### Primitive types

- `RNull`, `RBool`
- `RU8`, `RU16`, `RU32`, `RU64`, `RU128`
- `RI8`, `RI16`, `RI32`, `RI64`, `RI128`
- `RF32`, `RF64`
- `RString`, `RTimestamp`

### Composite types

- `RArray(elementType)` - Homogeneous array
- `RMap(keyType, valueType)` - Key-value map
- `ROptional(type)` - Optional value (null when absent)
- `RStruct({ field: field(type, index), ... })` - Struct with indexed fields
- `REnum({ variant: variant(type, index), ... })` - Tagged union

### Codec

- `createCodec(schema)` - Create encoder/decoder for schema

## License

Apache 2.0
