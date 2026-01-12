---
"@grounds/core": major
"@grounds/schema": major
"@grounds/stream": major
---

Initial stable release (1.0.0)

This marks the first stable release of the Grounds library, a TypeScript implementation of the Relish binary serialization format.

**@grounds/core**
- Type-safe value constructors with branded types
- Binary encoding and decoding for all Relish types
- Defense-in-depth validation for integer values

**@grounds/schema**
- TypeBox-based schema definitions
- Type-safe codec for schema-driven serialization
- Struct and enum support with field/variant IDs

**@grounds/stream**
- Async generator streaming for encode/decode
- Web Streams API integration
- Schema-aware streaming with type conversion
