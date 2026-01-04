# Documentation Restructure Implementation Plan - Phase 4

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-an-implementation-plan to implement this plan task-by-task.

**Goal:** Break existing `examples/streaming.ts` into focused single-concept files

**Architecture:** Each example file demonstrates one concept (~10-30 lines), uses idiomatic neverthrow patterns, and is independently runnable.

**Tech Stack:** TypeScript, @grounds/stream, @grounds/core, tsx

**Scope:** 8 phases from original design (this is phase 4 of 8)

**Codebase verified:** 2026-01-03

---

## Phase 4: Example Restructure - Stream Package

**Goal:** Break existing `examples/streaming.ts` into focused files

**Dependencies:** Phase 3 (pattern established for example structure)

---

### Task 1: Create examples/stream directory

**Files:**
- Create: `examples/stream/` directory

**Step 1: Create the directory**

Run: `mkdir -p examples/stream`

**Step 2: Verify directory exists**

Run: `ls -la examples/`
Expected: `stream/` directory listed alongside `core/` and `schema/`

**Step 3: Commit**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
chore: create examples/stream directory structure

Prepare directory for focused stream package example files.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Create async-generators.ts (encodeIterable, decodeIterable)

**Files:**
- Create: `examples/stream/async-generators.ts`

**Step 1: Create the example file**

```typescript
// examples/stream/async-generators.ts
// pattern: Imperative Shell
// Demonstrates: Streaming encode/decode with async generators

import { encodeIterable, decodeIterable } from "@grounds/stream";
import { TypeCode, type RelishValue } from "@grounds/core";

// Generate values using an async generator
async function* generateValues(): AsyncGenerator<RelishValue> {
  yield { type: TypeCode.String, value: "hello" };
  yield { type: TypeCode.U32, value: 42 };
  yield { type: TypeCode.Bool, value: true };
}

// Encode values to byte chunks
async function example(): Promise<void> {
  const chunks: Array<Uint8Array> = [];

  // encodeIterable yields Result<Uint8Array, EncodeError> for each value
  for await (const result of encodeIterable(generateValues())) {
    result.match(
      (bytes) => chunks.push(bytes),
      (err) => console.error("Encode error:", err.message),
    );
  }

  console.log("Encoded", chunks.length, "chunks");

  // Decode chunks back to values
  async function* yieldChunks(): AsyncGenerator<Uint8Array> {
    for (const chunk of chunks) {
      yield chunk;
    }
  }

  const values: Array<RelishValue> = [];

  // decodeIterable yields Result<RelishValue, DecodeError> for each value
  for await (const result of decodeIterable(yieldChunks())) {
    result.match(
      (value) => values.push(value),
      (err) => console.error("Decode error:", err.message),
    );
  }

  console.log("Decoded", values.length, "values");
  console.log("Values:", values);
}

await example();
```

**Step 2: Run the example to verify it works**

Run: `pnpm exec tsx examples/stream/async-generators.ts`
Expected: Output showing 3 encoded chunks and 3 decoded values

**Step 3: Commit**

```bash
git add examples/stream/async-generators.ts
git commit -m "$(cat <<'EOF'
docs(examples): add async-generators streaming example

Demonstrate streaming encode/decode with async generators.
Single concept: encodeIterable and decodeIterable for streaming.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create web-streams.ts (createEncoderStream, createDecoderStream)

**Files:**
- Create: `examples/stream/web-streams.ts`

**Step 1: Create the example file**

```typescript
// examples/stream/web-streams.ts
// pattern: Imperative Shell
// Demonstrates: Web Streams API for encode/decode pipelines

import { createEncoderStream, createDecoderStream } from "@grounds/stream";
import { TypeCode, type RelishValue } from "@grounds/core";

async function example(): Promise<void> {
  // Create values to stream
  const values: Array<RelishValue> = [
    { type: TypeCode.Null, value: null },
    { type: TypeCode.Bool, value: true },
    { type: TypeCode.String, value: "streaming!" },
  ];

  // Create a readable stream of values
  const valueStream = new ReadableStream<RelishValue>({
    start(controller) {
      for (const v of values) {
        controller.enqueue(v);
      }
      controller.close();
    },
  });

  // Pipe through encoder to get byte chunks
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

  // Create readable stream from chunks
  const chunkStream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) {
        controller.enqueue(c);
      }
      controller.close();
    },
  });

  // Pipe through decoder to get values back
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

await example();
```

**Step 2: Run the example to verify it works**

Run: `pnpm exec tsx examples/stream/web-streams.ts`
Expected: Output showing 3 encoded chunks and 3 decoded values

**Step 3: Commit**

```bash
git add examples/stream/web-streams.ts
git commit -m "$(cat <<'EOF'
docs(examples): add web-streams streaming example

Demonstrate Web Streams API for encode/decode pipelines.
Single concept: createEncoderStream and createDecoderStream.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Delete original streaming.ts

**Files:**
- Delete: `examples/streaming.ts`

**Step 1: Remove the file**

Run: `rm examples/streaming.ts`

**Step 2: Verify file is removed**

Run: `ls examples/`
Expected: `streaming.ts` no longer listed, `core/`, `schema/`, and `stream/` directories present

**Step 3: Commit**

```bash
git add -u examples/streaming.ts
git commit -m "$(cat <<'EOF'
docs(examples): remove streaming.ts (replaced by focused examples)

The monolithic streaming.ts has been replaced by focused
single-concept examples in examples/stream/:
- async-generators.ts
- web-streams.ts

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 Verification

After completing all tasks:

- [ ] `examples/stream/` directory exists with 2 example files
- [ ] Each example runs successfully with `pnpm exec tsx examples/stream/<file>.ts`
- [ ] `examples/streaming.ts` is deleted
- [ ] All examples use idiomatic neverthrow patterns (.match())
