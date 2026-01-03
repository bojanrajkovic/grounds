// pattern: Imperative Shell
import { describe, it, expect } from "vitest";
import { createSchemaEncoderStream, createSchemaDecoderStream } from "../src/schema-streams.js";
import { RStruct, RString, RU32, field, createCodec } from "@grounds/schema";

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
      if (done) break;
      chunks.push(value);
    }

    expect(chunks.length).toBe(2);
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
