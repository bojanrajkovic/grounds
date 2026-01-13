// pattern: Imperative Shell
import { describe, it, expect } from "vitest";
import { createSchemaEncoderStream, createSchemaDecoderStream } from "../src/schema-streams.js";
import {
  RStruct,
  RString,
  RU32,
  RArray,
  REnum,
  field,
  variant,
  createCodec,
} from "@grounds/schema";
import { expectOk } from "@grounds/test-utils";

describe("createSchemaEncoderStream", () => {
  it("should encode typed objects to Relish bytes", async () => {
    const UserSchema = RStruct({
      name: field(0, RString()),
      age: field(1, RU32()),
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
      if (done) {
        break;
      }
      chunks.push(value);
    }

    expect(chunks.length).toBe(2);
  });

  it("should handle empty stream", async () => {
    const UserSchema = RStruct({
      name: field(0, RString()),
    });

    const readable = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    const encoded = readable.pipeThrough(createSchemaEncoderStream(UserSchema));
    const reader = encoded.getReader();
    const chunks: Array<Uint8Array> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
    }

    expect(chunks).toHaveLength(0);
  });

  it("should propagate encode errors", async () => {
    const EnumSchema = REnum({
      A: variant(0, RU32()),
      B: variant(1, RString()),
    });

    // Unknown variant name causes encode error
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue({ variant: "C", value: 42 });
        controller.close();
      },
    });

    const encoded = readable.pipeThrough(createSchemaEncoderStream(EnumSchema));
    const reader = encoded.getReader();

    await expect(reader.read()).rejects.toMatchObject({
      message: expect.stringContaining("unknown enum variant"),
    });
  });

  it("should encode multiple values correctly", async () => {
    const NumberSchema = RU32();
    const codec = createCodec(NumberSchema);

    const values = [1, 2, 3, 4, 5];

    const readable = new ReadableStream({
      start(controller) {
        for (const v of values) {
          controller.enqueue(v);
        }
        controller.close();
      },
    });

    const encoded = readable.pipeThrough(createSchemaEncoderStream(NumberSchema));
    const reader = encoded.getReader();
    const chunks: Array<Uint8Array> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
    }

    expect(chunks).toHaveLength(5);

    // Verify each chunk decodes correctly
    for (let i = 0; i < chunks.length; i++) {
      const decoded = expectOk(codec.decode(chunks[i]!));
      expect(decoded).toBe(values[i]);
    }
  });
});

describe("createSchemaDecoderStream", () => {
  it("should decode Relish bytes to typed objects", async () => {
    const UserSchema = RStruct({
      name: field(0, RString()),
      age: field(1, RU32()),
    });

    // First, encode some users
    const codec = createCodec(UserSchema);
    const encoded1 = expectOk(codec.encode({ name: "Alice", age: 30 }));
    const encoded2 = expectOk(codec.encode({ name: "Bob", age: 25 }));

    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoded1);
        controller.enqueue(encoded2);
        controller.close();
      },
    });

    const decoded = readable.pipeThrough(createSchemaDecoderStream(UserSchema));
    const reader = decoded.getReader();
    const users: Array<{ name: string; age: number }> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      users.push(value);
    }

    expect(users).toHaveLength(2);
    expect(users[0]).toEqual({ name: "Alice", age: 30 });
    expect(users[1]).toEqual({ name: "Bob", age: 25 });
  });

  it("should handle empty stream", async () => {
    const UserSchema = RStruct({
      name: field(0, RString()),
    });

    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    });

    const decoded = readable.pipeThrough(createSchemaDecoderStream(UserSchema));
    const reader = decoded.getReader();
    const values: Array<unknown> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      values.push(value);
    }

    expect(values).toHaveLength(0);
  });

  it("should error with TRUNCATED_STREAM for incomplete trailing data", async () => {
    const UserSchema = RStruct({
      name: field(0, RString()),
    });

    const codec = createCodec(UserSchema);
    const encoded = expectOk(codec.encode({ name: "Alice" }));

    // Send complete message + incomplete data (just type byte for string)
    const incompleteData = new Uint8Array([...encoded, 0x0e, 0x05]);

    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(incompleteData);
        controller.close();
      },
    });

    const decoded = readable.pipeThrough(createSchemaDecoderStream(UserSchema));
    const reader = decoded.getReader();

    // First read: successful decode
    const first = await reader.read();
    expect(first.done).toBe(false);
    expect(first.value).toEqual({ name: "Alice" });

    // Second read: should error with TRUNCATED_STREAM
    await expect(reader.read()).rejects.toMatchObject({
      code: "TRUNCATED_STREAM",
    });
  });

  it("should handle chunked data spanning message boundaries", async () => {
    const UserSchema = RStruct({
      name: field(0, RString()),
      age: field(1, RU32()),
    });

    const codec = createCodec(UserSchema);
    const encoded1 = expectOk(codec.encode({ name: "Alice", age: 30 }));
    const encoded2 = expectOk(codec.encode({ name: "Bob", age: 25 }));

    // Combine both messages
    const combined = new Uint8Array(encoded1.length + encoded2.length);
    combined.set(encoded1, 0);
    combined.set(encoded2, encoded1.length);

    // Split at an arbitrary point (middle of the combined data)
    const splitPoint = Math.floor(combined.length / 2);
    const chunk1 = combined.slice(0, splitPoint);
    const chunk2 = combined.slice(splitPoint);

    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(chunk1);
        controller.enqueue(chunk2);
        controller.close();
      },
    });

    const decoded = readable.pipeThrough(createSchemaDecoderStream(UserSchema));
    const reader = decoded.getReader();
    const users: Array<{ name: string; age: number }> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      users.push(value);
    }

    expect(users).toHaveLength(2);
    expect(users[0]).toEqual({ name: "Alice", age: 30 });
    expect(users[1]).toEqual({ name: "Bob", age: 25 });
  });

  it("should handle multiple values in single chunk", async () => {
    const NumberSchema = RU32();
    const codec = createCodec(NumberSchema);

    const values = [42, 100, 255, 1000];
    const encodedValues = values.map((v) => expectOk(codec.encode(v)));

    // Combine all encoded values into one chunk
    const totalLength = encodedValues.reduce((sum, arr) => sum + arr.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const encoded of encodedValues) {
      combined.set(encoded, offset);
      offset += encoded.length;
    }

    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(combined);
        controller.close();
      },
    });

    const decoded = readable.pipeThrough(createSchemaDecoderStream(NumberSchema));
    const reader = decoded.getReader();
    const decodedValues: Array<number> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      decodedValues.push(value);
    }

    expect(decodedValues).toHaveLength(4);
    expect(decodedValues).toEqual(values);
  });

  it("should handle byte-by-byte streaming", async () => {
    const StringSchema = RString();
    const codec = createCodec(StringSchema);

    const encoded = expectOk(codec.encode("Hello"));

    // Stream one byte at a time
    const bytes = encoded;

    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < bytes.length; i++) {
          controller.enqueue(new Uint8Array([bytes[i]!]));
        }
        controller.close();
      },
    });

    const decoded = readable.pipeThrough(createSchemaDecoderStream(StringSchema));
    const reader = decoded.getReader();
    const values: Array<string> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      values.push(value);
    }

    expect(values).toHaveLength(1);
    expect(values[0]).toBe("Hello");
  });

  it("should decode arrays correctly", async () => {
    const ArraySchema = RArray(RU32());
    const codec = createCodec(ArraySchema);

    const encoded = expectOk(codec.encode([1, 2, 3, 4, 5]));

    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoded);
        controller.close();
      },
    });

    const decoded = readable.pipeThrough(createSchemaDecoderStream(ArraySchema));
    const reader = decoded.getReader();
    const values: Array<Array<number>> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      values.push(value);
    }

    expect(values).toHaveLength(1);
    expect(values[0]).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("roundtrip: encoder -> decoder", () => {
  it("should roundtrip typed objects through both streams", async () => {
    const UserSchema = RStruct({
      name: field(0, RString()),
      age: field(1, RU32()),
    });

    const users = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
      { name: "Charlie", age: 35 },
    ];

    const readable = new ReadableStream({
      start(controller) {
        for (const u of users) {
          controller.enqueue(u);
        }
        controller.close();
      },
    });

    const roundtripped = readable
      .pipeThrough(createSchemaEncoderStream(UserSchema))
      .pipeThrough(createSchemaDecoderStream(UserSchema));

    const reader = roundtripped.getReader();
    const result: Array<{ name: string; age: number }> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      result.push(value);
    }

    expect(result).toHaveLength(3);
    expect(result).toEqual(users);
  });
});
