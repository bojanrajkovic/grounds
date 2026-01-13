# Structs

Define structured data types with `RStruct` and `field()`.

## Defining a Struct

Use `RStruct` to define a schema with named fields:

```typescript validator=typescript
{{#include ../../examples/schema/defining-structs.ts}}
```

## Field IDs

Each field has a numeric ID used in the wire format. Field IDs:

- Must be unique within a struct
- Are used for encoding (not the field name)
- Allow schema evolution (add new IDs, deprecate old ones)

## Type Inference

Use `Static<typeof Schema>` to extract the TypeScript type:

```typescript
import type { Static } from "@sinclair/typebox";

type User = Static<typeof UserSchema>;
// { id: number; name: string; active: boolean }
```

## Available Field Types

| Schema Type         | TypeScript Type     | Relish Type      |
| ------------------- | ------------------- | ---------------- |
| `RString()`         | `string`            | String           |
| `RBool()`           | `boolean`           | Bool             |
| `RU8()` - `RU128()` | `number` / `bigint` | u8 - u128        |
| `RI8()` - `RI128()` | `number` / `bigint` | i8 - i128        |
| `RF32()`, `RF64()`  | `number`            | f32, f64         |
| `RTimestamp()`      | `DateTime`          | Timestamp        |
| `ROptional(T)`      | `T \| null`         | Optional wrapper |
| `RArray(T)`         | `Array<T>`          | Array            |

## Next Steps

Learn about [Enums](./enums.md) for tagged unions, or [Codecs](./codecs.md) for serialization.
