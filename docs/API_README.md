# Grounds API Documentation

TypeScript implementation of [Relish](https://github.com/alex/relish) binary serialization format.

## Packages

This API documentation covers three packages:

- **[@grounds/core](./modules/_grounds_core.html)** - Low-level T[L]V encoding and decoding
  - Binary wire format operations
  - Encode/decode functions and classes
  - Type-safe value constructors
  - Error handling with structured error codes

- **[@grounds/schema](./modules/_grounds_schema.html)** - TypeBox integration for schema-driven serialization
  - Schema constructors for all Relish types
  - Type-safe codecs with full type inference
  - Struct and enum support with field/variant tagging
  - Conversion utilities (toRelish/fromRelish)

- **[@grounds/stream](./modules/_grounds_stream.html)** - Streaming utilities for encoding and decoding
  - Async generator-based streaming
  - Web Streams API support
  - Schema-aware streaming operations

## Quick Links

- **[Getting Started Guide](../index.html)** - Installation and basic usage
- **[User Guide](../guide/index.html)** - In-depth tutorials and examples
- **[GitHub Repository](https://github.com/bojanrajkovic/grounds)** - Source code and issues

## Navigation

Use the sidebar to browse exports by package. Each package's exports are organized into semantic groups:

- **@grounds/core:** Encoding, Decoding, Error Handling, Value Constructors
- **@grounds/schema:** Primitives, Containers, Structs, Enums, Codec API, Conversion Functions
- **@grounds/stream:** Encoding Streams, Decoding Streams

## Usage Patterns

All packages use [neverthrow](https://github.com/supermacro/neverthrow) for error handling, returning `Result<T, E>` types instead of throwing exceptions. Use `.match()`, `.andThen()`, or `.map()` to handle success and error cases.

```typescript
import { encode, U32 } from '@grounds/core';

encode(U32(42)).match(
  (bytes) => console.log('Success:', bytes),
  (error) => console.error('Error:', error.message)
);
```
