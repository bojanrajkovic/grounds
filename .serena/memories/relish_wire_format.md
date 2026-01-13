# Relish Wire Format

## TLV Structure

Every value is encoded as Type-Length-Value:

1. **Type ID**: 1 byte (0x00-0x13, bit 7 reserved for future use)
2. **Length**: Variable-size integer (varsize)
3. **Value**: Raw bytes

## Varsize Encoding

Length uses tagged varint format:

- **Bit 0 = 0**: 7-bit length in same byte (0-127 bytes)
- **Bit 0 = 1**: Next 4 bytes are little-endian u32 (up to 2³¹-1 bytes)

Example:

- Length 50 → `0x64` (50 << 1 = 100, single byte)
- Length 200 → `0x01 0xC8 0x00 0x00 0x00` (flag + LE u32)

## Type Codes

| Type      | Code | JS Type             | Notes                         |
| --------- | ---- | ------------------- | ----------------------------- |
| Null      | 0x00 | `null`              | Zero-length value             |
| Bool      | 0x01 | `boolean`           | 1 byte: 0x00=false, 0x01=true |
| u8        | 0x02 | `number`            | 1 byte                        |
| u16       | 0x03 | `number`            | 2 bytes LE                    |
| u32       | 0x04 | `number`            | 4 bytes LE                    |
| u64       | 0x05 | `bigint`            | 8 bytes LE                    |
| u128      | 0x06 | `bigint`            | 16 bytes LE                   |
| i8        | 0x07 | `number`            | 1 byte signed                 |
| i16       | 0x08 | `number`            | 2 bytes LE signed             |
| i32       | 0x09 | `number`            | 4 bytes LE signed             |
| i64       | 0x0a | `bigint`            | 8 bytes LE signed             |
| i128      | 0x0b | `bigint`            | 16 bytes LE signed            |
| f32       | 0x0c | `number`            | 4 bytes IEEE 754              |
| f64       | 0x0d | `number`            | 8 bytes IEEE 754              |
| String    | 0x0e | `string`            | UTF-8 encoded                 |
| Array     | 0x0f | `Array<T>`          | Concatenated TLV elements     |
| Map       | 0x10 | `Map<K, V>`         | Key-value pairs as TLV        |
| Struct    | 0x11 | `object`            | Fields sorted by ID           |
| Enum      | 0x12 | tagged union        | Variant ID + payload          |
| Timestamp | 0x13 | `bigint`/`DateTime` | Unix seconds as i64           |

## Key Rules

- **All integers**: Little-endian byte order
- **64-bit+**: Must use JavaScript BigInt
- **Struct fields**: Encoded in sorted order by field ID
- **Maps**: Native JS `Map<K, V>`, not plain objects
- **Timestamps**: Unix epoch seconds (not milliseconds)

## Example Encoding

```
u32 value 42:
  Type:   0x04 (u32)
  Length: 0x08 (4 bytes << 1 = 8, varsize encoding)
  Value:  0x2A 0x00 0x00 0x00 (42 as LE u32)

  Full:   [0x04, 0x08, 0x2A, 0x00, 0x00, 0x00]
```
