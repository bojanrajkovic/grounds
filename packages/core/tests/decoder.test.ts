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

describe("Decoder varsize length", () => {
  it("decodes short form length (bit 0 = 0)", () => {
    // Length 3 encoded as: 3 << 1 = 6 = 0x06
    const decoder = new Decoder(new Uint8Array([0x06]));
    const result = decoder.decodeVarsizeLength();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(3);
  });

  it("decodes length 0 (short form)", () => {
    // Length 0 encoded as: 0 << 1 = 0 = 0x00
    const decoder = new Decoder(new Uint8Array([0x00]));
    const result = decoder.decodeVarsizeLength();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(0);
  });

  it("decodes length 63 (max 7-bit)", () => {
    // Length 63 encoded as: 63 << 1 = 126 = 0x7E
    const decoder = new Decoder(new Uint8Array([0x7E]));
    const result = decoder.decodeVarsizeLength();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(63);
  });

  it("decodes long form length (bit 0 = 1)", () => {
    // Length 128 encoded as: (128 << 1) | 1 = 257 as 4-byte LE = [0x01, 0x01, 0x00, 0x00]
    const decoder = new Decoder(new Uint8Array([0x01, 0x01, 0x00, 0x00]));
    const result = decoder.decodeVarsizeLength();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(128);
  });

  it("returns error for truncated long form", () => {
    const decoder = new Decoder(new Uint8Array([0x01, 0x01]));
    const result = decoder.decodeVarsizeLength();
    expect(result.isErr()).toBe(true);
  });
});
