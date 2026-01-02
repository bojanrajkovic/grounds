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
      expect(Null).toEqual({ type: "null" });
    });
  });

  describe("Bool", () => {
    it("creates true value", () => {
      expect(Bool(true)).toEqual({ type: "bool", value: true });
    });

    it("creates false value", () => {
      expect(Bool(false)).toEqual({ type: "bool", value: false });
    });
  });

  describe("unsigned integers", () => {
    it("creates U8 value", () => {
      expect(U8(255)).toEqual({ type: "u8", value: 255 });
    });

    it("creates U16 value", () => {
      expect(U16(65535)).toEqual({ type: "u16", value: 65535 });
    });

    it("creates U32 value", () => {
      expect(U32(4294967295)).toEqual({ type: "u32", value: 4294967295 });
    });

    it("creates U64 value", () => {
      expect(U64(18446744073709551615n)).toEqual({
        type: "u64",
        value: 18446744073709551615n,
      });
    });

    it("creates U128 value", () => {
      const max = 340282366920938463463374607431768211455n;
      expect(U128(max)).toEqual({ type: "u128", value: max });
    });
  });

  describe("signed integers", () => {
    it("creates I8 value", () => {
      expect(I8(-128)).toEqual({ type: "i8", value: -128 });
    });

    it("creates I16 value", () => {
      expect(I16(-32768)).toEqual({ type: "i16", value: -32768 });
    });

    it("creates I32 value", () => {
      expect(I32(-2147483648)).toEqual({ type: "i32", value: -2147483648 });
    });

    it("creates I64 value", () => {
      expect(I64(-9223372036854775808n)).toEqual({
        type: "i64",
        value: -9223372036854775808n,
      });
    });

    it("creates I128 value", () => {
      const min = -170141183460469231731687303715884105728n;
      expect(I128(min)).toEqual({ type: "i128", value: min });
    });
  });

  describe("floating point", () => {
    it("creates F32 value", () => {
      expect(F32(3.14)).toEqual({ type: "f32", value: 3.14 });
    });

    it("creates F64 value", () => {
      expect(F64(3.141592653589793)).toEqual({
        type: "f64",
        value: 3.141592653589793,
      });
    });
  });

  describe("String_", () => {
    it("creates string value", () => {
      expect(String_("hello")).toEqual({ type: "string", value: "hello" });
    });

    it("creates empty string value", () => {
      expect(String_("")).toEqual({ type: "string", value: "" });
    });
  });

  describe("Array_", () => {
    it("creates array of u32 with raw number elements", () => {
      // Elements are raw JS values, not wrapped RelishValue
      expect(Array_(TypeCode.U32, [1, 2, 3])).toEqual({
        type: "array",
        elementType: TypeCode.U32,
        elements: [1, 2, 3],
      });
    });

    it("creates array of strings with raw string elements", () => {
      expect(Array_(TypeCode.String, ["hello", "world"])).toEqual({
        type: "array",
        elementType: TypeCode.String,
        elements: ["hello", "world"],
      });
    });

    it("creates array of bigint types with raw bigint elements", () => {
      expect(Array_(TypeCode.U64, [1n, 2n, 3n])).toEqual({
        type: "array",
        elementType: TypeCode.U64,
        elements: [1n, 2n, 3n],
      });
    });

    it("creates empty array", () => {
      expect(Array_(TypeCode.String, [])).toEqual({
        type: "array",
        elementType: TypeCode.String,
        elements: [],
      });
    });

    it("creates nested array with RelishValue elements", () => {
      // Composite element types hold RelishValue
      const inner1 = Array_(TypeCode.U8, [1, 2]);
      const inner2 = Array_(TypeCode.U8, [3, 4]);
      expect(Array_(TypeCode.Array, [inner1, inner2])).toEqual({
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
      expect(Struct(fields)).toEqual({
        type: "struct",
        fields,
      });
    });
  });

  describe("Enum", () => {
    it("creates enum value", () => {
      expect(Enum(1, String_("data"))).toEqual({
        type: "enum",
        variantId: 1,
        value: { type: "string", value: "data" },
      });
    });
  });

  describe("Timestamp", () => {
    it("creates timestamp value", () => {
      expect(Timestamp(1704067200n)).toEqual({
        type: "timestamp",
        unixSeconds: 1704067200n,
      });
    });
  });
});
