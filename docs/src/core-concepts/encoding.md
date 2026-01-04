# Encoding

The core package provides low-level encoding for all Relish types.

## Basic Encoding

Encode a value using `.match()` to handle the result:

```typescript
{{#include ../../../examples/core/encode-match.ts}}
```

## Transforming Results

Use `.map()` to transform successful results without unwrapping:

```typescript
{{#include ../../../examples/core/encode-transform.ts}}
```

## Collections

Encode arrays and maps:

```typescript
{{#include ../../../examples/core/encode-collections.ts}}
```

## Tagged Values

Every value is tagged with its type code (see [Relish specification](https://github.com/alex/relish/blob/main/SPEC.md) for complete details):

| Type | Code | JavaScript Type |
|------|------|-----------------|
| Null | 0x00 | `null` |
| Bool | 0x01 | `boolean` |
| u8-u128 | 0x02-0x06 | `number` / `bigint` |
| i8-i128 | 0x07-0x0b | `number` / `bigint` |
| f32/f64 | 0x0c-0x0d | `number` |
| String | 0x0e | `string` |
| Array | 0x0f | `Array<T>` |
| Map | 0x10 | `Map<K, V>` |

## Next Steps

Learn about [Decoding](./decoding.md) to deserialize bytes back to values.
