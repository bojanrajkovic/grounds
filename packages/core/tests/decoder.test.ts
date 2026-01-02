// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { Decoder } from "../src/decoder.js";

describe("Decoder", () => {
  it("creates decoder instance with buffer", () => {
    const buffer = new Uint8Array([0x00]);
    const decoder = new Decoder(buffer);
    expect(decoder).toBeInstanceOf(Decoder);
  });

  it("tracks cursor position", () => {
    const buffer = new Uint8Array([0x00, 0x01, 0x02]);
    const decoder = new Decoder(buffer);
    expect(decoder.position).toBe(0);
    expect(decoder.remaining).toBe(3);
  });
});
