# Grounds Implementation Plan - Phase 8: Documentation & Polish

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-an-implementation-plan to implement this plan task-by-task.

**Goal:** Prepare for npm publish with documentation, examples, and publish metadata.

**Architecture:** READMEs for each package, usage examples, Apache 2.0 license, and updated package.json files with publish metadata.

**Tech Stack:** TypeScript 5.7, TSDoc, npm

**Scope:** 8 phases from original design (this is phase 8 of 8)

**Codebase verified:** 2026-01-02 - All packages scaffolded, no existing READMEs or examples

---

## Task 1: Create Root README.md

**Files:**
- Create: `README.md`

**Step 1: Write root README**

```markdown
# Grounds

TypeScript implementation of [Relish](https://github.com/alex/relish), a compact binary serialization format.

## Packages

- **[@grounds/core](./packages/core)** - Low-level T[L]V encoding/decoding
- **[@grounds/schema](./packages/schema)** - TypeBox integration for schema-driven serialization
- **[@grounds/stream](./packages/stream)** - Streaming encode/decode utilities

## Installation

\`\`\`bash
# Core package only
npm install @grounds/core

# With schema support (recommended)
npm install @grounds/schema @sinclair/typebox luxon

# With streaming
npm install @grounds/stream
\`\`\`

## Quick Start

### Schema-Driven (Recommended)

\`\`\`typescript
import { RStruct, RString, RU32, ROptional, field, createCodec } from "@grounds/schema";

// Define a schema
const UserSchema = RStruct({
  name: field(RString, 0),
  age: field(RU32, 1),
  email: field(ROptional(RString), 2),
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
\`\`\`

### Low-Level API

\`\`\`typescript
import { encode, decode, TypeCode } from "@grounds/core";

// Encode a value
const result = encode({ type: TypeCode.String, value: "hello" });

// Decode bytes
const decoded = decode(result.value);
\`\`\`

### Streaming

\`\`\`typescript
import { createEncoderStream, createDecoderStream } from "@grounds/stream";

// Pipe values through encoder
const encoded = readableStream.pipeThrough(createEncoderStream());

// Pipe bytes through decoder
const decoded = byteStream.pipeThrough(createDecoderStream());
\`\`\`

## Type Codes

| Type | Code | JavaScript |
|------|------|------------|
| Null | 0x00 | \`null\` |
| Bool | 0x01 | \`boolean\` |
| u8-u128 | 0x02-0x06 | \`number\` / \`bigint\` |
| i8-i128 | 0x07-0x0b | \`number\` / \`bigint\` |
| f32/f64 | 0x0c-0x0d | \`number\` |
| String | 0x0e | \`string\` |
| Array | 0x0f | \`Array<T>\` |
| Map | 0x10 | \`Map<K, V>\` |
| Struct | 0x11 | \`object\` |
| Enum | 0x12 | tagged union |
| Timestamp | 0x13 | \`bigint\` / \`DateTime\` |

## Wire Format

Relish uses T[L]V (Type-Length-Value) encoding:
- **Type**: 1 byte (0x00-0x13)
- **Length**: Tagged varint (bit 0 = 0: 7-bit, bit 0 = 1: 4-byte little-endian)
- **Value**: Type-specific encoding, all integers little-endian

## Development

\`\`\`bash
pnpm install       # Install dependencies
pnpm build         # Build all packages
pnpm test          # Run tests
pnpm lint          # Run linter
\`\`\`

## Documentation

- **Conceptual docs**: See \`docs/\` directory for design documentation and examples
- **Architecture decisions**: See \`adrs/\` directory for architectural decision records
- **API reference**: Auto-generated from TSDoc (coming soon)

## Project Structure

\`\`\`
grounds/
├── packages/
│   ├── core/          # Low-level encoding (@grounds/core)
│   ├── schema/        # TypeBox integration (@grounds/schema)
│   └── stream/        # Streaming utilities (@grounds/stream)
├── docs/              # Conceptual documentation
├── adrs/              # Architecture Decision Records
├── examples/          # Usage examples
└── docs/design-plans/ # Design documents
\`\`\`

## Development Workflow

### Branching Strategy

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

### Phase-Based Development

When working on multi-phase projects:
- Complete one phase fully before starting the next
- Ensure previous phase's PR is merged before beginning subsequent phases
- Document architectural decisions in `adrs/` directory

## Contributing

See [CLAUDE.md](./CLAUDE.md) for coding standards, patterns, and development workflow.

## Future Work

Track planned features and improvements in [GitHub Issues](https://github.com/bojanrajkovic/grounds/issues).

## License

Apache 2.0 - See [LICENSE](./LICENSE)
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add root README with quick start guide"
```

---

## Task 2: Create Package READMEs

**Files:**
- Create: `packages/core/README.md`
- Create: `packages/schema/README.md`
- Create: `packages/stream/README.md`

**Step 1: Write @grounds/core README**

```markdown
# @grounds/core

Low-level Relish binary serialization for TypeScript.

## Installation

\`\`\`bash
npm install @grounds/core
\`\`\`

## Usage

### Encoding

\`\`\`typescript
import { encode, TypeCode } from "@grounds/core";

// Encode primitive values
const nullResult = encode({ type: TypeCode.Null, value: null });
const boolResult = encode({ type: TypeCode.Bool, value: true });
const u32Result = encode({ type: TypeCode.U32, value: 42 });
const stringResult = encode({ type: TypeCode.String, value: "hello" });

// Encode arrays
const arrayResult = encode({
  type: TypeCode.Array,
  value: [
    { type: TypeCode.U8, value: 1 },
    { type: TypeCode.U8, value: 2 },
  ],
});

// Encode maps
const mapResult = encode({
  type: TypeCode.Map,
  value: new Map([
    [{ type: TypeCode.String, value: "key" }, { type: TypeCode.U32, value: 123 }],
  ]),
});
\`\`\`

### Decoding

\`\`\`typescript
import { decode } from "@grounds/core";

const result = decode(bytes);
if (result.isOk()) {
  console.log(result.value); // RelishValue
} else {
  console.error(result.error); // DecodeError
}
\`\`\`

### Error Handling

All operations return \`Result<T, E>\` from neverthrow:

\`\`\`typescript
import { encode } from "@grounds/core";

const result = encode({ type: TypeCode.U8, value: 256 }); // Out of range
if (result.isErr()) {
  console.error(result.error.code); // "INTEGER_OVERFLOW"
  console.error(result.error.message); // "u8 value 256 out of range"
}
\`\`\`

## API Reference

### Types

- \`RelishValue\` - Tagged union of all Relish value types
- \`TypeCode\` - Enum of type codes (0x00-0x13)
- \`EncodeError\` - Error type for encoding failures
- \`DecodeError\` - Error type for decoding failures

### Functions

- \`encode(value: RelishValue): Result<Uint8Array, EncodeError>\`
- \`decode(bytes: Uint8Array): Result<RelishValue, DecodeError>\`

## License

Apache 2.0
```

**Step 2: Write @grounds/schema README**

```markdown
# @grounds/schema

TypeBox-based schema definitions for Relish serialization.

## Installation

\`\`\`bash
npm install @grounds/schema @sinclair/typebox luxon
npm install -D @types/luxon
\`\`\`

## Usage

### Defining Schemas

\`\`\`typescript
import {
  RStruct, REnum, RArray, RMap, ROptional,
  RNull, RBool, RU8, RU16, RU32, RU64, RString, RTimestamp,
  field, variant,
} from "@grounds/schema";

// Struct with fields
const UserSchema = RStruct({
  id: field(RU64, 0),
  name: field(RString, 1),
  email: field(ROptional(RString), 2),
  createdAt: field(RTimestamp, 3),
});

// Enum with variants
const MessageSchema = REnum({
  text: variant(RStruct({ content: field(RString, 0) }), 0),
  image: variant(RStruct({ url: field(RString, 0), width: field(RU32, 1) }), 1),
});

// Collections
const TagsSchema = RArray(RString);
const MetadataSchema = RMap(RString, RString);
\`\`\`

### Creating Codecs

\`\`\`typescript
import { createCodec } from "@grounds/schema";

const userCodec = createCodec(UserSchema);

// Encode
const result = userCodec.encode({
  id: 123n,
  name: "Alice",
  email: "alice@example.com",
  createdAt: DateTime.now(),
});

// Decode
const decoded = userCodec.decode(bytes);
\`\`\`

### Type Inference

Schemas provide full TypeScript type inference:

\`\`\`typescript
import { Static } from "@sinclair/typebox";

type User = Static<typeof UserSchema>;
// { id: bigint; name: string; email: string | null; createdAt: DateTime }
\`\`\`

## API Reference

### Primitive Types

- \`RNull\`, \`RBool\`
- \`RU8\`, \`RU16\`, \`RU32\`, \`RU64\`, \`RU128\`
- \`RI8\`, \`RI16\`, \`RI32\`, \`RI64\`, \`RI128\`
- \`RF32\`, \`RF64\`
- \`RString\`, \`RTimestamp\`

### Composite Types

- \`RArray(elementType)\` - Homogeneous array
- \`RMap(keyType, valueType)\` - Key-value map
- \`ROptional(type)\` - Optional value (null when absent)
- \`RStruct({ field: field(type, index), ... })\` - Struct with indexed fields
- \`REnum({ variant: variant(type, index), ... })\` - Tagged union

### Codec

- \`createCodec(schema)\` - Create encoder/decoder for schema

## License

Apache 2.0
```

**Step 3: Write @grounds/stream README**

```markdown
# @grounds/stream

Streaming encode/decode utilities for Relish serialization.

## Installation

\`\`\`bash
npm install @grounds/stream
\`\`\`

## Usage

### AsyncGenerator API

\`\`\`typescript
import { encodeIterable, decodeIterable } from "@grounds/stream";

// Encode values from async iterable
async function* values() {
  yield { type: TypeCode.String, value: "hello" };
  yield { type: TypeCode.U32, value: 42 };
}

for await (const result of encodeIterable(values())) {
  if (result.isOk()) {
    // Send result.value (Uint8Array) to network/file
  }
}

// Decode from chunked input
async function* chunks() {
  yield await fetchNextChunk();
}

for await (const result of decodeIterable(chunks())) {
  if (result.isOk()) {
    console.log(result.value); // RelishValue
  }
}
\`\`\`

### Web Streams API

\`\`\`typescript
import { createEncoderStream, createDecoderStream } from "@grounds/stream";

// Encode: RelishValue -> Uint8Array
const encoded = valueStream.pipeThrough(createEncoderStream());

// Decode: Uint8Array -> RelishValue
const decoded = byteStream.pipeThrough(createDecoderStream());
\`\`\`

### Schema-Aware Streaming

\`\`\`typescript
import { createSchemaEncoderStream, createSchemaDecoderStream } from "@grounds/stream";
import { RStruct, RString, field } from "@grounds/schema";

const UserSchema = RStruct({
  name: field(RString, 0),
});

// Type-safe encode: User -> Uint8Array
const encoded = userStream.pipeThrough(createSchemaEncoderStream(UserSchema));

// Type-safe decode: Uint8Array -> User
const decoded = byteStream.pipeThrough(createSchemaDecoderStream(UserSchema));
\`\`\`

## Error Handling

Streaming decoders detect incomplete data at end of stream:

\`\`\`typescript
for await (const result of decodeIterable(chunks())) {
  if (result.isErr()) {
    if (result.error.code === "TRUNCATED_STREAM") {
      // Incomplete value at end of input
    }
  }
}
\`\`\`

## API Reference

### AsyncGenerator

- \`encodeIterable(values)\` - Yields \`Result<Uint8Array, EncodeError>\`
- \`encodeIterableBytes(values)\` - Yields \`Uint8Array\`, throws on error
- \`decodeIterable(chunks)\` - Yields \`Result<RelishValue, DecodeError>\`

### Web Streams

- \`createEncoderStream()\` - TransformStream<RelishValue, Uint8Array>
- \`createDecoderStream()\` - TransformStream<Uint8Array, RelishValue>
- \`createSchemaEncoderStream(schema)\` - Type-safe encoder
- \`createSchemaDecoderStream(schema)\` - Type-safe decoder

### Utilities

- \`StreamBuffer\` - Chunk accumulation with boundary handling

## License

Apache 2.0
```

**Step 4: Commit**

```bash
git add packages/core/README.md packages/schema/README.md packages/stream/README.md
git commit -m "docs: add package READMEs"
```

---

## Task 3: Create LICENSE File

**Files:**
- Create: `LICENSE`

**Step 1: Write Apache 2.0 license**

Create `LICENSE` with standard Apache 2.0 license text, with copyright:

```
Copyright 2026 Bojan Rajkovic

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

**Step 2: Commit**

```bash
git add LICENSE
git commit -m "chore: add Apache 2.0 license"
```

---

## Task 4: Create Examples Directory

**Files:**
- Create: `examples/basic-usage.ts`
- Create: `examples/schema-usage.ts`
- Create: `examples/streaming.ts`

**Step 1: Write basic-usage.ts**

```typescript
// examples/basic-usage.ts
// pattern: Imperative Shell
// Basic low-level Relish encoding/decoding

import { encode, decode, TypeCode } from "@grounds/core";

// Encode primitive values
console.log("=== Encoding Primitives ===");

const nullResult = encode({ type: TypeCode.Null, value: null });
console.log("Null:", nullResult.isOk() ? nullResult.value : nullResult.error);

const boolResult = encode({ type: TypeCode.Bool, value: true });
console.log("Bool:", boolResult.isOk() ? boolResult.value : boolResult.error);

const u32Result = encode({ type: TypeCode.U32, value: 12345 });
console.log("U32:", u32Result.isOk() ? u32Result.value : u32Result.error);

const stringResult = encode({ type: TypeCode.String, value: "hello world" });
console.log("String:", stringResult.isOk() ? stringResult.value : stringResult.error);

// Encode an array
console.log("\n=== Encoding Array ===");

const arrayResult = encode({
  type: TypeCode.Array,
  value: [
    { type: TypeCode.U8, value: 1 },
    { type: TypeCode.U8, value: 2 },
    { type: TypeCode.U8, value: 3 },
  ],
});
console.log("Array:", arrayResult.isOk() ? arrayResult.value : arrayResult.error);

// Decode values
console.log("\n=== Decoding ===");

if (stringResult.isOk()) {
  const decoded = decode(stringResult.value);
  if (decoded.isOk()) {
    console.log("Decoded string:", decoded.value);
  }
}

if (arrayResult.isOk()) {
  const decoded = decode(arrayResult.value);
  if (decoded.isOk()) {
    console.log("Decoded array:", decoded.value);
  }
}

// Error handling
console.log("\n=== Error Handling ===");

const overflowResult = encode({ type: TypeCode.U8, value: 300 });
if (overflowResult.isErr()) {
  console.log("Error code:", overflowResult.error.code);
  console.log("Error message:", overflowResult.error.message);
}
```

**Step 2: Write schema-usage.ts**

```typescript
// examples/schema-usage.ts
// pattern: Imperative Shell
// Schema-driven Relish serialization with TypeBox

import {
  RStruct, REnum, RArray, ROptional,
  RString, RU32, RU64, RBool, RTimestamp,
  field, variant, createCodec,
} from "@grounds/schema";
import { DateTime } from "luxon";

// Define a User schema
const UserSchema = RStruct({
  id: field(RU64, 0),
  name: field(RString, 1),
  email: field(ROptional(RString), 2),
  active: field(RBool, 3),
  createdAt: field(RTimestamp, 4),
});

// Define a Message enum
const MessageSchema = REnum({
  text: variant(RStruct({
    content: field(RString, 0),
    sender: field(RString, 1),
  }), 0),
  image: variant(RStruct({
    url: field(RString, 0),
    width: field(RU32, 1),
    height: field(RU32, 2),
  }), 1),
});

// Create codecs
const userCodec = createCodec(UserSchema);
const messageCodec = createCodec(MessageSchema);

// Encode a user
console.log("=== Encoding User ===");

const user = {
  id: 12345n,
  name: "Alice",
  email: "alice@example.com",
  active: true,
  createdAt: DateTime.now(),
};

const encodedUser = userCodec.encode(user);
if (encodedUser.isOk()) {
  console.log("Encoded bytes:", encodedUser.value.length, "bytes");
  console.log("Hex:", Buffer.from(encodedUser.value).toString("hex"));

  // Decode it back
  const decodedUser = userCodec.decode(encodedUser.value);
  if (decodedUser.isOk()) {
    console.log("Decoded user:", decodedUser.value);
  }
}

// Encode messages
console.log("\n=== Encoding Messages ===");

const textMessage = { text: { content: "Hello!", sender: "Alice" } };
const imageMessage = { image: { url: "https://example.com/img.png", width: 800, height: 600 } };

const encodedText = messageCodec.encode(textMessage);
const encodedImage = messageCodec.encode(imageMessage);

if (encodedText.isOk()) {
  console.log("Text message:", encodedText.value.length, "bytes");
  const decoded = messageCodec.decode(encodedText.value);
  console.log("Decoded:", decoded.isOk() ? decoded.value : decoded.error);
}

if (encodedImage.isOk()) {
  console.log("Image message:", encodedImage.value.length, "bytes");
  const decoded = messageCodec.decode(encodedImage.value);
  console.log("Decoded:", decoded.isOk() ? decoded.value : decoded.error);
}

// Arrays of structs
console.log("\n=== Array of Users ===");

const UsersSchema = RArray(UserSchema);
const usersCodec = createCodec(UsersSchema);

const users = [
  { id: 1n, name: "Alice", email: null, active: true, createdAt: DateTime.now() },
  { id: 2n, name: "Bob", email: "bob@example.com", active: false, createdAt: DateTime.now() },
];

const encodedUsers = usersCodec.encode(users);
if (encodedUsers.isOk()) {
  console.log("Encoded users array:", encodedUsers.value.length, "bytes");
}
```

**Step 3: Write streaming.ts**

```typescript
// examples/streaming.ts
// pattern: Imperative Shell
// Streaming encode/decode with Web Streams API

import { createEncoderStream, createDecoderStream, encodeIterable, decodeIterable } from "@grounds/stream";
import { TypeCode, type RelishValue } from "@grounds/core";

// AsyncGenerator example
console.log("=== AsyncGenerator Streaming ===");

async function asyncGeneratorExample(): Promise<void> {
  // Generate values
  async function* generateValues(): AsyncGenerator<RelishValue> {
    for (let i = 0; i < 5; i++) {
      yield { type: TypeCode.U32, value: i * 10 };
      yield { type: TypeCode.String, value: `Item ${i}` };
    }
  }

  // Encode to chunks
  const chunks: Array<Uint8Array> = [];
  for await (const result of encodeIterable(generateValues())) {
    if (result.isOk()) {
      chunks.push(result.value);
    }
  }
  console.log("Encoded", chunks.length, "chunks");

  // Decode from chunks
  async function* yieldChunks(): AsyncGenerator<Uint8Array> {
    for (const chunk of chunks) {
      yield chunk;
    }
  }

  const values: Array<RelishValue> = [];
  for await (const result of decodeIterable(yieldChunks())) {
    if (result.isOk()) {
      values.push(result.value);
    }
  }
  console.log("Decoded", values.length, "values");
}

// Web Streams example
console.log("\n=== Web Streams API ===");

async function webStreamsExample(): Promise<void> {
  const values: Array<RelishValue> = [
    { type: TypeCode.Null, value: null },
    { type: TypeCode.Bool, value: true },
    { type: TypeCode.String, value: "streaming!" },
  ];

  // Create readable stream of values
  const valueStream = new ReadableStream<RelishValue>({
    start(controller) {
      for (const v of values) {
        controller.enqueue(v);
      }
      controller.close();
    },
  });

  // Pipe through encoder
  const encodedStream = valueStream.pipeThrough(createEncoderStream());

  // Collect encoded chunks
  const chunks: Array<Uint8Array> = [];
  const reader = encodedStream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  console.log("Encoded to", chunks.length, "chunks");

  // Create readable stream of chunks
  const chunkStream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) {
        controller.enqueue(c);
      }
      controller.close();
    },
  });

  // Pipe through decoder
  const decodedStream = chunkStream.pipeThrough(createDecoderStream());

  // Collect decoded values
  const decoded: Array<RelishValue> = [];
  const decodedReader = decodedStream.getReader();
  while (true) {
    const { done, value } = await decodedReader.read();
    if (done) break;
    decoded.push(value);
  }
  console.log("Decoded", decoded.length, "values");
  console.log("Values:", decoded);
}

// Run examples
await asyncGeneratorExample();
await webStreamsExample();
```

**Step 4: Commit**

```bash
git add examples/
git commit -m "docs: add usage examples"
```

---

## Task 5: Update package.json Files with Publish Metadata

**Files:**
- Modify: `packages/core/package.json`
- Modify: `packages/schema/package.json`
- Modify: `packages/stream/package.json`

**Step 1: Update packages/core/package.json**

Add the following fields to existing package.json:

```json
{
  "description": "Low-level Relish binary serialization for TypeScript",
  "keywords": ["relish", "serialization", "binary", "encoding", "decoding"],
  "author": "Bojan Rajkovic",
  "license": "Apache-2.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/brajkovic/grounds.git",
    "directory": "packages/core"
  },
  "homepage": "https://github.com/brajkovic/grounds#readme",
  "bugs": {
    "url": "https://github.com/brajkovic/grounds/issues"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Step 2: Update packages/schema/package.json**

Add similar fields with description: "TypeBox-based schema definitions for Relish serialization"

**Step 3: Update packages/stream/package.json**

Add similar fields with description: "Streaming encode/decode utilities for Relish serialization"

**Step 4: Commit**

```bash
git add packages/core/package.json packages/schema/package.json packages/stream/package.json
git commit -m "chore: add publish metadata to package.json files"
```

---

## Task 6: Final Build and Verification

**Step 1: Install all dependencies**

Run: `pnpm install`
Expected: All dependencies installed

**Step 2: Build all packages**

Run: `pnpm build`
Expected: All packages compile successfully

**Step 3: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 4: Run lint**

Run: `pnpm lint`
Expected: No lint errors

**Step 5: Verify npm pack**

Run: `cd packages/core && npm pack --dry-run && cd ../schema && npm pack --dry-run && cd ../stream && npm pack --dry-run`
Expected: Shows files that would be included in each package

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore: complete Phase 8 documentation and polish"
```
