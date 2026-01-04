# Documentation Restructure Implementation Plan - Phase 6

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-an-implementation-plan to implement this plan task-by-task.

**Goal:** Complete documentation for schema, streaming packages, and reference sections

**Architecture:** Documentation organized by user journey. Examples embedded via `{{#include}}` syntax. Reference sections link to upstream Relish specification.

**Tech Stack:** mdBook, Markdown, TypeScript examples

**Scope:** 8 phases from original design (this is phase 6 of 8)

**Codebase verified:** 2026-01-03

---

## Phase 6: Schema and Streaming Docs

**Goal:** Complete documentation for schema and streaming packages

**Dependencies:** Phases 3, 4, 5 (schema/stream examples exist, structure established)

---

### Task 1: Create schema directory structure

**Files:**
- Create: `docs/src/schema/`
- Create: `docs/src/streaming/`
- Create: `docs/src/reference/`

**Step 1: Create directories**

Run: `mkdir -p docs/src/schema docs/src/streaming docs/src/reference`

**Step 2: Verify directories exist**

Run: `ls -la docs/src/`
Expected: `schema/`, `streaming/`, and `reference/` directories listed

**Step 3: Commit**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
docs: create schema, streaming, and reference directories

Prepare directory structure for remaining documentation sections.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Create schema/structs.md

**Files:**
- Create: `docs/src/schema/structs.md`

**Step 1: Create the file**

```markdown
# Structs

Define structured data types with `RStruct` and `field()`.

## Defining a Struct

Use `RStruct` to define a schema with named fields:

```typescript
{{#include ../../../examples/schema/defining-structs.ts}}
```

## Field IDs

Each field has a numeric ID used in the wire format. Field IDs:

- Must be unique within a struct
- Are used for encoding (not the field name)
- Allow schema evolution (add new IDs, deprecate old ones)

## Type Inference

Use `Static<typeof Schema>` to extract the TypeScript type:

```typescript
import type { Static } from "@sinclair/typebox";

type User = Static<typeof UserSchema>;
// { id: number; name: string; active: boolean }
```

## Available Field Types

| Schema Type | TypeScript Type | Relish Type |
|-------------|-----------------|-------------|
| `RString()` | `string` | String |
| `RBool()` | `boolean` | Bool |
| `RU8()` - `RU128()` | `number` / `bigint` | u8 - u128 |
| `RI8()` - `RI128()` | `number` / `bigint` | i8 - i128 |
| `RF32()`, `RF64()` | `number` | f32, f64 |
| `RTimestamp()` | `DateTime` | Timestamp |
| `ROptional(T)` | `T \| null` | Optional wrapper |
| `RArray(T)` | `Array<T>` | Array |

## Next Steps

Learn about [Enums](./enums.md) for tagged unions, or [Codecs](./codecs.md) for serialization.
```

**Step 2: Verify file was created**

Run: `cat docs/src/schema/structs.md`
Expected: Content with `{{#include}}` directive

**Step 3: Commit**

```bash
git add docs/src/schema/structs.md
git commit -m "$(cat <<'EOF'
docs: add schema structs documentation

Document RStruct and field() with embedded example and type reference.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create schema/enums.md

**Files:**
- Create: `docs/src/schema/enums.md`

**Step 1: Create the file**

```markdown
# Enums

Define tagged unions with `REnum` and `variant()`.

## Defining an Enum

Use `REnum` to define a schema with named variants:

```typescript
{{#include ../../../examples/schema/defining-enums.ts}}
```

## Variant IDs

Each variant has a numeric ID used in the wire format:

- Must be unique within an enum
- Determines which variant is encoded
- Allows schema evolution (add new variants)

## Variant Types

Variants can contain any schema type:

```typescript
const ResultSchema = REnum({
  success: variant(0, RStruct({
    data: field(0, RString()),
  })),
  error: variant(1, RStruct({
    code: field(0, RU32()),
    message: field(1, RString()),
  })),
});
```

## Discrimination

After decoding, use type guards or discriminator fields to narrow the type:

```typescript
function isTextMessage(msg: unknown): msg is TextMessage {
  return typeof msg === "object" && msg !== null && "content" in msg;
}
```

## Next Steps

Learn about [Codecs](./codecs.md) for encoding and decoding.
```

**Step 2: Verify file was created**

Run: `cat docs/src/schema/enums.md`
Expected: Content with `{{#include}}` directive

**Step 3: Commit**

```bash
git add docs/src/schema/enums.md
git commit -m "$(cat <<'EOF'
docs: add schema enums documentation

Document REnum and variant() with embedded example.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Create schema/codecs.md

**Files:**
- Create: `docs/src/schema/codecs.md`

**Step 1: Create the file**

```markdown
# Codecs

Create type-safe encoders and decoders with `createCodec`.

## Creating a Codec

Use `createCodec` to create an encoder/decoder pair:

```typescript
{{#include ../../../examples/schema/using-codecs.ts}}
```

## Codec API

A codec provides two methods:

### encode(value)

Encodes a value to bytes:

```typescript
const result: Result<Uint8Array, EncodeError> = codec.encode(value);
```

### decode(bytes)

Decodes bytes to a value:

```typescript
const result: Result<T, DecodeError> = codec.decode(bytes);
```

## Chaining Operations

Use `.andThen()` for roundtrip operations:

```typescript
codec.encode(value)
  .andThen((bytes) => codec.decode(bytes))
  .match(
    (decoded) => console.log("Success:", decoded),
    (err) => console.error("Failed:", err.message),
  );
```

## Type Safety

The codec enforces types at compile time:

```typescript
const userCodec = createCodec(UserSchema);

// TypeScript error: missing 'name' property
userCodec.encode({ id: 1 });

// TypeScript error: 'age' is not a number
userCodec.encode({ id: 1, name: "Alice", age: "thirty" });
```

## Next Steps

Learn about [Optional Fields](./optional-fields.md) for nullable values.
```

**Step 2: Verify file was created**

Run: `cat docs/src/schema/codecs.md`
Expected: Content with `{{#include}}` directive

**Step 3: Commit**

```bash
git add docs/src/schema/codecs.md
git commit -m "$(cat <<'EOF'
docs: add schema codecs documentation

Document createCodec with embedded example and API reference.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Create schema/optional-fields.md

**Files:**
- Create: `docs/src/schema/optional-fields.md`

**Step 1: Create the file**

```markdown
# Optional Fields

Handle nullable values with `ROptional`.

## Defining Optional Fields

Use `ROptional` to wrap any schema type:

```typescript
{{#include ../../../examples/schema/optional-fields.ts}}
```

## Null Semantics

Grounds uses `null` for absent values (not `undefined`):

```typescript
type Profile = {
  name: string;      // required
  bio: string | null; // optional
};

// Valid
const profile: Profile = { name: "Alice", bio: null };

// TypeScript error: undefined is not assignable
const profile: Profile = { name: "Alice", bio: undefined };
```

## Wire Format

Optional fields are encoded as:

- **Present**: Normal encoding of the inner value
- **Absent**: Encoded as Null type (1 byte)

## Nested Optionals

You can nest optionals for complex scenarios:

```typescript
const Schema = RStruct({
  // Optional array
  tags: field(0, ROptional(RArray(RString()))),

  // Array of optional strings
  notes: field(1, RArray(ROptional(RString()))),
});
```

## Next Steps

Continue to [Streaming](../streaming/async-generators.md) for incremental encoding.
```

**Step 2: Verify file was created**

Run: `cat docs/src/schema/optional-fields.md`
Expected: Content with `{{#include}}` directive

**Step 3: Commit**

```bash
git add docs/src/schema/optional-fields.md
git commit -m "$(cat <<'EOF'
docs: add optional fields documentation

Document ROptional with embedded example and null semantics.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Create streaming/async-generators.md

**Files:**
- Create: `docs/src/streaming/async-generators.md`

**Step 1: Create the file**

```markdown
# Async Generators

Stream encode and decode with async generators.

## Streaming Encode/Decode

Use `encodeIterable` and `decodeIterable` for streaming:

```typescript
{{#include ../../../examples/stream/async-generators.ts}}
```

## encodeIterable

Encodes values from an async generator:

```typescript
async function* values(): AsyncGenerator<RelishValue> {
  yield { type: TypeCode.String, value: "hello" };
  yield { type: TypeCode.U32, value: 42 };
}

for await (const result of encodeIterable(values())) {
  result.match(
    (bytes) => sendChunk(bytes),
    (err) => console.error(err),
  );
}
```

## decodeIterable

Decodes values from an async generator of byte chunks:

```typescript
async function* chunks(): AsyncGenerator<Uint8Array> {
  yield await receiveChunk();
}

for await (const result of decodeIterable(chunks())) {
  result.match(
    (value) => processValue(value),
    (err) => console.error(err),
  );
}
```

## Error Handling

Each yielded item is a `Result`, allowing per-item error handling:

- Continue processing after recoverable errors
- Accumulate errors for batch reporting
- Stop on first error if needed

## Next Steps

Learn about [Web Streams](./web-streams.md) for the WHATWG Streams API.
```

**Step 2: Verify file was created**

Run: `cat docs/src/streaming/async-generators.md`
Expected: Content with `{{#include}}` directive

**Step 3: Commit**

```bash
git add docs/src/streaming/async-generators.md
git commit -m "$(cat <<'EOF'
docs: add async generators streaming documentation

Document encodeIterable and decodeIterable with embedded example.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Create streaming/web-streams.md

**Files:**
- Create: `docs/src/streaming/web-streams.md`

**Step 1: Create the file**

```markdown
# Web Streams

Use the WHATWG Streams API for encode/decode pipelines.

## Transform Streams

Use `createEncoderStream` and `createDecoderStream`:

```typescript
{{#include ../../../examples/stream/web-streams.ts}}
```

## createEncoderStream

Creates a `TransformStream` that encodes `RelishValue` to `Uint8Array`:

```typescript
const encoderStream = createEncoderStream();

valueStream
  .pipeThrough(encoderStream)
  .pipeTo(networkSink);
```

## createDecoderStream

Creates a `TransformStream` that decodes `Uint8Array` to `RelishValue`:

```typescript
const decoderStream = createDecoderStream();

networkSource
  .pipeThrough(decoderStream)
  .pipeTo(valueHandler);
```

## Pipeline Composition

Chain multiple transforms:

```typescript
sourceStream
  .pipeThrough(createEncoderStream())
  .pipeThrough(compressionStream)
  .pipeTo(networkSink);
```

## Browser Compatibility

Web Streams are supported in:

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Node.js 16+ (with `--experimental-fetch` or Node 18+)
- Deno
- Cloudflare Workers

## Next Steps

See the [Reference](../reference/type-codes.md) section for wire format details.
```

**Step 2: Verify file was created**

Run: `cat docs/src/streaming/web-streams.md`
Expected: Content with `{{#include}}` directive

**Step 3: Commit**

```bash
git add docs/src/streaming/web-streams.md
git commit -m "$(cat <<'EOF'
docs: add web streams documentation

Document createEncoderStream and createDecoderStream with example.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Create reference/type-codes.md

**Files:**
- Create: `docs/src/reference/type-codes.md`

**Step 1: Create the file**

```markdown
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
| Timestamp | 0x13 | `bigint` / `DateTime` | Unix seconds |

## Reserved

Bit 7 (0x80) is reserved for future use.

## Next Steps

See [Wire Format](./wire-format.md) for encoding details.
```

**Step 2: Verify file was created**

Run: `cat docs/src/reference/type-codes.md`
Expected: Complete type code reference

**Step 3: Commit**

```bash
git add docs/src/reference/type-codes.md
git commit -m "$(cat <<'EOF'
docs: add type codes reference

Complete type code reference with links to upstream Relish spec.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Create reference/wire-format.md

**Files:**
- Create: `docs/src/reference/wire-format.md`

**Step 1: Create the file**

```markdown
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
```

**Step 2: Verify file was created**

Run: `cat docs/src/reference/wire-format.md`
Expected: Wire format documentation with diagrams

**Step 3: Commit**

```bash
git add docs/src/reference/wire-format.md
git commit -m "$(cat <<'EOF'
docs: add wire format reference

Document T[L]V structure with examples and links to upstream spec.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Update SUMMARY.md

**Files:**
- Modify: `docs/src/SUMMARY.md`

**Step 1: Verify SUMMARY.md already has correct structure**

The SUMMARY.md was created in Phase 1 with the correct structure. Verify it matches:

Run: `cat docs/src/SUMMARY.md`

Expected content should already include all sections. If any are missing, update to match:

```markdown
# Summary

[Introduction](./introduction.md)

# Getting Started

- [Installation](./getting-started/installation.md)
- [First Encode](./getting-started/first-encode.md)

# Core Concepts

- [Encoding](./core-concepts/encoding.md)
- [Decoding](./core-concepts/decoding.md)
- [Error Handling](./core-concepts/error-handling.md)

# Schema

- [Structs](./schema/structs.md)
- [Enums](./schema/enums.md)
- [Codecs](./schema/codecs.md)
- [Optional Fields](./schema/optional-fields.md)

# Streaming

- [Async Generators](./streaming/async-generators.md)
- [Web Streams](./streaming/web-streams.md)

# Reference

- [Type Codes](./reference/type-codes.md)
- [Wire Format](./reference/wire-format.md)
```

**Step 2: Commit if changes were needed**

```bash
git add docs/src/SUMMARY.md
git commit -m "$(cat <<'EOF'
docs: update SUMMARY.md with all documentation sections

Ensure table of contents includes all schema, streaming,
and reference documentation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Verify complete documentation builds

**Files:**
- None (verification only)

**Step 1: Run mdBook build**

Run: `pnpm docs:build`
Expected: Build succeeds with no errors

**Step 2: Check all pages are generated**

Run: `find docs/book -name "*.html" | head -20`
Expected: HTML files for all documentation pages

**Step 3: Verify navigation works (manual check)**

Run: `pnpm docs:serve`
Expected: Documentation serves at localhost, navigation works

---

## Phase 6 Verification

After completing all tasks:

- [ ] `docs/src/schema/` contains structs.md, enums.md, codecs.md, optional-fields.md
- [ ] `docs/src/streaming/` contains async-generators.md, web-streams.md
- [ ] `docs/src/reference/` contains type-codes.md, wire-format.md
- [ ] `docs/src/SUMMARY.md` includes all sections
- [ ] `pnpm docs:build` produces complete HTML output
- [ ] All examples are included via `{{#include}}` directives
- [ ] Upstream Relish references are included in reference sections
