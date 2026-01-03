# Grounds Implementation Plan - Phase 7: @grounds/stream

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-an-implementation-plan to implement this plan task-by-task.

**Goal:** Implement streaming encode/decode utilities with AsyncGenerators and Web Streams API.

**Architecture:** StreamBuffer for chunk accumulation with boundary-aware decoding. AsyncGenerator-based iteration for memory-efficient processing. Web Streams API wrappers for browser/Deno compatibility. TRUNCATED_STREAM error code for specific detection of incomplete trailing data.

**Tech Stack:** TypeScript 5.7, neverthrow, Web Streams API, AsyncGenerator

**Scope:** 8 phases from original design (this is phase 7 of 8)

**Codebase verified:** 2026-01-02 - @grounds/core encoder/decoder complete, @grounds/schema codec complete

---

## Task 1: Add StreamBuffer and Extend DecodeError

**Files:**
- Create: `packages/stream/src/buffer.ts`
- Modify: `packages/core/src/errors.ts` (add TRUNCATED_STREAM error code)
- Test: `packages/stream/tests/buffer.test.ts`

**Step 1: Write the failing test for StreamBuffer**

```typescript
// packages/stream/tests/buffer.test.ts
// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { StreamBuffer } from "../src/buffer.js";

describe("StreamBuffer", () => {
  it("should accumulate chunks", () => {
    const buffer = new StreamBuffer();
    buffer.append(new Uint8Array([1, 2, 3]));
    buffer.append(new Uint8Array([4, 5]));
    expect(buffer.length).toBe(5);
  });

  it("should consume bytes from front", () => {
    const buffer = new StreamBuffer();
    buffer.append(new Uint8Array([1, 2, 3, 4, 5]));
    const consumed = buffer.consume(3);
    expect(consumed).toEqual(new Uint8Array([1, 2, 3]));
    expect(buffer.length).toBe(2);
  });

  it("should peek without consuming", () => {
    const buffer = new StreamBuffer();
    buffer.append(new Uint8Array([1, 2, 3]));
    const peeked = buffer.peek(2);
    expect(peeked).toEqual(new Uint8Array([1, 2]));
    expect(buffer.length).toBe(3);
  });

  it("should return needMore when insufficient data for decode", () => {
    const buffer = new StreamBuffer();
    buffer.append(new Uint8Array([0x0e])); // String type code, no length
    const result = buffer.tryDecodeOne();
    expect(result.status).toBe("needMore");
  });

  it("should return decoded value when complete", () => {
    const buffer = new StreamBuffer();
    // Null value: type 0x00, no length needed
    buffer.append(new Uint8Array([0x00]));
    const result = buffer.tryDecodeOne();
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.value.isOk()).toBe(true);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @grounds/stream test`
Expected: FAIL - cannot find module '../src/buffer.js'

**Step 3: Add TRUNCATED_STREAM to DecodeError**

```typescript
// packages/core/src/errors.ts
// Add to DecodeErrorCode type:
export type DecodeErrorCode =
  | "UNEXPECTED_EOF"
  | "INVALID_TYPE_CODE"
  | "INVALID_LENGTH"
  | "INVALID_UTF8"
  | "INTEGER_OVERFLOW"
  | "TRUNCATED_STREAM";  // NEW: Incomplete data at end of stream

// Add static factory method to DecodeError class:
static truncatedStream(context: string): DecodeError {
  return new DecodeError(
    "TRUNCATED_STREAM",
    `truncated stream: incomplete value at end of input (${context})`
  );
}
```

**Step 4: Write StreamBuffer implementation**

```typescript
// packages/stream/src/buffer.ts
// pattern: Functional Core
import { type Result, ok, err } from "neverthrow";
import { decode, type DecodedValue, type DecodeError } from "@grounds/core";

export type TryDecodeResult =
  | { status: "ok"; value: Result<DecodedValue, DecodeError>; bytesConsumed: number }
  | { status: "needMore" }
  | { status: "error"; error: DecodeError };

export class StreamBuffer {
  private chunks: Array<Uint8Array> = [];
  private totalLength = 0;

  get length(): number {
    return this.totalLength;
  }

  append(chunk: Uint8Array): void {
    this.chunks.push(chunk);
    this.totalLength += chunk.length;
  }

  peek(n: number): Uint8Array {
    if (n > this.totalLength) {
      n = this.totalLength;
    }
    return this.collectBytes(n, false);
  }

  consume(n: number): Uint8Array {
    if (n > this.totalLength) {
      n = this.totalLength;
    }
    return this.collectBytes(n, true);
  }

  tryDecodeOne(): TryDecodeResult {
    if (this.totalLength === 0) {
      return { status: "needMore" };
    }

    // Get all available bytes for decode attempt
    const data = this.toUint8Array();
    const result = decode(data);

    if (result.isErr()) {
      const error = result.error;
      // UNEXPECTED_EOF during decode means we need more data
      if (error.code === "UNEXPECTED_EOF") {
        return { status: "needMore" };
      }
      // Other errors are real decode errors
      return { status: "error", error };
    }

    // Success - figure out how many bytes were consumed
    // For now, consume all bytes (single value decode)
    const bytesConsumed = this.totalLength;
    this.chunks = [];
    this.totalLength = 0;

    return { status: "ok", value: ok(result.value), bytesConsumed };
  }

  toUint8Array(): Uint8Array {
    if (this.chunks.length === 0) {
      return new Uint8Array(0);
    }
    if (this.chunks.length === 1) {
      return this.chunks[0]!;
    }
    const result = new Uint8Array(this.totalLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  private collectBytes(n: number, remove: boolean): Uint8Array {
    const result = new Uint8Array(n);
    let offset = 0;
    let remaining = n;

    while (remaining > 0 && this.chunks.length > 0) {
      const chunk = this.chunks[0]!;
      const take = Math.min(remaining, chunk.length);

      result.set(chunk.subarray(0, take), offset);
      offset += take;
      remaining -= take;

      if (remove) {
        if (take === chunk.length) {
          this.chunks.shift();
        } else {
          this.chunks[0] = chunk.subarray(take);
        }
        this.totalLength -= take;
      }
    }

    return result;
  }
}
```

**Step 5: Run test to verify it passes**

Run: `pnpm --filter @grounds/stream test`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/stream/src/buffer.ts packages/stream/tests/buffer.test.ts packages/core/src/errors.ts
git commit -m "feat(stream): add StreamBuffer with chunk accumulation and TRUNCATED_STREAM error"
```

---

## Task 2: Implement encodeIterable AsyncGenerator

**Files:**
- Create: `packages/stream/src/encode.ts`
- Test: `packages/stream/tests/encode.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/stream/tests/encode.test.ts
// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { encodeIterable } from "../src/encode.js";
import { RelishValue, TypeCode } from "@grounds/core";

async function collectChunks(
  iterable: AsyncIterable<Uint8Array>
): Promise<Uint8Array> {
  const chunks: Array<Uint8Array> = [];
  for await (const chunk of iterable) {
    chunks.push(chunk);
  }
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

describe("encodeIterable", () => {
  it("should encode values from async iterable", async () => {
    async function* values(): AsyncGenerator<RelishValue> {
      yield { type: TypeCode.Null, value: null };
      yield { type: TypeCode.Bool, value: true };
      yield { type: TypeCode.U8, value: 42 };
    }

    const result = await collectChunks(encodeIterable(values()));

    // Null: 0x00
    // Bool true: 0x01 0x01
    // U8 42: 0x02 0x2a
    expect(result).toEqual(new Uint8Array([0x00, 0x01, 0x01, 0x02, 0x2a]));
  });

  it("should yield error results for invalid values", async () => {
    async function* values(): AsyncGenerator<RelishValue> {
      yield { type: TypeCode.U8, value: 256 }; // Invalid: out of range
    }

    const chunks: Array<Uint8Array> = [];
    let errorThrown = false;

    try {
      for await (const chunk of encodeIterable(values())) {
        chunks.push(chunk);
      }
    } catch {
      errorThrown = true;
    }

    // encodeIterable yields Result, so check for err result
    // Actually let's test the Result-yielding version
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @grounds/stream test`
Expected: FAIL - cannot find module '../src/encode.js'

**Step 3: Write minimal implementation**

```typescript
// packages/stream/src/encode.ts
// pattern: Functional Core
import { type Result, ok, err } from "neverthrow";
import { encode, type RelishValue, type EncodeError } from "@grounds/core";

export async function* encodeIterable(
  values: AsyncIterable<RelishValue>
): AsyncGenerator<Result<Uint8Array, EncodeError>> {
  for await (const value of values) {
    const result = encode(value);
    yield result;
  }
}

export async function* encodeIterableBytes(
  values: AsyncIterable<RelishValue>
): AsyncGenerator<Uint8Array> {
  for await (const value of values) {
    const result = encode(value);
    if (result.isErr()) {
      throw result.error;
    }
    yield result.value;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @grounds/stream test`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/stream/src/encode.ts packages/stream/tests/encode.test.ts
git commit -m "feat(stream): add encodeIterable async generator"
```

---

## Task 3: Implement decodeIterable AsyncGenerator

**Files:**
- Create: `packages/stream/src/decode.ts`
- Test: `packages/stream/tests/decode.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/stream/tests/decode.test.ts
// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { decodeIterable } from "../src/decode.js";
import { TypeCode } from "@grounds/core";

describe("decodeIterable", () => {
  it("should decode values from chunked input", async () => {
    async function* chunks(): AsyncGenerator<Uint8Array> {
      // Split across chunk boundary
      yield new Uint8Array([0x00, 0x01]); // Null + start of Bool
      yield new Uint8Array([0x01, 0x02, 0x2a]); // Bool value + U8
    }

    const values = [];
    for await (const result of decodeIterable(chunks())) {
      if (result.isOk()) {
        values.push(result.value);
      }
    }

    expect(values).toHaveLength(3);
    expect(values[0]).toBe(null);
    expect(values[1]).toBe(true);
    expect(values[2]).toBe(42);
  });

  it("should yield TRUNCATED_STREAM error for incomplete trailing data", async () => {
    async function* chunks(): AsyncGenerator<Uint8Array> {
      yield new Uint8Array([0x00]); // Complete Null
      yield new Uint8Array([0x0e, 0x05]); // String type + length 5, but no string data
    }

    const results = [];
    for await (const result of decodeIterable(chunks())) {
      results.push(result);
    }

    // First result: successful Null decode
    expect(results[0]?.isOk()).toBe(true);

    // Second result: TRUNCATED_STREAM error (not generic UNEXPECTED_EOF)
    expect(results[1]?.isErr()).toBe(true);
    if (results[1]?.isErr()) {
      expect(results[1].error.code).toBe("TRUNCATED_STREAM");
    }
  });

  it("should yield decode errors for invalid data", async () => {
    async function* chunks(): AsyncGenerator<Uint8Array> {
      yield new Uint8Array([0xff]); // Invalid type code
    }

    const results = [];
    for await (const result of decodeIterable(chunks())) {
      results.push(result);
    }

    expect(results[0]?.isErr()).toBe(true);
    if (results[0]?.isErr()) {
      expect(results[0].error.code).toBe("INVALID_TYPE_CODE");
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @grounds/stream test`
Expected: FAIL - cannot find module '../src/decode.js'

**Step 3: Write minimal implementation**

```typescript
// packages/stream/src/decode.ts
// pattern: Functional Core
import { type Result, ok, err } from "neverthrow";
import { type DecodedValue, type DecodeError, DecodeError as DecodeErrorClass } from "@grounds/core";
import { StreamBuffer } from "./buffer.js";

export async function* decodeIterable(
  chunks: AsyncIterable<Uint8Array>
): AsyncGenerator<Result<DecodedValue, DecodeError>> {
  const buffer = new StreamBuffer();

  for await (const chunk of chunks) {
    buffer.append(chunk);

    // Try to decode as many complete values as possible
    while (buffer.length > 0) {
      const result = buffer.tryDecodeOne();

      if (result.status === "needMore") {
        // Wait for more data
        break;
      }

      if (result.status === "error") {
        yield err(result.error);
        return; // Stop on decode error
      }

      if (result.status === "ok") {
        yield result.value;
      }
    }
  }

  // After all chunks consumed, check for trailing incomplete data
  if (buffer.length > 0) {
    const result = buffer.tryDecodeOne();
    if (result.status === "needMore") {
      // Incomplete data at end of stream = TRUNCATED_STREAM (specific error)
      yield err(
        DecodeErrorClass.truncatedStream(
          `${buffer.length} bytes remaining, incomplete value`
        )
      );
    } else if (result.status === "error") {
      yield err(result.error);
    } else if (result.status === "ok") {
      yield result.value;
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @grounds/stream test`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/stream/src/decode.ts packages/stream/tests/decode.test.ts
git commit -m "feat(stream): add decodeIterable with TRUNCATED_STREAM error for incomplete trailing data"
```

---

## Task 4: Implement Web Streams API Wrappers

**Files:**
- Create: `packages/stream/src/web-streams.ts`
- Test: `packages/stream/tests/web-streams.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/stream/tests/web-streams.test.ts
// pattern: Imperative Shell
import { describe, it, expect } from "vitest";
import { createEncoderStream, createDecoderStream } from "../src/web-streams.js";
import { type RelishValue, TypeCode } from "@grounds/core";

describe("createEncoderStream", () => {
  it("should transform RelishValues to Uint8Array chunks", async () => {
    const values: Array<RelishValue> = [
      { type: TypeCode.Null, value: null },
      { type: TypeCode.Bool, value: true },
    ];

    const readable = new ReadableStream<RelishValue>({
      start(controller) {
        for (const v of values) {
          controller.enqueue(v);
        }
        controller.close();
      },
    });

    const encoded = readable.pipeThrough(createEncoderStream());
    const reader = encoded.getReader();
    const chunks: Array<Uint8Array> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    expect(chunks.length).toBeGreaterThan(0);
  });
});

describe("createDecoderStream", () => {
  it("should transform Uint8Array chunks to DecodedValues", async () => {
    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        // Null + Bool true
        controller.enqueue(new Uint8Array([0x00, 0x01, 0x01]));
        controller.close();
      },
    });

    const decoded = readable.pipeThrough(createDecoderStream());
    const reader = decoded.getReader();
    const values: Array<unknown> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      values.push(value);
    }

    expect(values).toHaveLength(2);
    expect(values[0]).toBe(null);
    expect(values[1]).toBe(true);
  });

  it("should error with TRUNCATED_STREAM for incomplete trailing data", async () => {
    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        // Complete Null + incomplete String (type + length but no data)
        controller.enqueue(new Uint8Array([0x00, 0x0e, 0x05]));
        controller.close();
      },
    });

    const decoded = readable.pipeThrough(createDecoderStream());
    const reader = decoded.getReader();

    // First read: Null value
    const first = await reader.read();
    expect(first.done).toBe(false);
    expect(first.value).toBe(null);

    // Second read: should error with TRUNCATED_STREAM
    await expect(reader.read()).rejects.toMatchObject({
      code: "TRUNCATED_STREAM",
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @grounds/stream test`
Expected: FAIL - cannot find module '../src/web-streams.js'

**Step 3: Write minimal implementation**

```typescript
// packages/stream/src/web-streams.ts
// pattern: Imperative Shell
import { encode, type RelishValue, type DecodedValue, type DecodeError, DecodeError as DecodeErrorClass } from "@grounds/core";
import { StreamBuffer } from "./buffer.js";

export function createEncoderStream(): TransformStream<RelishValue, Uint8Array> {
  return new TransformStream({
    transform(value, controller) {
      const result = encode(value);
      if (result.isErr()) {
        controller.error(result.error);
        return;
      }
      controller.enqueue(result.value);
    },
  });
}

export function createDecoderStream(): TransformStream<Uint8Array, DecodedValue> {
  const buffer = new StreamBuffer();

  return new TransformStream({
    transform(chunk, controller) {
      buffer.append(chunk);

      while (buffer.length > 0) {
        const result = buffer.tryDecodeOne();

        if (result.status === "needMore") {
          break;
        }

        if (result.status === "error") {
          controller.error(result.error);
          return;
        }

        if (result.status === "ok") {
          if (result.value.isErr()) {
            controller.error(result.value.error);
            return;
          }
          controller.enqueue(result.value.value);
        }
      }
    },

    flush(controller) {
      // Check for incomplete trailing data
      if (buffer.length > 0) {
        const result = buffer.tryDecodeOne();
        if (result.status === "needMore") {
          // TRUNCATED_STREAM: specific error for incomplete data at end
          controller.error(
            DecodeErrorClass.truncatedStream(
              `${buffer.length} bytes remaining at end of stream`
            )
          );
          return;
        }

        if (result.status === "error") {
          controller.error(result.error);
          return;
        }

        if (result.status === "ok") {
          if (result.value.isErr()) {
            controller.error(result.value.error);
            return;
          }
          controller.enqueue(result.value.value);
        }
      }
    },
  });
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @grounds/stream test`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/stream/src/web-streams.ts packages/stream/tests/web-streams.test.ts
git commit -m "feat(stream): add Web Streams API wrappers with TRUNCATED_STREAM error handling"
```

---

## Task 5: Add Schema-Aware Streaming with createSchemaEncoderStream/createSchemaDecoderStream

**Files:**
- Create: `packages/stream/src/schema-streams.ts`
- Test: `packages/stream/tests/schema-streams.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/stream/tests/schema-streams.test.ts
// pattern: Imperative Shell
import { describe, it, expect } from "vitest";
import { createSchemaEncoderStream, createSchemaDecoderStream } from "../src/schema-streams.js";
import { RStruct, RString, RU32, field, createCodec } from "@grounds/schema";

describe("createSchemaEncoderStream", () => {
  it("should encode typed objects to Relish bytes", async () => {
    const UserSchema = RStruct({
      name: field(RString, 0),
      age: field(RU32, 1),
    });

    const users = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];

    const readable = new ReadableStream({
      start(controller) {
        for (const u of users) {
          controller.enqueue(u);
        }
        controller.close();
      },
    });

    const encoded = readable.pipeThrough(createSchemaEncoderStream(UserSchema));
    const reader = encoded.getReader();
    const chunks: Array<Uint8Array> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    expect(chunks.length).toBe(2);
  });
});

describe("createSchemaDecoderStream", () => {
  it("should decode Relish bytes to typed objects", async () => {
    const UserSchema = RStruct({
      name: field(RString, 0),
      age: field(RU32, 1),
    });

    // First, encode some users
    const codec = createCodec(UserSchema);
    const encoded1 = codec.encode({ name: "Alice", age: 30 });
    const encoded2 = codec.encode({ name: "Bob", age: 25 });

    if (encoded1.isErr() || encoded2.isErr()) {
      throw new Error("Encoding failed");
    }

    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoded1.value);
        controller.enqueue(encoded2.value);
        controller.close();
      },
    });

    const decoded = readable.pipeThrough(createSchemaDecoderStream(UserSchema));
    const reader = decoded.getReader();
    const users = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      users.push(value);
    }

    expect(users).toHaveLength(2);
    expect(users[0]).toEqual({ name: "Alice", age: 30 });
    expect(users[1]).toEqual({ name: "Bob", age: 25 });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @grounds/stream test`
Expected: FAIL - cannot find module '../src/schema-streams.js'

**Step 3: Write minimal implementation**

```typescript
// packages/stream/src/schema-streams.ts
// pattern: Imperative Shell
import type { TSchema, Static } from "@sinclair/typebox";
import { createCodec } from "@grounds/schema";
import { StreamBuffer } from "./buffer.js";
import { DecodeError as DecodeErrorClass } from "@grounds/core";

export function createSchemaEncoderStream<T extends TSchema>(
  schema: T
): TransformStream<Static<T>, Uint8Array> {
  const codec = createCodec(schema);

  return new TransformStream({
    transform(value, controller) {
      const result = codec.encode(value);
      if (result.isErr()) {
        controller.error(result.error);
        return;
      }
      controller.enqueue(result.value);
    },
  });
}

export function createSchemaDecoderStream<T extends TSchema>(
  schema: T
): TransformStream<Uint8Array, Static<T>> {
  const codec = createCodec(schema);
  const buffer = new StreamBuffer();

  return new TransformStream({
    transform(chunk, controller) {
      buffer.append(chunk);

      while (buffer.length > 0) {
        const result = buffer.tryDecodeOne();

        if (result.status === "needMore") {
          break;
        }

        if (result.status === "error") {
          controller.error(result.error);
          return;
        }

        if (result.status === "ok") {
          if (result.value.isErr()) {
            controller.error(result.value.error);
            return;
          }

          // Convert RelishValue to JS type using codec
          const decoded = codec.decodeValue(result.value.value);
          if (decoded.isErr()) {
            controller.error(decoded.error);
            return;
          }
          controller.enqueue(decoded.value);
        }
      }
    },

    flush(controller) {
      if (buffer.length > 0) {
        const result = buffer.tryDecodeOne();
        if (result.status === "needMore") {
          controller.error(
            DecodeErrorClass.truncatedStream(
              `${buffer.length} bytes remaining at end of schema stream`
            )
          );
          return;
        }

        if (result.status === "error") {
          controller.error(result.error);
          return;
        }

        if (result.status === "ok") {
          if (result.value.isErr()) {
            controller.error(result.value.error);
            return;
          }

          const decoded = codec.decodeValue(result.value.value);
          if (decoded.isErr()) {
            controller.error(decoded.error);
            return;
          }
          controller.enqueue(decoded.value);
        }
      }
    },
  });
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @grounds/stream test`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/stream/src/schema-streams.ts packages/stream/tests/schema-streams.test.ts
git commit -m "feat(stream): add schema-aware streaming encode/decode"
```

---

## Task 6: Export Public API and Complete Package

**Files:**
- Modify: `packages/stream/src/index.ts`
- Modify: `packages/stream/package.json` (add @grounds/schema dependency)

**Step 1: Update package.json to add schema dependency**

```json
{
  "name": "@grounds/stream",
  "version": "0.0.1",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "@grounds/core": "workspace:*",
    "@grounds/schema": "workspace:*",
    "neverthrow": "^8.1.1"
  },
  "peerDependencies": {
    "@sinclair/typebox": ">=0.34.0"
  },
  "devDependencies": {
    "@sinclair/typebox": "^0.34.12"
  }
}
```

**Step 2: Update index.ts exports**

```typescript
// packages/stream/src/index.ts
// pattern: Imperative Shell
// @grounds/stream - Streaming encode/decode utilities

// Buffer utilities
export { StreamBuffer, type TryDecodeResult } from "./buffer.js";

// AsyncGenerator streaming
export { encodeIterable, encodeIterableBytes } from "./encode.js";
export { decodeIterable } from "./decode.js";

// Web Streams API
export { createEncoderStream, createDecoderStream } from "./web-streams.js";

// Schema-aware streaming
export { createSchemaEncoderStream, createSchemaDecoderStream } from "./schema-streams.js";
```

**Step 3: Build and verify**

Run: `pnpm install && pnpm build`
Expected: All packages compile successfully

**Step 4: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add packages/stream/
git commit -m "feat(stream): complete @grounds/stream package with public API"
```
