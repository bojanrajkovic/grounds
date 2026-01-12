// pattern: Functional Core
import { describe, it, expect } from "vitest";
import {
  Null,
  Bool,
  U8,
  U16,
  U32,
  U64,
  U128,
  I8,
  I16,
  I32,
  I64,
  I128,
  F32,
  F64,
  String_,
  Array_,
  Map_,
  Struct,
  Enum,
  Timestamp,
} from "../src/values.js";
import { TypeCode } from "../src/types.js";

describe("Value constructors", () => {
  describe("Null", () => {
    it("creates null value", () => {
      expect(Null).toMatchObject({ type: "null" });
    });
  });

  describe("Bool", () => {
    it("creates true value", () => {
      expect(Bool(true)).toMatchObject({ type: "bool", value: true });
    });

    it("creates false value", () => {
      expect(Bool(false)).toMatchObject({ type: "bool", value: false });
    });
  });

  describe("unsigned integers", () => {
    it("creates U8 value", () => {
      expect(U8(255)).toMatchObject({ type: "u8", value: 255 });
    });

    it("creates U8 with zero", () => {
      expect(U8(0)).toMatchObject({ type: "u8", value: 0 });
    });

    it("throws on U8 overflow", () => {
      expect(() => U8(256)).toThrow("U8 value out of range: 256");
    });

    it("throws on U8 underflow", () => {
      expect(() => U8(-1)).toThrow("U8 value out of range: -1");
    });

    it("throws on U8 non-integer", () => {
      expect(() => U8(1.5)).toThrow("U8 value must be an integer: 1.5");
    });

    it("creates U16 value", () => {
      expect(U16(65535)).toMatchObject({ type: "u16", value: 65535 });
    });

    it("creates U16 with zero", () => {
      expect(U16(0)).toMatchObject({ type: "u16", value: 0 });
    });

    it("throws on U16 overflow", () => {
      expect(() => U16(65536)).toThrow("U16 value out of range: 65536");
    });

    it("throws on U16 underflow", () => {
      expect(() => U16(-1)).toThrow("U16 value out of range: -1");
    });

    it("throws on U16 non-integer", () => {
      expect(() => U16(1.5)).toThrow("U16 value must be an integer: 1.5");
    });

    it("creates U32 value", () => {
      expect(U32(4294967295)).toMatchObject({ type: "u32", value: 4294967295 });
    });

    it("creates U32 with zero", () => {
      expect(U32(0)).toMatchObject({ type: "u32", value: 0 });
    });

    it("throws on U32 overflow", () => {
      expect(() => U32(4294967296)).toThrow("U32 value out of range: 4294967296");
    });

    it("throws on U32 underflow", () => {
      expect(() => U32(-1)).toThrow("U32 value out of range: -1");
    });

    it("throws on U32 non-integer", () => {
      expect(() => U32(1.5)).toThrow("U32 value must be an integer: 1.5");
    });

    it("creates U64 value", () => {
      expect(U64(18446744073709551615n)).toMatchObject({
        type: "u64",
        value: 18446744073709551615n,
      });
    });

    it("creates U64 with zero", () => {
      expect(U64(0n)).toMatchObject({ type: "u64", value: 0n });
    });

    it("throws on U64 overflow", () => {
      expect(() => U64(18446744073709551616n)).toThrow("U64 value out of range: 18446744073709551616");
    });

    it("throws on U64 underflow", () => {
      expect(() => U64(-1n)).toThrow("U64 value out of range: -1");
    });

    it("creates U128 value", () => {
      const max = 340282366920938463463374607431768211455n;
      expect(U128(max)).toMatchObject({ type: "u128", value: max });
    });

    it("creates U128 with zero", () => {
      expect(U128(0n)).toMatchObject({ type: "u128", value: 0n });
    });

    it("throws on U128 overflow", () => {
      const overflow = 340282366920938463463374607431768211456n;
      expect(() => U128(overflow)).toThrow("U128 value out of range");
    });

    it("throws on U128 underflow", () => {
      expect(() => U128(-1n)).toThrow("U128 value out of range: -1");
    });
  });

  describe("signed integers", () => {
    it("creates I8 value at min", () => {
      expect(I8(-128)).toMatchObject({ type: "i8", value: -128 });
    });

    it("creates I8 value at max", () => {
      expect(I8(127)).toMatchObject({ type: "i8", value: 127 });
    });

    it("creates I8 with zero", () => {
      expect(I8(0)).toMatchObject({ type: "i8", value: 0 });
    });

    it("throws on I8 overflow", () => {
      expect(() => I8(128)).toThrow("I8 value out of range: 128");
    });

    it("throws on I8 underflow", () => {
      expect(() => I8(-129)).toThrow("I8 value out of range: -129");
    });

    it("throws on I8 non-integer", () => {
      expect(() => I8(1.5)).toThrow("I8 value must be an integer: 1.5");
    });

    it("creates I16 value at min", () => {
      expect(I16(-32768)).toMatchObject({ type: "i16", value: -32768 });
    });

    it("creates I16 value at max", () => {
      expect(I16(32767)).toMatchObject({ type: "i16", value: 32767 });
    });

    it("creates I16 with zero", () => {
      expect(I16(0)).toMatchObject({ type: "i16", value: 0 });
    });

    it("throws on I16 overflow", () => {
      expect(() => I16(32768)).toThrow("I16 value out of range: 32768");
    });

    it("throws on I16 underflow", () => {
      expect(() => I16(-32769)).toThrow("I16 value out of range: -32769");
    });

    it("throws on I16 non-integer", () => {
      expect(() => I16(1.5)).toThrow("I16 value must be an integer: 1.5");
    });

    it("creates I32 value at min", () => {
      expect(I32(-2147483648)).toMatchObject({ type: "i32", value: -2147483648 });
    });

    it("creates I32 value at max", () => {
      expect(I32(2147483647)).toMatchObject({ type: "i32", value: 2147483647 });
    });

    it("creates I32 with zero", () => {
      expect(I32(0)).toMatchObject({ type: "i32", value: 0 });
    });

    it("throws on I32 overflow", () => {
      expect(() => I32(2147483648)).toThrow("I32 value out of range: 2147483648");
    });

    it("throws on I32 underflow", () => {
      expect(() => I32(-2147483649)).toThrow("I32 value out of range: -2147483649");
    });

    it("throws on I32 non-integer", () => {
      expect(() => I32(1.5)).toThrow("I32 value must be an integer: 1.5");
    });

    it("creates I64 value at min", () => {
      expect(I64(-9223372036854775808n)).toMatchObject({
        type: "i64",
        value: -9223372036854775808n,
      });
    });

    it("creates I64 value at max", () => {
      expect(I64(9223372036854775807n)).toMatchObject({
        type: "i64",
        value: 9223372036854775807n,
      });
    });

    it("creates I64 with zero", () => {
      expect(I64(0n)).toMatchObject({ type: "i64", value: 0n });
    });

    it("throws on I64 overflow", () => {
      expect(() => I64(9223372036854775808n)).toThrow("I64 value out of range: 9223372036854775808");
    });

    it("throws on I64 underflow", () => {
      expect(() => I64(-9223372036854775809n)).toThrow("I64 value out of range: -9223372036854775809");
    });

    it("creates I128 value at min", () => {
      const min = -170141183460469231731687303715884105728n;
      expect(I128(min)).toMatchObject({ type: "i128", value: min });
    });

    it("creates I128 value at max", () => {
      const max = 170141183460469231731687303715884105727n;
      expect(I128(max)).toMatchObject({ type: "i128", value: max });
    });

    it("creates I128 with zero", () => {
      expect(I128(0n)).toMatchObject({ type: "i128", value: 0n });
    });

    it("throws on I128 overflow", () => {
      const overflow = 170141183460469231731687303715884105728n;
      expect(() => I128(overflow)).toThrow("I128 value out of range");
    });

    it("throws on I128 underflow", () => {
      const underflow = -170141183460469231731687303715884105729n;
      expect(() => I128(underflow)).toThrow("I128 value out of range");
    });
  });

  describe("floating point", () => {
    it("creates F32 value", () => {
      expect(F32(3.14)).toMatchObject({ type: "f32", value: 3.14 });
    });

    it("creates F64 value", () => {
      expect(F64(3.141592653589793)).toMatchObject({
        type: "f64",
        value: 3.141592653589793,
      });
    });
  });

  describe("String_", () => {
    it("creates string value", () => {
      expect(String_("hello")).toMatchObject({ type: "string", value: "hello" });
    });

    it("creates empty string value", () => {
      expect(String_("")).toMatchObject({ type: "string", value: "" });
    });
  });

  describe("Array_", () => {
    it("creates array of u32 with raw number elements", () => {
      // Elements are raw JS values, not wrapped RelishValue
      expect(Array_(TypeCode.U32, [1, 2, 3])).toMatchObject({
        type: "array",
        elementType: TypeCode.U32,
        elements: [1, 2, 3],
      });
    });

    it("creates array of strings with raw string elements", () => {
      expect(Array_(TypeCode.String, ["hello", "world"])).toMatchObject({
        type: "array",
        elementType: TypeCode.String,
        elements: ["hello", "world"],
      });
    });

    it("creates array of bigint types with raw bigint elements", () => {
      expect(Array_(TypeCode.U64, [1n, 2n, 3n])).toMatchObject({
        type: "array",
        elementType: TypeCode.U64,
        elements: [1n, 2n, 3n],
      });
    });

    it("creates empty array", () => {
      expect(Array_(TypeCode.String, [])).toMatchObject({
        type: "array",
        elementType: TypeCode.String,
        elements: [],
      });
    });

    it("creates nested array with RelishValue elements", () => {
      // Composite element types hold RelishValue
      const inner1 = Array_(TypeCode.U8, [1, 2]);
      const inner2 = Array_(TypeCode.U8, [3, 4]);
      expect(Array_(TypeCode.Array, [inner1, inner2])).toMatchObject({
        type: "array",
        elementType: TypeCode.Array,
        elements: [inner1, inner2],
      });
    });

    it("throws on type mismatch (number in string array)", () => {
      // Runtime validation catches mismatched types even if TypeScript is bypassed
      expect(() =>
        Array_(TypeCode.String, [42 as unknown as string])
      ).toThrow("array element at index 0 does not match expected type");
    });

    it("throws on type mismatch (string in u32 array)", () => {
      expect(() =>
        Array_(TypeCode.U32, ["not a number" as unknown as number])
      ).toThrow("array element at index 0 does not match expected type");
    });

    it("throws on type mismatch (number in bigint array)", () => {
      expect(() =>
        Array_(TypeCode.U64, [42 as unknown as bigint])
      ).toThrow("array element at index 0 does not match expected type");
    });
  });

  describe("Map_", () => {
    it("creates map from Record (ergonomic for string keys)", () => {
      // String keys: accept Record for ergonomics
      const map = Map_(TypeCode.String, TypeCode.U32, { a: 1, b: 2 });
      expect(map.type).toBe("map");
      expect(map.keyType).toBe(TypeCode.String);
      expect(map.valueType).toBe(TypeCode.U32);
      expect(map.entries.get("a")).toBe(1);
      expect(map.entries.get("b")).toBe(2);
    });

    it("creates map from Map object (universal)", () => {
      // Any key type: accept Map
      const map = Map_(TypeCode.String, TypeCode.U32, new Map([["a", 1], ["b", 2]]));
      expect(map.entries.get("a")).toBe(1);
      expect(map.entries.get("b")).toBe(2);
    });

    it("creates map with bigint keys (requires Map)", () => {
      // Non-string keys: only accepts Map, not Record
      const map = Map_(TypeCode.U64, TypeCode.String, new Map([[1n, "one"], [2n, "two"]]));
      expect(map.keyType).toBe(TypeCode.U64);
      expect(map.valueType).toBe(TypeCode.String);
      expect(map.entries.get(1n)).toBe("one");
      expect(map.entries.get(2n)).toBe("two");
    });

    it("creates empty map from empty Record", () => {
      const map = Map_(TypeCode.String, TypeCode.U32, {});
      expect(map.entries.size).toBe(0);
    });

    it("creates empty map from empty Map", () => {
      const map = Map_(TypeCode.String, TypeCode.U32, new Map());
      expect(map.entries.size).toBe(0);
    });

    it("throws on key type mismatch", () => {
      // Using Map directly to bypass JavaScript's automatic string conversion
      const badMap = new Map([[42 as unknown as string, 1]]);
      expect(() =>
        Map_(TypeCode.String, TypeCode.U32, badMap)
      ).toThrow("map key does not match expected type");
    });

    it("throws on value type mismatch", () => {
      expect(() =>
        Map_(TypeCode.String, TypeCode.U32, { key: "not a number" as unknown as number })
      ).toThrow("map value does not match expected type");
    });
  });

  describe("Struct", () => {
    it("creates struct value from Map", () => {
      const fields = new Map([
        [1, String_("name")],
        [2, U32(42)],
      ]);
      expect(Struct(fields)).toMatchObject({
        type: "struct",
        fields,
      });
    });
  });

  describe("Enum", () => {
    it("creates enum value", () => {
      expect(Enum(1, String_("data"))).toMatchObject({
        type: "enum",
        variantId: 1,
        value: { type: "string", value: "data" },
      });
    });
  });

  describe("Timestamp", () => {
    it("creates timestamp value", () => {
      expect(Timestamp(1704067200n)).toMatchObject({
        type: "timestamp",
        unixSeconds: 1704067200n,
      });
    });
  });
});
