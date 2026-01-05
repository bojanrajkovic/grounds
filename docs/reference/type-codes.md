# Type Codes

Complete reference of Relish type codes.

For the authoritative specification, see the [Relish Spec](https://github.com/alex/relish/blob/main/SPEC.md).

## Primitive Types

| Type | Code | JavaScript | Notes |
|------|------|------------|-------|
| Null | 0x00 | `null` | No payload |
| Bool | 0x01 | `boolean` | 0x00 = false, 0xFF = true |
| u8 | 0x02 | `number` | 1 byte unsigned |
| u16 | 0x03 | `number` | 2 bytes little-endian |
| u32 | 0x04 | `number` | 4 bytes little-endian |
| u64 | 0x05 | `bigint` | 8 bytes little-endian |
| u128 | 0x06 | `bigint` | 16 bytes little-endian |
| i8 | 0x07 | `number` | 1 byte signed |
| i16 | 0x08 | `number` | 2 bytes little-endian |
| i32 | 0x09 | `number` | 4 bytes little-endian |
| i64 | 0x0a | `bigint` | 8 bytes little-endian |
| i128 | 0x0b | `bigint` | 16 bytes little-endian |
| f32 | 0x0c | `number` | IEEE 754 single |
| f64 | 0x0d | `number` | IEEE 754 double |
| Timestamp | 0x13 | `bigint` / `DateTime` | Unix seconds (8 bytes) |

## Variable-Length Types

| Type | Code | JavaScript | Notes |
|------|------|------------|-------|
| String | 0x0e | `string` | UTF-8 encoded |
| Array | 0x0f | `Array<T>` | Length-prefixed elements |
| Map | 0x10 | `Map<K, V>` | Length-prefixed key-value pairs |

## Composite Types

| Type | Code | JavaScript | Notes |
|------|------|------------|-------|
| Struct | 0x11 | `object` | Field ID + value pairs |
| Enum | 0x12 | tagged union | Variant ID + value |

## Reserved

Bit 7 (0x80) is reserved for future use.

## Next Steps

See [Wire Format](./wire-format.md) for encoding details.
