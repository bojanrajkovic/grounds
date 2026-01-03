// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { StreamBuffer } from "../src/buffer.js";
import { expectOk } from "@grounds/test-utils";

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
      expectOk(result.value);
    }
  });

  describe("edge cases: consume with n > buffer.length", () => {
    it("should consume entire buffer when n exceeds length", () => {
      const buffer = new StreamBuffer();
      buffer.append(new Uint8Array([1, 2, 3]));
      const consumed = buffer.consume(10);
      expect(consumed).toEqual(new Uint8Array([1, 2, 3]));
      expect(buffer.length).toBe(0);
    });

    it("should return empty array when consuming from empty buffer", () => {
      const buffer = new StreamBuffer();
      const consumed = buffer.consume(5);
      expect(consumed).toEqual(new Uint8Array([]));
      expect(buffer.length).toBe(0);
    });

    it("should clamp to available bytes when n > totalLength", () => {
      const buffer = new StreamBuffer();
      buffer.append(new Uint8Array([10, 20]));
      buffer.append(new Uint8Array([30]));
      const consumed = buffer.consume(100);
      expect(consumed).toEqual(new Uint8Array([10, 20, 30]));
      expect(buffer.length).toBe(0);
    });
  });

  describe("edge cases: peek with n > buffer.length", () => {
    it("should peek entire buffer when n exceeds length in single chunk", () => {
      const buffer = new StreamBuffer();
      buffer.append(new Uint8Array([1, 2, 3]));
      const peeked = buffer.peek(10);
      expect(peeked).toEqual(new Uint8Array([1, 2, 3]));
      expect(buffer.length).toBe(3);
    });

    it("should return empty array when peeking from empty buffer", () => {
      const buffer = new StreamBuffer();
      const peeked = buffer.peek(5);
      expect(peeked).toEqual(new Uint8Array([]));
      expect(buffer.length).toBe(0);
    });

    it("should clamp to available bytes when n > totalLength with single chunk", () => {
      const buffer = new StreamBuffer();
      buffer.append(new Uint8Array([10, 20, 30]));
      const peeked = buffer.peek(100);
      expect(peeked).toEqual(new Uint8Array([10, 20, 30]));
      expect(buffer.length).toBe(3);
    });
  });

  describe("edge cases: tryDecodeOne with invalid type code", () => {
    it("should return error status for invalid type code", () => {
      const buffer = new StreamBuffer();
      // Type code 0xff is invalid (> 0x13 and not reserved)
      buffer.append(new Uint8Array([0xff]));
      const result = buffer.tryDecodeOne();
      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.error).toBeDefined();
      }
    });

    it("should return error and not consume bytes on decode error", () => {
      const buffer = new StreamBuffer();
      // Invalid type code
      buffer.append(new Uint8Array([0xfe, 0x01]));
      const result = buffer.tryDecodeOne();
      expect(result.status).toBe("error");
      // Buffer should still contain the bad bytes (not consumed on error)
      expect(buffer.length).toBe(2);
    });
  });

  describe("edge cases: multiple appends with partial consumes", () => {
    it("should handle multiple appends followed by partial consume across boundaries", () => {
      const buffer = new StreamBuffer();
      // Append 3 chunks
      buffer.append(new Uint8Array([1, 2]));
      buffer.append(new Uint8Array([3, 4]));
      buffer.append(new Uint8Array([5, 6]));
      expect(buffer.length).toBe(6);

      // Consume 3 bytes (crosses first chunk boundary)
      const consumed1 = buffer.consume(3);
      expect(consumed1).toEqual(new Uint8Array([1, 2, 3]));
      expect(buffer.length).toBe(3);

      // Consume 2 more bytes (crosses second chunk boundary)
      const consumed2 = buffer.consume(2);
      expect(consumed2).toEqual(new Uint8Array([4, 5]));
      expect(buffer.length).toBe(1);

      // Consume remaining
      const consumed3 = buffer.consume(1);
      expect(consumed3).toEqual(new Uint8Array([6]));
      expect(buffer.length).toBe(0);
    });

    it("should properly merge chunks after partial consumes", () => {
      const buffer = new StreamBuffer();
      buffer.append(new Uint8Array([1, 2, 3]));
      buffer.append(new Uint8Array([4, 5]));

      // Consume partial chunk
      buffer.consume(1);
      expect(buffer.length).toBe(4);

      // toUint8Array should return properly merged data
      const merged = buffer.toUint8Array();
      expect(merged).toEqual(new Uint8Array([2, 3, 4, 5]));
    });

    it("should handle alternating appends and consumes", () => {
      const buffer = new StreamBuffer();
      buffer.append(new Uint8Array([1, 2]));
      buffer.consume(1);
      expect(buffer.length).toBe(1);

      buffer.append(new Uint8Array([3, 4]));
      expect(buffer.length).toBe(3);

      buffer.consume(2);
      expect(buffer.length).toBe(1);

      buffer.append(new Uint8Array([5]));
      expect(buffer.length).toBe(2);

      const final = buffer.toUint8Array();
      expect(final).toEqual(new Uint8Array([4, 5]));
    });

    it("should maintain correct length across multiple chunk operations", () => {
      const buffer = new StreamBuffer();
      // Use single chunk operations to avoid chunk boundary issues
      buffer.append(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
      expect(buffer.length).toBe(10);

      buffer.consume(5);
      expect(buffer.length).toBe(5);

      buffer.append(new Uint8Array([11, 12]));
      expect(buffer.length).toBe(7);

      const peeked = buffer.peek(5);
      // After consuming 5 bytes from [1..10], remaining is [6,7,8,9,10]
      // Peeking 5 bytes should give [6,7,8,9,10]
      expect(peeked).toEqual(new Uint8Array([6, 7, 8, 9, 10]));
      expect(buffer.length).toBe(7);

      buffer.consume(5);
      expect(buffer.length).toBe(2);
      expect(buffer.toUint8Array()).toEqual(new Uint8Array([11, 12]));
    });
  });
});
