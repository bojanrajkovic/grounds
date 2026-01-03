// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { Decoder, decode } from "../src/decoder.js";
import { TypeCode, DateTime } from "../src/types.js";
import { expectOk, expectErr, expectArray, expectMap, expectDateTime, expectStruct, expectEnum } from "@grounds/test-utils";

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
    expect(expectOk(decoder.decodeVarsizeLength())).toBe(3);
  });

  it("decodes length 0 (short form)", () => {
    // Length 0 encoded as: 0 << 1 = 0 = 0x00
    const decoder = new Decoder(new Uint8Array([0x00]));
    expect(expectOk(decoder.decodeVarsizeLength())).toBe(0);
  });

  it("decodes length 63 (max 7-bit)", () => {
    // Length 63 encoded as: 63 << 1 = 126 = 0x7E
    const decoder = new Decoder(new Uint8Array([0x7E]));
    expect(expectOk(decoder.decodeVarsizeLength())).toBe(63);
  });

  it("decodes long form length (bit 0 = 1)", () => {
    // Length 128 encoded as: (128 << 1) | 1 = 257 as 4-byte LE = [0x01, 0x01, 0x00, 0x00]
    const decoder = new Decoder(new Uint8Array([0x01, 0x01, 0x00, 0x00]));
    expect(expectOk(decoder.decodeVarsizeLength())).toBe(128);
  });

  it("returns error for truncated long form", () => {
    const decoder = new Decoder(new Uint8Array([0x01, 0x01]));
    expectErr(decoder.decodeVarsizeLength());
  });
});

describe("Decoder primitives", () => {
  describe("Null", () => {
    it("decodes null as raw null value", () => {
      const decoder = new Decoder(new Uint8Array([TypeCode.Null]));
      expect(expectOk(decoder.decodeValue())).toBe(null);
    });
  });

  describe("Bool", () => {
    it("decodes true (0xFF) as raw boolean", () => {
      const decoder = new Decoder(new Uint8Array([TypeCode.Bool, 0xFF]));
      expect(expectOk(decoder.decodeValue())).toBe(true);
    });

    it("decodes false (0x00) as raw boolean", () => {
      const decoder = new Decoder(new Uint8Array([TypeCode.Bool, 0x00]));
      expect(expectOk(decoder.decodeValue())).toBe(false);
    });
  });

  describe("u8", () => {
    it("decodes u8 as raw number", () => {
      const decoder = new Decoder(new Uint8Array([TypeCode.U8, 42]));
      expect(expectOk(decoder.decodeValue())).toBe(42);
    });
  });

  describe("u16", () => {
    it("decodes u16 little-endian as raw number", () => {
      // 0x1234 in little-endian = [0x34, 0x12]
      const decoder = new Decoder(new Uint8Array([TypeCode.U16, 0x34, 0x12]));
      expect(expectOk(decoder.decodeValue())).toBe(0x1234);
    });
  });

  describe("u32", () => {
    it("decodes u32 little-endian as raw number", () => {
      // 0x12345678 in little-endian = [0x78, 0x56, 0x34, 0x12]
      const decoder = new Decoder(new Uint8Array([TypeCode.U32, 0x78, 0x56, 0x34, 0x12]));
      expect(expectOk(decoder.decodeValue())).toBe(0x12345678);
    });
  });

  describe("u64", () => {
    it("decodes u64 as raw bigint", () => {
      // 1n in little-endian = [0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
      const decoder = new Decoder(new Uint8Array([TypeCode.U64, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
      expect(expectOk(decoder.decodeValue())).toBe(1n);
    });
  });

  describe("i8", () => {
    it("decodes negative i8 as raw number", () => {
      // -1 as signed byte = 0xFF
      const decoder = new Decoder(new Uint8Array([TypeCode.I8, 0xFF]));
      expect(expectOk(decoder.decodeValue())).toBe(-1);
    });
  });

  describe("i32", () => {
    it("decodes negative i32 as raw number", () => {
      // -1 as signed 32-bit = [0xFF, 0xFF, 0xFF, 0xFF]
      const decoder = new Decoder(new Uint8Array([TypeCode.I32, 0xFF, 0xFF, 0xFF, 0xFF]));
      expect(expectOk(decoder.decodeValue())).toBe(-1);
    });
  });

  describe("f32", () => {
    it("decodes f32 as raw number", () => {
      // 1.0f32 in little-endian = [0x00, 0x00, 0x80, 0x3F]
      const decoder = new Decoder(new Uint8Array([TypeCode.F32, 0x00, 0x00, 0x80, 0x3F]));
      expect(expectOk(decoder.decodeValue())).toBeCloseTo(1.0);
    });
  });

  describe("f64", () => {
    it("decodes f64 as raw number", () => {
      // 1.0f64 in little-endian = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF0, 0x3F]
      const decoder = new Decoder(new Uint8Array([TypeCode.F64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF0, 0x3F]));
      expect(expectOk(decoder.decodeValue())).toBeCloseTo(1.0);
    });
  });
});

describe("Decoder String", () => {
  it("decodes empty string as raw string", () => {
    // Empty string: [TypeCode.String, length=0 (0x00)]
    const decoder = new Decoder(new Uint8Array([TypeCode.String, 0x00]));
    expect(expectOk(decoder.decodeValue())).toBe("");
  });

  it("decodes ASCII string as raw string", () => {
    // "foo": [TypeCode.String, length=3 (0x06), 'f', 'o', 'o']
    const decoder = new Decoder(new Uint8Array([TypeCode.String, 0x06, 0x66, 0x6F, 0x6F]));
    expect(expectOk(decoder.decodeValue())).toBe("foo");
  });

  it("decodes UTF-8 string as raw string", () => {
    // "日本" in UTF-8: [0xE6, 0x97, 0xA5, 0xE6, 0x9C, 0xAC]
    const utf8Bytes = new TextEncoder().encode("日本");
    const buffer = new Uint8Array([TypeCode.String, utf8Bytes.length << 1, ...utf8Bytes]);
    const decoder = new Decoder(buffer);
    expect(expectOk(decoder.decodeValue())).toBe("日本");
  });

  it("rejects invalid UTF-8", () => {
    // Invalid UTF-8 sequence: [0xFF, 0xFE]
    const decoder = new Decoder(new Uint8Array([TypeCode.String, 0x04, 0xFF, 0xFE]));
    expectErr(decoder.decodeValue());
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
    const decoded = expectOk(decoder.decodeValue());
    expectDateTime(decoded);
    expect(decoded.toSeconds()).toBe(1704067200);
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
    const arr = expectOk(decoder.decodeValue());
    expectArray<number>(arr);
    expect(arr).toEqual([1, 2, 3, 4]);
  });

  it("decodes empty vec![] as ReadonlyArray from Rust test vectors", () => {
    // From Rust: empty Vec<u32> encodes to:
    // [TypeCode.Array, 0x02, TypeCode.U32]
    // 0x02 = (1 << 1) = 2, where 1 = 1 (element type byte only)
    const decoder = new Decoder(new Uint8Array([TypeCode.Array, 0x02, TypeCode.U32]));
    const arr = expectOk(decoder.decodeValue());
    expectArray<unknown>(arr);
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
    const arr = expectOk(decoder.decodeValue());
    expectArray<string>(arr);
    expect(arr).toEqual(["foo", "bar", "baz"]);
  });
});

describe("Decoder Map", () => {
  it("decodes HashMap {1u32: 10u32} as ReadonlyMap from Rust test vectors", () => {
    // From Rust: HashMap {1u32: 10u32} encodes to:
    // [TypeCode.Map, 0x14, TypeCode.U32, TypeCode.U32, 0x01,0x00,0x00,0x00, 0x0A,0x00,0x00,0x00]
    // 0x14 = (10 << 1) = 20, where 10 = 2 (key+value types) + 8 (one u32 key + one u32 value)
    const decoder = new Decoder(new Uint8Array([
      TypeCode.Map, 0x14, TypeCode.U32, TypeCode.U32,
      0x01, 0x00, 0x00, 0x00,  // key: 1
      0x0A, 0x00, 0x00, 0x00   // value: 10
    ]));
    const map = expectOk(decoder.decodeValue());
    expectMap<number, number>(map);
    expect(map.get(1)).toBe(10);
    expect(map.size).toBe(1);
  });

  it("decodes empty HashMap<u32, u32> as ReadonlyMap from Rust test vectors", () => {
    // From Rust: empty HashMap<u32, u32> encodes to:
    // [TypeCode.Map, 0x04, TypeCode.U32, TypeCode.U32]
    // 0x04 = (2 << 1) = 4, where 2 = 2 (key+value type bytes only)
    const decoder = new Decoder(new Uint8Array([TypeCode.Map, 0x04, TypeCode.U32, TypeCode.U32]));
    const map = expectOk(decoder.decodeValue());
    expectMap<number, number>(map);
    expect(map.size).toBe(0);
  });

  it("decodes HashMap {1u32: \"foo\"} as ReadonlyMap from Rust test vectors", () => {
    // From Rust: HashMap {1u32: "foo"} encodes to:
    // [TypeCode.Map, 0x14, TypeCode.U32, TypeCode.String, 0x01,0x00,0x00,0x00, 0x06, 'f','o','o']
    // 0x14 = (10 << 1) = 20, where 10 = 2 (types) + 4 (u32) + 4 (length + "foo")
    const decoder = new Decoder(new Uint8Array([
      TypeCode.Map, 0x14, TypeCode.U32, TypeCode.String,
      0x01, 0x00, 0x00, 0x00,  // key: 1
      0x06, 0x66, 0x6F, 0x6F   // value: "foo" (length=3)
    ]));
    const map = expectOk(decoder.decodeValue());
    expectMap<number, string>(map);
    expect(map.get(1)).toBe("foo");
    expect(map.size).toBe(1);
  });

  it("rejects duplicate map keys", () => {
    // Map with duplicate key 1
    const decoder = new Decoder(new Uint8Array([
      TypeCode.Map, 0x24, TypeCode.U32, TypeCode.U32,
      0x01, 0x00, 0x00, 0x00, 0x0A, 0x00, 0x00, 0x00,  // key: 1, value: 10
      0x01, 0x00, 0x00, 0x00, 0x14, 0x00, 0x00, 0x00   // key: 1 (duplicate!), value: 20
    ]));
    expectErr(decoder.decodeValue());
  });
});

describe("Decoder Struct", () => {
  it("decodes struct with single field as plain object", () => {
    // Struct with field 1 = u8(42):
    // [TypeCode.Struct, length, field_id=1, TypeCode.U8, 42]
    // length = (3 << 1) = 6 for 3 bytes content
    const decoder = new Decoder(new Uint8Array([
      TypeCode.Struct, 0x06,  // length=3
      0x01,                   // field_id=1
      TypeCode.U8, 0x2A      // u8(42)
    ]));
    const struct = expectOk(decoder.decodeValue());
    expectStruct(struct);
    expect(struct[1]).toBe(42);
  });

  it("decodes struct with multiple fields as plain object in ascending order", () => {
    // Struct with field 1 = u8(1), field 2 = u8(2), field 5 = u8(5)
    const decoder = new Decoder(new Uint8Array([
      TypeCode.Struct, 0x12,  // length=9
      0x01, TypeCode.U8, 0x01,  // field 1 = 1
      0x02, TypeCode.U8, 0x02,  // field 2 = 2
      0x05, TypeCode.U8, 0x05   // field 5 = 5
    ]));
    const struct = expectOk(decoder.decodeValue());
    expectStruct(struct);
    expect(struct[1]).toBe(1);
    expect(struct[2]).toBe(2);
    expect(struct[5]).toBe(5);
  });

  it("rejects struct with non-ascending field IDs", () => {
    // Struct with field 2 before field 1 (invalid)
    const decoder = new Decoder(new Uint8Array([
      TypeCode.Struct, 0x0C,  // length=6
      0x02, TypeCode.U8, 0x02,  // field 2 first (wrong!)
      0x01, TypeCode.U8, 0x01   // field 1 second
    ]));
    expectErr(decoder.decodeValue());
  });

  it("rejects field ID with bit 7 set", () => {
    // Field ID 0x80 is invalid
    const decoder = new Decoder(new Uint8Array([
      TypeCode.Struct, 0x06,
      0x80, TypeCode.U8, 0x01  // field 128 - bit 7 set
    ]));
    expectErr(decoder.decodeValue());
  });
});

describe("Decoder Enum", () => {
  it("decodes enum variant with value as plain object", () => {
    // Enum variant 1 with u8(42):
    // [TypeCode.Enum, length, variant_id=1, TypeCode.U8, 42]
    // length = (3 << 1) = 6 for 3 bytes (variant_id + T[L]V)
    const decoder = new Decoder(new Uint8Array([
      TypeCode.Enum, 0x06,   // length=3
      0x01,                  // variant_id=1
      TypeCode.U8, 0x2A     // u8(42)
    ]));
    const enumVal = expectOk(decoder.decodeValue());
    expectEnum(enumVal);
    expect(enumVal.variantId).toBe(1);
    expect(enumVal.value).toBe(42);
  });

  it("rejects enum with length mismatch", () => {
    // Enum claims length=2 but value is 2 bytes (u8)
    const decoder = new Decoder(new Uint8Array([
      TypeCode.Enum, 0x04,   // length=2 (too short!)
      0x01,                  // variant_id=1
      TypeCode.U8, 0x2A     // u8(42) - this won't fit
    ]));
    expectErr(decoder.decodeValue());
  });

  it("rejects variant ID with bit 7 set", () => {
    const decoder = new Decoder(new Uint8Array([
      TypeCode.Enum, 0x06,
      0x80,                  // variant 128 - bit 7 set
      TypeCode.U8, 0x01
    ]));
    expectErr(decoder.decodeValue());
  });
});

describe("decode() public API", () => {
  it("decodes complete value as raw DecodedValue", () => {
    expect(expectOk(decode(new Uint8Array([TypeCode.U32, 0x2A, 0x00, 0x00, 0x00])))).toBe(42);
  });

  it("returns error for empty buffer", () => {
    expectErr(decode(new Uint8Array([])));
  });

  it("returns error for truncated value", () => {
    expectErr(decode(new Uint8Array([TypeCode.U32, 0x2A]))); // Missing 3 bytes
  });

  it('decodes [["a","b"],["10","17"]] from hex bytes', () => {
    // Hex: 0f1e0f0a0e026102620e0e043130043137
    const bytes = new Uint8Array([
      0x0f, 0x1e, 0x0f,           // Outer: Array, length=15, element type=Array
      0x0a, 0x0e, 0x02, 0x61, 0x02, 0x62,  // Inner1: length=5, String, "a", "b"
      0x0e, 0x0e, 0x04, 0x31, 0x30, 0x04, 0x31, 0x37,  // Inner2: length=7, String, "10", "17"
    ]);

    const arr = expectOk(decode(bytes));
    expectArray<Array<string>>(arr);
    expect(arr.length).toBe(2);
    expect(arr[0]).toEqual(["a", "b"]);
    expect(arr[1]).toEqual(["10", "17"]);
  });

  it('decodes Person { name: "Frank", age: 79 } from hex bytes', () => {
    // Hex: 111c000e0a4672616e6b01044f000000
    const bytes = new Uint8Array([
      0x11, 0x1c,                              // Struct, length=14 bytes
      0x00, 0x0e, 0x0a, 0x46, 0x72, 0x61, 0x6e, 0x6b,  // Field 0: String "Frank"
      0x01, 0x04, 0x4f, 0x00, 0x00, 0x00,      // Field 1: U32 79
    ]);

    const obj = expectOk(decode(bytes));
    expectStruct(obj);
    expect(obj[0]).toBe("Frank");
    expect(obj[1]).toBe(79);
  });
});
