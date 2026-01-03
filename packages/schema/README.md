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
  id: field(RU64, 0),
  name: field(RString, 1),
  email: field(ROptional(RString), 2),
  createdAt: field(RTimestamp, 3),
});

// Enum with variants
const MessageSchema = REnum({
  text: variant(RStruct({ content: field(RString, 0) }), 0),
  image: variant(RStruct({ url: field(RString, 0), width: field(RU32, 1) }), 1),
});

// Collections
const TagsSchema = RArray(RString);
const MetadataSchema = RMap(RString, RString);
```

### Creating codecs

```typescript
import { createCodec } from "@grounds/schema";

const userCodec = createCodec(UserSchema);

// Encode
const result = userCodec.encode({
  id: 123n,
  name: "Alice",
  email: "alice@example.com",
  createdAt: DateTime.now(),
});

// Decode
const decoded = userCodec.decode(bytes);
```

### Type inference

Schemas provide full TypeScript type inference:

```typescript
import { Static } from "@sinclair/typebox";

type User = Static<typeof UserSchema>;
// { id: bigint; name: string; email: string | null; createdAt: DateTime }
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
