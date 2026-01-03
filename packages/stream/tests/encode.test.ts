// pattern: Test
import { describe, it, expect } from "vitest";
import { encodeIterable, encodeIterableBytes } from "../src/encode.js";
import {
  type RelishValue,
  Null,
  Bool,
  U8,
  Struct,
  EncodeError,
} from "@grounds/core";

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

describe("encodeIterableBytes", () => {
  it("should encode values from async iterable", async () => {
    async function* values(): AsyncGenerator<RelishValue> {
      yield Null;
      yield Bool(true);
      yield U8(42);
    }

    const result = await collectChunks(encodeIterableBytes(values()));

    // Null: 0x00
    // Bool true: 0x01 0xff
    // U8 42: 0x02 0x2a
    expect(result).toEqual(new Uint8Array([0x00, 0x01, 0xff, 0x02, 0x2a]));
  });

  it("should throw EncodeError for invalid field ID in struct", async () => {
    // Struct with field ID > 127 is invalid (bit 7 must not be set)
    async function* values(): AsyncGenerator<RelishValue> {
      yield Struct(new Map([[200, Null]]));
    }

    await expect(collectChunks(encodeIterableBytes(values()))).rejects.toThrow(
      EncodeError
    );
  });
});

describe("encodeIterable", () => {
  it("should yield Result types from encodeIterable", async () => {
    async function* values(): AsyncGenerator<RelishValue> {
      yield Null;
      yield Bool(true);
    }

    const results = [];
    for await (const result of encodeIterable(values())) {
      results.push(result);
    }

    expect(results).toHaveLength(2);
    expect(results[0]?.isOk()).toBe(true);
    expect(results[1]?.isOk()).toBe(true);
  });

  it("should yield error Result for invalid field ID in struct", async () => {
    // Struct with field ID > 127 is invalid (bit 7 must not be set)
    async function* values(): AsyncGenerator<RelishValue> {
      yield Struct(new Map([[200, Null]]));
    }

    const results = [];
    for await (const result of encodeIterable(values())) {
      results.push(result);
    }

    expect(results).toHaveLength(1);
    expect(results[0]?.isErr()).toBe(true);
    expect(results[0]?.isErr() && results[0].error).toBeInstanceOf(EncodeError);
  });
});
