# Documentation Restructure Implementation Plan - Phase 5

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-an-implementation-plan to implement this plan task-by-task.

**Goal:** Create mdBook documentation structure with user journey

**Architecture:** Documentation organized by user journey (Getting Started → Core Concepts → Schema → Streaming → Reference). Examples embedded via `{{#include}}` syntax.

**Tech Stack:** mdBook, Markdown, TypeScript examples

**Scope:** 8 phases from original design (this is phase 5 of 8)

**Codebase verified:** 2026-01-03

---

## Phase 5: Documentation Structure

**Goal:** Create mdBook documentation structure with user journey

**Dependencies:** Phase 2 (core examples exist)

---

### Task 1: Create directory structure

**Files:**
- Create: `docs/src/getting-started/`
- Create: `docs/src/core-concepts/`

**Step 1: Create directories**

Run: `mkdir -p docs/src/getting-started docs/src/core-concepts`

**Step 2: Verify directories exist**

Run: `ls -la docs/src/`
Expected: `getting-started/` and `core-concepts/` directories listed

**Step 3: Commit**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
docs: create documentation directory structure

Prepare directories for mdBook user journey documentation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Update introduction.md

**Files:**
- Modify: `docs/src/introduction.md`

**Step 1: Update the introduction**

```markdown
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
```

**Step 2: Verify file content**

Run: `cat docs/src/introduction.md`
Expected: Content matches above

**Step 3: Commit**

```bash
git add docs/src/introduction.md
git commit -m "$(cat <<'EOF'
docs: update introduction with overview and quick example

Add comprehensive introduction covering what Relish is, the package
structure, and a quick example. Include references to upstream
Relish project: Alex Gaynor's blog post, specification, and
reference implementation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create getting-started/installation.md

**Files:**
- Create: `docs/src/getting-started/installation.md`

**Step 1: Create the file**

```markdown
# Installation

Install Grounds packages using npm or pnpm.

## Core Package Only

For low-level encoding without schema support:

```bash
npm install @grounds/core
# or
pnpm add @grounds/core
```

## With Schema Support (Recommended)

For type-safe schema-driven serialization:

```bash
npm install @grounds/schema @sinclair/typebox luxon
# or
pnpm add @grounds/schema @sinclair/typebox luxon
```

The schema package includes `@grounds/core` as a dependency.

**Peer dependencies:**
- `@sinclair/typebox` - TypeBox for schema definitions
- `luxon` - DateTime handling for timestamps

## With Streaming

For streaming encode/decode:

```bash
npm install @grounds/stream
# or
pnpm add @grounds/stream
```

## TypeScript Configuration

Grounds is written in TypeScript and provides full type definitions. For best results, use strict TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Next Steps

Continue to [First Encode](./first-encode.md) to write your first serialization code.
```

**Step 2: Verify file was created**

Run: `cat docs/src/getting-started/installation.md`
Expected: Content matches above

**Step 3: Commit**

```bash
git add docs/src/getting-started/installation.md
git commit -m "$(cat <<'EOF'
docs: add installation guide

Document package installation options for core-only, schema,
and streaming use cases.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Create getting-started/first-encode.md

**Files:**
- Create: `docs/src/getting-started/first-encode.md`

**Step 1: Create the file**

```markdown
# First Encode

Let's encode your first value using the low-level core API.

## Basic Encoding

The `encode` function takes a tagged value and returns a `Result`:

```typescript
{{#include ../../../examples/core/encode-match.ts}}
```

Run this example:

```bash
tsx examples/core/encode-match.ts
```

## Understanding the Result

Grounds uses [neverthrow](https://github.com/supermacro/neverthrow) for error handling. The `encode` function returns `Result<Uint8Array, EncodeError>`.

Use `.match()` to handle both success and error cases:

- **Success**: Receive the encoded `Uint8Array`
- **Error**: Receive an `EncodeError` with code and message

## What's in the Bytes?

The encoded bytes contain:

1. **Type byte** (1 byte) - identifies the value type (e.g., `0x0e` for String)
2. **Length** (1-5 bytes) - varint encoding of the payload length
3. **Payload** - the actual data (e.g., UTF-8 string bytes)

For complete wire format details, see the [Relish specification](https://github.com/alex/relish/blob/main/SPEC.md).

## Next Steps

Learn about [Encoding](../core-concepts/encoding.md) in depth, or jump to [Schema](../schema/structs.md) for type-safe serialization.
```

**Step 2: Verify file was created**

Run: `cat docs/src/getting-started/first-encode.md`
Expected: Content matches above with `{{#include}}` directive

**Step 3: Commit**

```bash
git add docs/src/getting-started/first-encode.md
git commit -m "$(cat <<'EOF'
docs: add first-encode getting started guide

Introduce basic encoding with embedded example file.
Uses {{#include}} to embed the actual runnable example.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Create core-concepts/encoding.md

**Files:**
- Create: `docs/src/core-concepts/encoding.md`

**Step 1: Create the file**

```markdown
# Encoding

The core package provides low-level encoding for all Relish types.

## Basic Encoding

Encode a value using `.match()` to handle the result:

```typescript
{{#include ../../../examples/core/encode-match.ts}}
```

## Transforming Results

Use `.map()` to transform successful results without unwrapping:

```typescript
{{#include ../../../examples/core/encode-transform.ts}}
```

## Collections

Encode arrays and maps:

```typescript
{{#include ../../../examples/core/encode-collections.ts}}
```

## Tagged Values

Every value is tagged with its type code (see [Relish specification](https://github.com/alex/relish/blob/main/SPEC.md) for complete details):

| Type | Code | JavaScript Type |
|------|------|-----------------|
| Null | 0x00 | `null` |
| Bool | 0x01 | `boolean` |
| u8-u128 | 0x02-0x06 | `number` / `bigint` |
| i8-i128 | 0x07-0x0b | `number` / `bigint` |
| f32/f64 | 0x0c-0x0d | `number` |
| String | 0x0e | `string` |
| Array | 0x0f | `Array<T>` |
| Map | 0x10 | `Map<K, V>` |

## Next Steps

Learn about [Decoding](./decoding.md) to deserialize bytes back to values.
```

**Step 2: Verify file was created**

Run: `cat docs/src/core-concepts/encoding.md`
Expected: Content with multiple `{{#include}}` directives

**Step 3: Commit**

```bash
git add docs/src/core-concepts/encoding.md
git commit -m "$(cat <<'EOF'
docs: add encoding core concepts guide

Comprehensive encoding documentation with embedded examples
for basic encoding, transformations, and collections.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Create core-concepts/decoding.md

**Files:**
- Create: `docs/src/core-concepts/decoding.md`

**Step 1: Create the file**

```markdown
# Decoding

Decode bytes back to typed values.

## Roundtrip with .andThen()

Chain encoding and decoding operations:

```typescript
{{#include ../../../examples/core/encode-roundtrip.ts}}
```

The `.andThen()` method chains fallible operations. If encoding fails, decoding is skipped and the error propagates.

## Decoding Standalone

You can also decode bytes directly:

```typescript
import { decode } from "@grounds/core";

// Decode some bytes
decode(bytes).match(
  (value) => console.log("Decoded:", value),
  (err) => console.error("Failed:", err.message),
);
```

## Type Information

Decoded values include their type code:

```typescript
decode(bytes).match(
  (value) => {
    console.log("Type:", value.type);  // e.g., TypeCode.String
    console.log("Value:", value.value); // e.g., "hello"
  },
  (err) => console.error(err.message),
);
```

## Next Steps

Learn about [Error Handling](./error-handling.md) for robust error management.
```

**Step 2: Verify file was created**

Run: `cat docs/src/core-concepts/decoding.md`
Expected: Content with `{{#include}}` directive

**Step 3: Commit**

```bash
git add docs/src/core-concepts/decoding.md
git commit -m "$(cat <<'EOF'
docs: add decoding core concepts guide

Document decoding with roundtrip example and type information.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Create core-concepts/error-handling.md

**Files:**
- Create: `docs/src/core-concepts/error-handling.md`

**Step 1: Create the file**

```markdown
# Error Handling

Grounds uses [neverthrow](https://github.com/supermacro/neverthrow) for type-safe error handling.

## Handling Errors with .match()

The `.match()` method provides exhaustive handling of success and error cases:

```typescript
{{#include ../../../examples/core/encode-error.ts}}
```

## Error Types

### EncodeError

Thrown when encoding fails:

- `code` - Error code string (e.g., "OVERFLOW", "INVALID_TYPE")
- `message` - Human-readable error description

### DecodeError

Thrown when decoding fails:

- `code` - Error code string (e.g., "UNEXPECTED_EOF", "INVALID_TYPE_CODE")
- `message` - Human-readable error description

## Adding Context with .mapErr()

Use `.mapErr()` to add context to errors without changing the error type:

```typescript
encode(value)
  .mapErr((err) => ({
    ...err,
    context: "Failed while encoding user profile",
  }))
  .match(
    (bytes) => { /* success */ },
    (err) => console.error(err.context, "-", err.message),
  );
```

## Chaining with .andThen()

When chaining operations, errors propagate automatically:

```typescript
encode(value)
  .andThen((bytes) => decode(bytes))  // skipped if encode fails
  .match(
    (decoded) => console.log("Success:", decoded),
    (err) => console.error("Failed:", err.message),
  );
```

## Next Steps

Ready for type-safe schemas? Continue to [Schema Structs](../schema/structs.md).
```

**Step 2: Verify file was created**

Run: `cat docs/src/core-concepts/error-handling.md`
Expected: Content with `{{#include}}` directive

**Step 3: Commit**

```bash
git add docs/src/core-concepts/error-handling.md
git commit -m "$(cat <<'EOF'
docs: add error handling core concepts guide

Document neverthrow error handling patterns with .match(),
.mapErr(), and .andThen() chaining.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Verify mdBook builds

**Files:**
- None (verification only)

**Step 1: Run mdBook build**

Run: `pnpm docs:build`
Expected: Build succeeds (possibly with warnings about missing schema/streaming pages)

**Step 2: Check generated output**

Run: `ls docs/book/`
Expected: Generated HTML files present

**Step 3: Commit any generated .gitignore updates (if needed)**

If the build generated any files that should be committed, commit them. Otherwise, no commit needed.

---

## Phase 5 Verification

After completing all tasks:

- [ ] `docs/src/getting-started/` contains installation.md and first-encode.md
- [ ] `docs/src/core-concepts/` contains encoding.md, decoding.md, error-handling.md
- [ ] `docs/src/introduction.md` is updated with overview content
- [ ] `pnpm docs:build` produces HTML output in `docs/book/`
- [ ] Examples are included via `{{#include}}` directives
