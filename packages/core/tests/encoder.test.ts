// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { encode } from "../src/encoder.js";
import {
  Null,
  Bool,
  U8,
  U32,
  U64,
  U128,
  I32,
  I64,
  String_,
  Timestamp,
  Array_,
  Map_,
  Struct,
  Enum,
} from "../src/values.js";
import { TypeCode } from "../src/types.js";
import type { RelishValue } from "../src/types.js";
import { expectOk, expectErr } from "@grounds/test-utils";

describe("encode primitives (Rust test vectors)", () => {
  describe("Null", () => {
    it("encodes as single type byte", () => {
      const result = expectOk(encode(Null));
      expect(result).toEqual(new Uint8Array([TypeCode.Null]));
    });
  });

  describe("Bool", () => {
    // From Rust: true = 0xFF, false = 0x00
    it("encodes true as type byte + 0xFF", () => {
      const result = expectOk(encode(Bool(true)));
      expect(result).toEqual(
        new Uint8Array([TypeCode.Bool, 0xff])
      );
    });

    it("encodes false as type byte + 0x00", () => {
      const result = expectOk(encode(Bool(false)));
      expect(result).toEqual(
        new Uint8Array([TypeCode.Bool, 0x00])
      );
    });
  });

  describe("unsigned integers (little-endian)", () => {
    // From Rust: u8(42) = [0x02, 0x2A]
    it("encodes u8(42)", () => {
      const result = expectOk(encode(U8(42)));
      expect(result).toEqual(
        new Uint8Array([TypeCode.U8, 0x2a])
      );
    });

    // From Rust: u32(42) = [0x04, 0x2A, 0x00, 0x00, 0x00]
    it("encodes u32(42) little-endian", () => {
      const result = expectOk(encode(U32(42)));
      expect(result).toEqual(
        new Uint8Array([TypeCode.U32, 0x2a, 0x00, 0x00, 0x00])
      );
    });

    it("encodes u64 little-endian", () => {
      const result = expectOk(encode(U64(0x123456789abcdef0n)));
      expect(result).toEqual(
        new Uint8Array([
          TypeCode.U64,
          0xf0, 0xde, 0xbc, 0x9a, 0x78, 0x56, 0x34, 0x12,
        ])
      );
    });

    // From Rust: u128(MAX) = [0x06, 0xFF x 16]
    it("encodes u128 max value", () => {
      const max = (1n << 128n) - 1n;
      const bytes = expectOk(encode(U128(max)));
      expect(bytes[0]).toBe(TypeCode.U128);
      expect(bytes.length).toBe(17);
      for (let i = 1; i < 17; i++) {
        expect(bytes[i]).toBe(0xff);
      }
    });
  });

  describe("signed integers (little-endian)", () => {
    // From Rust: i32(-42) = [0x09, 0xD6, 0xFF, 0xFF, 0xFF]
    it("encodes i32(-42)", () => {
      const result = expectOk(encode(I32(-42)));
      expect(result).toEqual(
        new Uint8Array([TypeCode.I32, 0xd6, 0xff, 0xff, 0xff])
      );
    });

    it("encodes i64(-1)", () => {
      const result = expectOk(encode(I64(-1n)));
      expect(result).toEqual(
        new Uint8Array([
          TypeCode.I64,
          0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        ])
      );
    });
  });

  describe("String", () => {
    // From Rust: "Hello, Relish!" = [0x0E, 0x1C, ...bytes]
    // 0x1C = 28 = 14 << 1 (length 14)
    it("encodes 'Hello, Relish!'", () => {
      const bytes = expectOk(encode(String_("Hello, Relish!")));
      expect(bytes[0]).toBe(TypeCode.String);
      expect(bytes[1]).toBe(0x1c); // length 14 << 1
      expect(bytes.slice(2)).toEqual(
        new TextEncoder().encode("Hello, Relish!")
      );
    });

    it("encodes empty string", () => {
      const result = expectOk(encode(String_("")));
      expect(result).toEqual(
        new Uint8Array([TypeCode.String, 0x00])
      );
    });
  });

  describe("Timestamp", () => {
    it("encodes timestamp as i64 little-endian", () => {
      const bytes = expectOk(encode(Timestamp(1704067200n)));
      expect(bytes[0]).toBe(TypeCode.Timestamp);
      expect(bytes.length).toBe(9); // type + 8 bytes
    });
  });
});

describe("encode structs (Rust test vectors)", () => {
  // From Rust: Empty struct = [0x11, 0x00]
  it("encodes empty struct", () => {
    const result = expectOk(encode(Struct(new Map())));
    expect(result).toEqual(
      new Uint8Array([TypeCode.Struct, 0x00])
    );
  });

  // From Rust: Simple { value: 42 } where field_id=0
  // = [0x11, 0x0C, 0x00, 0x04, 0x2A, 0x00, 0x00, 0x00]
  // 0x0C = 12 = 6 << 1 (content length 6)
  it("encodes struct with single u32 field", () => {
    const fields = new Map<number, RelishValue>([[0, U32(42)]]);
    const result = expectOk(encode(Struct(fields)));
    expect(result).toEqual(
      new Uint8Array([TypeCode.Struct, 0x0c, 0x00, TypeCode.U32, 0x2a, 0x00, 0x00, 0x00])
    );
  });

  it("encodes struct with multiple fields in ascending order", () => {
    const fields = new Map<number, RelishValue>([
      [0, U8(1)],
      [1, U8(2)],
      [5, U8(3)],
    ]);
    const bytes = expectOk(encode(Struct(fields)));
    expect(bytes[0]).toBe(TypeCode.Struct);
    // Content: field0 + field1 + field5
  });

  it("rejects struct with field ID > 127", () => {
    const fields = new Map<number, RelishValue>([[128, U8(1)]]);
    const error = expectErr(encode(Struct(fields)));
    expect(error.message).toContain("field ID 128");
  });

  it('encodes Person { name: "Eve", age: 42 } correctly', () => {
    const fields = new Map<number, RelishValue>([
      [0, String_("Eve")],
      [1, U32(42)],
    ]);
    const result = expectOk(encode(Struct(fields)));

    expect(result).toEqual(
      new Uint8Array([
        0x11, 0x18,                              // Struct, length=12 bytes
        0x00, 0x0e, 0x06, 0x45, 0x76, 0x65,      // Field 0: String "Eve"
        0x01, 0x04, 0x2a, 0x00, 0x00, 0x00,      // Field 1: U32 42
      ])
    );
  });
});

describe("encode enums (Rust test vectors)", () => {
  // From Rust: SimpleEnum::A(42) where variant_id=0
  // = [0x12, 0x0C, 0x00, 0x04, 0x2A, 0x00, 0x00, 0x00]
  it("encodes enum variant with u32", () => {
    const result = expectOk(encode(Enum(0, U32(42))));
    expect(result).toEqual(
      new Uint8Array([TypeCode.Enum, 0x0c, 0x00, TypeCode.U32, 0x2a, 0x00, 0x00, 0x00])
    );
  });

  it("encodes enum variant with string", () => {
    const bytes = expectOk(encode(Enum(1, String_("hello"))));
    expect(bytes[0]).toBe(TypeCode.Enum);
    // Content includes: variant_id + type + length + "hello"
  });

  it("rejects enum with variant ID > 127", () => {
    const result = encode(Enum(128, Null));
    expect(result.isErr()).toBe(true);
  });
});

describe("encode arrays (Rust test vectors)", () => {
  // From Rust: Vec<u32> [1,2,3,4]
  // = [0x0F, 0x22, 0x04, 0x01,0x00,0x00,0x00, 0x02,0x00,0x00,0x00, ...]
  // 0x22 = 34 = 17 << 1 (content length 17: 1 type byte + 4*4 value bytes)
  it("encodes array of u32 with raw number elements", () => {
    // Elements are raw JS values, not wrapped RelishValue
    const result = expectOk(encode(Array_(TypeCode.U32, [1, 2, 3, 4])));
    expect(result).toEqual(
      new Uint8Array([
        TypeCode.Array, 0x22, TypeCode.U32,
        0x01, 0x00, 0x00, 0x00,
        0x02, 0x00, 0x00, 0x00,
        0x03, 0x00, 0x00, 0x00,
        0x04, 0x00, 0x00, 0x00,
      ])
    );
  });

  it("encodes array of strings with raw string elements", () => {
    const bytes = expectOk(encode(Array_(TypeCode.String, ["hi", "yo"])));
    expect(bytes[0]).toBe(TypeCode.Array);
    // Content: type byte + "hi" (len + bytes) + "yo" (len + bytes)
  });

  it("encodes empty array", () => {
    const result = expectOk(encode(Array_(TypeCode.U8, [])));
    expect(result).toEqual(
      new Uint8Array([TypeCode.Array, 0x02, TypeCode.U8])
    );
  });

  it("encodes nested array without repeating type codes for composite elements", () => {
    // Array of arrays: outer declares element type = Array once
    // Each inner array encodes as [L]V without redundant type code
    const inner1 = Array_(TypeCode.U8, [1, 2]);
    const inner2 = Array_(TypeCode.U8, [3, 4]);
    const result = expectOk(encode(Array_(TypeCode.Array, [inner1, inner2])));

    // Expected encoding:
    // 0x0f = outer array type
    // 0x12 = length 9 bytes (1 element type + 4 inner1 + 4 inner2)
    // 0x0f = element type (Array)
    // Inner1: 0x06, 0x02, 0x01, 0x02 (length=3 bytes, type=U8, values 1,2)
    // Inner2: 0x06, 0x02, 0x03, 0x04 (length=3 bytes, type=U8, values 3,4)
    expect(result).toEqual(
      new Uint8Array([
        TypeCode.Array, 0x12, TypeCode.Array,
        0x06, TypeCode.U8, 0x01, 0x02,
        0x06, TypeCode.U8, 0x03, 0x04,
      ])
    );
  });

  it("encodes [[9,10],[1,2]] correctly", () => {
    const inner1 = Array_(TypeCode.U8, [9, 10]);
    const inner2 = Array_(TypeCode.U8, [1, 2]);
    const result = expectOk(encode(Array_(TypeCode.Array, [inner1, inner2])));

    expect(result).toEqual(
      new Uint8Array([
        0x0f, 0x12, 0x0f,           // Outer: Array, length=9, element type=Array
        0x06, 0x02, 0x09, 0x0a,     // Inner1: length=3, U8, [9, 10]
        0x06, 0x02, 0x01, 0x02,     // Inner2: length=3, U8, [1, 2]
      ])
    );
  });
});

describe("encode maps (Rust test vectors)", () => {
  // From Rust: HashMap {1u32: 10u32}
  // = [0x10, 0x14, 0x04, 0x04, 0x01,0x00,0x00,0x00, 0x0A,0x00,0x00,0x00]
  // 0x14 = 20 = 10 << 1 (content length 10)
  it("encodes map with raw u32 keys and values", () => {
    // Entries hold raw JS values for primitive types
    const entries = new Map<number, number>([[1, 10]]);
    const result = expectOk(encode(Map_(TypeCode.U32, TypeCode.U32, entries)));
    expect(result).toEqual(
      new Uint8Array([
        TypeCode.Map, 0x14, TypeCode.U32, TypeCode.U32,
        0x01, 0x00, 0x00, 0x00,
        0x0a, 0x00, 0x00, 0x00,
      ])
    );
  });

  it("encodes map with string keys and u32 values", () => {
    const bytes = expectOk(encode(Map_(TypeCode.String, TypeCode.U32, {"key": 42})));
    expect(bytes[0]).toBe(TypeCode.Map);
  });

  it("encodes empty map", () => {
    const result = expectOk(encode(Map_(TypeCode.String, TypeCode.U32, {})));
    expect(result).toEqual(
      new Uint8Array([TypeCode.Map, 0x04, TypeCode.String, TypeCode.U32])
    );
  });

  it('encodes {"a": 1, "b": 2} correctly', () => {
    const result = expectOk(encode(Map_(TypeCode.String, TypeCode.U8, {"a": 1, "b": 2})));

    expect(result).toEqual(
      new Uint8Array([
        0x10, 0x10, 0x0e, 0x02,  // Map, length=8, key type=String, value type=U8
        0x02, 0x61, 0x01,        // "a" (length=1 as 0x02, char 'a'=0x61), value=1
        0x02, 0x62, 0x02,        // "b" (length=1 as 0x02, char 'b'=0x62), value=2
      ])
    );
  });
});
