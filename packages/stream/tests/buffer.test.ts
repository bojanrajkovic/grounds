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
