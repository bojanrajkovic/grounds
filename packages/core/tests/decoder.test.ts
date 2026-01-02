// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { Decoder } from "../src/decoder.js";
import { TypeCode, DateTime } from "../src/types.js";

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

describe("Decoder String", () => {
  it("decodes empty string as raw string", () => {
    // Empty string: [TypeCode.String, length=0 (0x00)]
    const decoder = new Decoder(new Uint8Array([TypeCode.String, 0x00]));
    const result = decoder.decodeValue();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe("");
  });

  it("decodes ASCII string as raw string", () => {
    // "foo": [TypeCode.String, length=3 (0x06), 'f', 'o', 'o']
    const decoder = new Decoder(new Uint8Array([TypeCode.String, 0x06, 0x66, 0x6F, 0x6F]));
    const result = decoder.decodeValue();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe("foo");
  });

  it("decodes UTF-8 string as raw string", () => {
    // "日本" in UTF-8: [0xE6, 0x97, 0xA5, 0xE6, 0x9C, 0xAC]
    const utf8Bytes = new TextEncoder().encode("日本");
    const buffer = new Uint8Array([TypeCode.String, utf8Bytes.length << 1, ...utf8Bytes]);
    const decoder = new Decoder(buffer);
    const result = decoder.decodeValue();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe("日本");
  });

  it("rejects invalid UTF-8", () => {
    // Invalid UTF-8 sequence: [0xFF, 0xFE]
    const decoder = new Decoder(new Uint8Array([TypeCode.String, 0x04, 0xFF, 0xFE]));
    const result = decoder.decodeValue();
    expect(result.isErr()).toBe(true);
  });
});

describe("Decoder Timestamp", () => {
  it("decodes timestamp as Luxon DateTime", () => {
    // Unix timestamp 1704067200 (2024-01-01 00:00:00 UTC)
    // In little-endian 64-bit: [0x80, 0x00, 0x92, 0x65, 0x00, 0x00, 0x00, 0x00]
    const decoder = new Decoder(new Uint8Array([
      TypeCode.Timestamp,
      0x80, 0x00, 0x92, 0x65, 0x00, 0x00, 0x00, 0x00
    ]));
    const result = decoder.decodeValue();
    expect(result.isOk()).toBe(true);
    const decoded = result._unsafeUnwrap();
    expect(DateTime.isDateTime(decoded)).toBe(true);
    expect((decoded as DateTime).toSeconds()).toBe(1704067200);
  });
});

describe("Decoder Array", () => {
  it("decodes vec![1u32, 2, 3, 4] as ReadonlyArray from Rust test vectors", () => {
    // From Rust: vec![1u32, 2, 3, 4] encodes to:
    // [TypeCode.Array, 0x22, TypeCode.U32, 0x01,0x00,0x00,0x00, 0x02,0x00,0x00,0x00, 0x03,0x00,0x00,0x00, 0x04,0x00,0x00,0x00]
    // 0x22 = (17 << 1) = 34, where 17 = 1 (element type) + 16 (4 u32s)
    const decoder = new Decoder(new Uint8Array([
      TypeCode.Array, 0x22, TypeCode.U32,
      0x01, 0x00, 0x00, 0x00,
      0x02, 0x00, 0x00, 0x00,
      0x03, 0x00, 0x00, 0x00,
      0x04, 0x00, 0x00, 0x00
    ]));
    const result = decoder.decodeValue();
    expect(result.isOk()).toBe(true);
    const arr = result._unsafeUnwrap() as ReadonlyArray<number>;
    expect(Array.isArray(arr)).toBe(true);
    expect(arr).toEqual([1, 2, 3, 4]);
  });

  it("decodes empty vec![] as ReadonlyArray from Rust test vectors", () => {
    // From Rust: empty Vec<u32> encodes to:
    // [TypeCode.Array, 0x02, TypeCode.U32]
    // 0x02 = (1 << 1) = 2, where 1 = 1 (element type byte only)
    const decoder = new Decoder(new Uint8Array([TypeCode.Array, 0x02, TypeCode.U32]));
    const result = decoder.decodeValue();
    expect(result.isOk()).toBe(true);
    const arr = result._unsafeUnwrap() as ReadonlyArray<unknown>;
    expect(Array.isArray(arr)).toBe(true);
    expect(arr).toEqual([]);
  });

  it("decodes vec![\"foo\", \"bar\", \"baz\"] as ReadonlyArray from Rust test vectors", () => {
    // From Rust: vec!["foo", "bar", "baz"] encodes to:
    // [TypeCode.Array, 0x1A, TypeCode.String, 0x06, 'f','o','o', 0x06, 'b','a','r', 0x06, 'b','a','z']
    // 0x1A = (13 << 1) = 26, where 13 = 1 (element type) + 12 (3 strings: 2+3 each)
    const decoder = new Decoder(new Uint8Array([
      TypeCode.Array, 0x1A, TypeCode.String,
      0x06, 0x66, 0x6F, 0x6F,  // length=3 "foo"
      0x06, 0x62, 0x61, 0x72,  // length=3 "bar"
      0x06, 0x62, 0x61, 0x7A   // length=3 "baz"
    ]));
    const result = decoder.decodeValue();
    expect(result.isOk()).toBe(true);
    const arr = result._unsafeUnwrap() as ReadonlyArray<string>;
    expect(Array.isArray(arr)).toBe(true);
    expect(arr).toEqual(["foo", "bar", "baz"]);
  });
});
