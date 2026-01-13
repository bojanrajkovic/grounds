# Wire Format

Relish encoding structure and format details.

For the authoritative specification, see the [Relish Spec](https://github.com/alex/relish/blob/main/SPEC.md).

## T[L]V Structure

Every Relish value is encoded as Type-[Length]-Value:

```
┌──────────┬──────────────┬─────────────┐
│ Type (1) │ Length (1-5) │ Value (N)   │
└──────────┴──────────────┴─────────────┘
```

### Type Byte

Single byte identifying the value type (0x00-0x13).

Bit 7 is reserved for future use.

### Length (Varsize)

Variable-length encoding of payload size:

- **Bit 0 = 0**: 7-bit length (0-127 bytes) in single byte
- **Bit 0 = 1**: 4-byte little-endian length (up to 2³¹-1 bytes)

Examples:

- `0x0A` → 5 bytes (5 << 1 = 10, bit 0 = 0)
- `0x01 0x00 0x01 0x00 0x00` → 128 bytes (bit 0 = 1, then LE u32)

### Value

Type-specific encoding. All integers are little-endian.

## Encoding Examples

### String "hi"

```
0x0e      # Type: String
0x04      # Length: 2 bytes (2 << 1 = 4)
0x68 0x69 # Value: "hi" in UTF-8
```

### u32 value 42

```
0x04                  # Type: u32
0x08                  # Length: 4 bytes (4 << 1 = 8)
0x2a 0x00 0x00 0x00   # Value: 42 in little-endian
```

### Bool true

```
0x01  # Type: Bool
0x02  # Length: 1 byte (1 << 1 = 2)
0xff  # Value: true
```

## Struct Encoding

Structs encode as a sequence of (field_id, value) pairs:

```
┌──────────────┬──────────────────────────────────┐
│ Struct (0x11)│ Length                           │
├──────────────┼──────────────────────────────────┤
│ Field ID (u8)│ Value (T[L]V)                    │
│ Field ID (u8)│ Value (T[L]V)                    │
│ ...          │ ...                              │
└──────────────┴──────────────────────────────────┘
```

## Enum Encoding

Enums encode as variant ID followed by value:

```
┌──────────────┬──────────────┬──────────────────┐
│ Enum (0x12)  │ Length       │                  │
├──────────────┼──────────────┼──────────────────┤
│ Variant ID   │ Value (T[L]V)│                  │
└──────────────┴──────────────┴──────────────────┘
```

## Learn More

- [Relish announcement](https://alexgaynor.net/2025/dec/09/relish/) - Design rationale
- [Relish specification](https://github.com/alex/relish/blob/main/SPEC.md) - Authoritative spec
- [Relish reference implementation](https://github.com/alex/relish) - Rust implementation
