# Grounds

TypeScript implementation of [Relish](https://github.com/alex/relish), a compact binary serialization format.

## What is Relish?

Relish is a Type-Length-Value (TLV) encoding format designed by [Alex Gaynor](https://alexgaynor.net/2025/dec/09/relish/). It provides:

- **Compact binary representation** - smaller than JSON, competitive with Protocol Buffers
- **Self-describing format** - can decode without schema (for debugging)
- **Schema-driven usage** - type-safe encoding with TypeScript schemas
- **Streaming support** - encode and decode incrementally

For the complete format specification, see the [Relish Spec](https://github.com/alex/relish/blob/main/SPEC.md).

## Packages

Grounds provides three packages:

- **[@grounds/core](./core-concepts/encoding.md)** - Low-level T[L]V encoding and decoding
- **[@grounds/schema](./schema/structs.md)** - TypeBox-based schema definitions with codecs
- **[@grounds/stream](./streaming/async-generators.md)** - Streaming encode/decode utilities

## Quick Example

```typescript
import { RStruct, RString, RU32, field, createCodec } from "@grounds/schema";

// Define a schema
const UserSchema = RStruct({
  name: field(0, RString()),
  age: field(1, RU32()),
});

// Create a codec
const codec = createCodec(UserSchema);

// Encode
codec.encode({ name: "Alice", age: 30 })
  .match(
    (bytes) => console.log("Encoded:", bytes.length, "bytes"),
    (err) => console.error("Failed:", err.message),
  );
```

## Getting Started

New to Grounds? Start with [Installation](./getting-started/installation.md) to set up your project.

## Learn More

- [Relish announcement blog post](https://alexgaynor.net/2025/dec/09/relish/) - Background and design rationale
- [Relish specification](https://github.com/alex/relish/blob/main/SPEC.md) - Wire format details
- [Relish reference implementation](https://github.com/alex/relish) - Rust implementation
