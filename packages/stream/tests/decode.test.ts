// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { decodeIterable } from "../src/decode.js";
import { expectOk, expectErr } from "@grounds/test-utils";

describe("decodeIterable", () => {
  it("should decode values from chunked input", async () => {
    async function* chunks(): AsyncGenerator<Uint8Array> {
      // Split across chunk boundary
      yield new Uint8Array([0x00, 0x01]); // Null + start of Bool
      yield new Uint8Array([0x01, 0x02, 0x2a]); // Bool value + U8
    }

    const values = [];
    for await (const result of decodeIterable(chunks())) {
      values.push(expectOk(result));
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
    const error = expectErr(results[1]!);
    expect(error.code).toBe("TRUNCATED_STREAM");
  });

  it("should yield decode errors for invalid data", async () => {
    async function* chunks(): AsyncGenerator<Uint8Array> {
      yield new Uint8Array([0xff]); // Invalid type code
    }

    const results = [];
    for await (const result of decodeIterable(chunks())) {
      results.push(result);
    }

    const error = expectErr(results[0]!);
    expect(error.code).toBe("INVALID_TYPE_CODE");
  });

  it("should decode multiple complete values from chunks", async () => {
    async function* chunks(): AsyncGenerator<Uint8Array> {
      // Three null values split across chunks
      yield new Uint8Array([0x00, 0x00]);
      yield new Uint8Array([0x00]);
    }

    const results = [];
    for await (const result of decodeIterable(chunks())) {
      results.push(result);
    }

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.isOk())).toBe(true);
    expect(results.map((r) => expectOk(r))).toEqual([null, null, null]);
  });

  it("should handle empty chunks gracefully", async () => {
    async function* chunks(): AsyncGenerator<Uint8Array> {
      yield new Uint8Array([0x00]); // Null
      yield new Uint8Array([]); // Empty chunk
      yield new Uint8Array([0x01, 0x01]); // Bool true
    }

    const values = [];
    for await (const result of decodeIterable(chunks())) {
      values.push(expectOk(result));
    }

    expect(values).toHaveLength(2);
    expect(values[0]).toBe(null);
    expect(values[1]).toBe(true);
  });

  it("should stop iteration on decode error", async () => {
    async function* chunks(): AsyncGenerator<Uint8Array> {
      yield new Uint8Array([0x00]); // Null - ok
      yield new Uint8Array([0xff]); // Invalid type code - error
      yield new Uint8Array([0x00]); // This should not be processed
    }

    const results = [];
    for await (const result of decodeIterable(chunks())) {
      results.push(result);
    }

    // Should have 2 results: Null + error
    expect(results).toHaveLength(2);
    expect(results[0]?.isOk()).toBe(true);
    expect(results[1]?.isErr()).toBe(true);
  });

  it("should handle bool false value", async () => {
    async function* chunks(): AsyncGenerator<Uint8Array> {
      yield new Uint8Array([0x01, 0x00]); // Bool false
    }

    const results = [];
    for await (const result of decodeIterable(chunks())) {
      results.push(result);
    }

    const value = expectOk(results[0]!);
    expect(value).toBe(false);
  });

  it("should decode u16, u32 values from chunks", async () => {
    async function* chunks(): AsyncGenerator<Uint8Array> {
      // u16 with value 256 (0x0100 in little-endian = [0x00, 0x01])
      yield new Uint8Array([0x03, 0x00]);
      yield new Uint8Array([0x01, 0x04]); // Rest of u16 + u32 type
      yield new Uint8Array([0x00, 0x01, 0x00, 0x00]); // u32 value 256 (0x0100 little-endian = [0x00, 0x01, 0x00, 0x00])
    }

    const values = [];
    for await (const result of decodeIterable(chunks())) {
      values.push(expectOk(result));
    }

    expect(values).toHaveLength(2);
    expect(values[0]).toBe(256); // u16
    expect(values[1]).toBe(256); // u32
  });

  it("should handle stream ending with incomplete byte", async () => {
    async function* chunks(): AsyncGenerator<Uint8Array> {
      yield new Uint8Array([0x00]); // Complete Null
      yield new Uint8Array([0x03]); // u16 type code but incomplete
    }

    const results = [];
    for await (const result of decodeIterable(chunks())) {
      results.push(result);
    }

    expect(results[0]?.isOk()).toBe(true);
    const error = expectErr(results[1]!);
    expect(error.code).toBe("TRUNCATED_STREAM");
  });
});
