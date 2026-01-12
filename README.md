# Grounds

TypeScript implementation of [Relish](https://github.com/alex/relish), a compact binary serialization format.

## Packages

- **[@grounds/core](./packages/core)** - Low-level T[L]V encoding/decoding
- **[@grounds/schema](./packages/schema)** - TypeBox integration for schema-driven serialization
- **[@grounds/stream](./packages/stream)** - Streaming encode/decode utilities

## Installation

Install from npm:

```bash
# Latest stable release (recommended)
npm install @grounds/core @grounds/schema @grounds/stream

# Or with pnpm
pnpm add @grounds/core @grounds/schema @grounds/stream
```

**Alpha packages** (pre-release from pull requests):

```bash
# Latest alpha version (updates with each PR)
pnpm add @grounds/core@alpha @grounds/schema@alpha @grounds/stream@alpha

# Specific alpha version (from a particular PR)
pnpm add @grounds/core@0.1.0-my-feature-abc1234
```

Alpha packages publish automatically when CI passes on `feat/*` or `fix/*` branches. Use them to test unreleased features before they merge to main.

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
const encoded = codec.encode({ name: "Alice", age: 30, email: null });
encoded.match(
  (bytes) => console.log("Encoded:", bytes), // Uint8Array
  (err) => console.error("Encode failed:", err)
);

// Decode
const decoded = codec.decode(encoded.unwrapOr(new Uint8Array()));
decoded.match(
  (user) => console.log("Decoded:", user), // { name: "Alice", age: 30, email: null }
  (err) => console.error("Decode failed:", err)
);
```

### Low-level API

```typescript
import { encode, decode, String_ } from "@grounds/core";

// Encode a value
const encoded = encode(String_("hello"));

// Decode bytes
const decoded = encoded.andThen((bytes) => decode(bytes));

decoded.match(
  (value) => console.log(value), // "hello"
  (err) => console.error("Failed:", err)
);
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

## Examples

Runnable examples are in the `examples/` directory, organized by package:

```bash
# Run a core package example
pnpm exec tsx examples/core/encode-match.ts

# Run a schema package example
pnpm exec tsx examples/schema/using-codecs.ts

# Available core examples:
# - encode-match.ts      - Basic encoding with .match() for result handling
# - encode-roundtrip.ts  - Chaining encode/decode with .andThen()
# - encode-transform.ts  - Transforming results with .map()
# - encode-error.ts      - Error handling with .match() and .mapErr()
# - encode-collections.ts - Encoding arrays and maps

# Available schema examples:
# - defining-structs.ts     - Defining struct schemas with RStruct and field()
# - defining-enums.ts       - Defining enum schemas with REnum and variant()
# - discriminated-enums.ts  - Using enums with discriminant fields (sensor data)
# - optional-fields.ts      - Optional fields with ROptional and null handling
# - using-codecs.ts         - Creating and using codecs for encode/decode
```

## Documentation

- **[Getting Started Guide](./docs/getting-started/installation.md)** - Installation and first encode
- **[API Reference](./docs/api/README.md)** - Complete API documentation for all packages
- **[Examples](./examples)** - Runnable code examples
- **Conceptual docs**: See `docs/` directory for design documentation
- **Architecture decisions**: See `docs/adrs/` directory for architectural decision records

Full documentation is available at [bojanrajkovic.github.io/grounds](https://bojanrajkovic.github.io/grounds/).

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

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Pre-1.0 releases (0.x.x) are considered unstable and may include breaking changes in minor versions.

## Future work

Track planned features and improvements in [GitHub Issues](https://github.com/bojanrajkovic/grounds/issues).

## License

Apache 2.0 - See [LICENSE](./LICENSE)
