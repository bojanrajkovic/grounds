# Grounds

TypeScript implementation of [Relish](https://github.com/alex/relish), a compact binary serialization format.

## Packages

- **[@grounds/core](./packages/core)** - Low-level T[L]V encoding/decoding
- **[@grounds/schema](./packages/schema)** - TypeBox integration for schema-driven serialization
- **[@grounds/stream](./packages/stream)** - Streaming encode/decode utilities

## Installation

```bash
# Core package only
npm install @grounds/core

# With schema support (recommended)
npm install @grounds/schema @sinclair/typebox luxon

# With streaming
npm install @grounds/stream
```

## Quick start

### Schema-driven (recommended)

```typescript
import { RStruct, RString, RU32, ROptional, field, createCodec } from "@grounds/schema";

// Define a schema
const UserSchema = RStruct({
  name: field(0, RString()),
  age: field(1, RU32()),
  email: field(2, ROptional(RString())),
});

// Create a codec
const codec = createCodec(UserSchema);

// Encode
const encoded = codec.encode({ name: "Alice", age: 30 });
if (encoded.isOk()) {
  console.log(encoded.value); // Uint8Array
}

// Decode
const decoded = codec.decode(encoded.value);
if (decoded.isOk()) {
  console.log(decoded.value); // { name: "Alice", age: 30, email: null }
}
```

### Low-level API

```typescript
import { encode, decode, TypeCode } from "@grounds/core";

// Encode a value
const result = encode({ type: TypeCode.String, value: "hello" });
if (result.isOk()) {
  // Decode bytes
  const decoded = decode(result.value);
  if (decoded.isOk()) {
    console.log(decoded.value); // { type: TypeCode.String, value: "hello" }
  }
}
```

### Streaming

```typescript
import { createEncoderStream, createDecoderStream } from "@grounds/stream";

// Pipe values through encoder
const encoded = readableStream.pipeThrough(createEncoderStream());

// Pipe bytes through decoder
const decoded = byteStream.pipeThrough(createDecoderStream());
```

## Type codes

| Type | Code | JavaScript |
|------|------|------------|
| Null | 0x00 | `null` |
| Bool | 0x01 | `boolean` |
| u8-u128 | 0x02-0x06 | `number` / `bigint` |
| i8-i128 | 0x07-0x0b | `number` / `bigint` |
| f32/f64 | 0x0c-0x0d | `number` |
| String | 0x0e | `string` |
| Array | 0x0f | `Array<T>` |
| Map | 0x10 | `Map<K, V>` |
| Struct | 0x11 | `object` |
| Enum | 0x12 | tagged union |
| Timestamp | 0x13 | `bigint` / `DateTime` |

## Wire format

Relish uses T[L]V (Type-Length-Value) encoding:
- **Type**: 1 byte (0x00-0x13)
- **Length**: Tagged varint (bit 0 = 0: 7-bit, bit 0 = 1: 4-byte little-endian)
- **Value**: Type-specific encoding, all integers little-endian

## Development

```bash
pnpm install       # Install dependencies
pnpm build         # Build all packages
pnpm test          # Run tests
pnpm lint          # Run linter
```

## Documentation

- **Conceptual docs**: See `docs/` directory for design documentation and examples
- **Architecture decisions**: See `docs/adrs/` directory for architectural decision records
- **API reference**: Auto-generated from TSDoc (coming soon)

## Project structure

```
grounds/
├── packages/
│   ├── core/          # Low-level encoding (@grounds/core)
│   ├── schema/        # TypeBox integration (@grounds/schema)
│   └── stream/        # Streaming utilities (@grounds/stream)
├── docs/
│   ├── adrs/          # Architecture Decision Records
│   └── design-plans/  # Design documents
└── examples/          # Usage examples
```

## Development workflow

### Branching strategy

All development should follow this workflow:

1. **Feature branches**: Name branches as `<user>/<type>/<feature-name>`
   - Example: `brajkovic/feat/encoder-implementation`
   - Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`

2. **Worktrees** (recommended for AI agents):
   - AI agents must use worktrees in `.worktrees/<branch-name>`
   - Human developers may use worktrees if preferred

3. **Pull requests**:
   - Open PR when implementation is complete
   - Include detailed description and test results
   - Wait for PR merge before starting dependent work

### Phase-based development

When working on multi-phase projects:
- Complete one phase fully before starting the next
- Ensure previous phase's PR is merged before beginning subsequent phases
- Document architectural decisions in `docs/adrs/` directory

## Contributing

See [CLAUDE.md](./CLAUDE.md) for coding standards, patterns, and development workflow.

## Future work

Track planned features and improvements in [GitHub Issues](https://github.com/bojanrajkovic/grounds/issues).

## License

Apache 2.0 - See [LICENSE](./LICENSE)
