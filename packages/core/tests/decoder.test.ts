// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { Decoder } from "../src/decoder.js";
import { TypeCode } from "../src/types.js";

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

describe("Decoder primitives", () => {
  describe("Null", () => {
    it("decodes null as raw null value", () => {
      const decoder = new Decoder(new Uint8Array([TypeCode.Null]));
      const result = decoder.decodeValue();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(null);
    });
  });

  describe("Bool", () => {
    it("decodes true (0xFF) as raw boolean", () => {
      const decoder = new Decoder(new Uint8Array([TypeCode.Bool, 0xFF]));
      const result = decoder.decodeValue();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
    });

    it("decodes false (0x00) as raw boolean", () => {
      const decoder = new Decoder(new Uint8Array([TypeCode.Bool, 0x00]));
      const result = decoder.decodeValue();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(false);
    });
  });

  describe("u8", () => {
    it("decodes u8 as raw number", () => {
      const decoder = new Decoder(new Uint8Array([TypeCode.U8, 42]));
      const result = decoder.decodeValue();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(42);
    });
  });

  describe("u16", () => {
    it("decodes u16 little-endian as raw number", () => {
      // 0x1234 in little-endian = [0x34, 0x12]
      const decoder = new Decoder(new Uint8Array([TypeCode.U16, 0x34, 0x12]));
      const result = decoder.decodeValue();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(0x1234);
    });
  });

  describe("u32", () => {
    it("decodes u32 little-endian as raw number", () => {
      // 0x12345678 in little-endian = [0x78, 0x56, 0x34, 0x12]
      const decoder = new Decoder(new Uint8Array([TypeCode.U32, 0x78, 0x56, 0x34, 0x12]));
      const result = decoder.decodeValue();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(0x12345678);
    });
  });

  describe("u64", () => {
    it("decodes u64 as raw bigint", () => {
      // 1n in little-endian = [0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
      const decoder = new Decoder(new Uint8Array([TypeCode.U64, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
      const result = decoder.decodeValue();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(1n);
    });
  });

  describe("i8", () => {
    it("decodes negative i8 as raw number", () => {
      // -1 as signed byte = 0xFF
      const decoder = new Decoder(new Uint8Array([TypeCode.I8, 0xFF]));
      const result = decoder.decodeValue();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(-1);
    });
  });

  describe("i32", () => {
    it("decodes negative i32 as raw number", () => {
      // -1 as signed 32-bit = [0xFF, 0xFF, 0xFF, 0xFF]
      const decoder = new Decoder(new Uint8Array([TypeCode.I32, 0xFF, 0xFF, 0xFF, 0xFF]));
      const result = decoder.decodeValue();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(-1);
    });
  });

  describe("f32", () => {
    it("decodes f32 as raw number", () => {
      // 1.0f32 in little-endian = [0x00, 0x00, 0x80, 0x3F]
      const decoder = new Decoder(new Uint8Array([TypeCode.F32, 0x00, 0x00, 0x80, 0x3F]));
      const result = decoder.decodeValue();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeCloseTo(1.0);
    });
  });

  describe("f64", () => {
    it("decodes f64 as raw number", () => {
      // 1.0f64 in little-endian = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF0, 0x3F]
      const decoder = new Decoder(new Uint8Array([TypeCode.F64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF0, 0x3F]));
      const result = decoder.decodeValue();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeCloseTo(1.0);
    });
  });
});
