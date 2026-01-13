// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { TypeCode, isPrimitiveTypeCode, type RelishValue } from "../src/types.js";

describe("TypeCode", () => {
  it("has correct values for all 20 Relish types", () => {
    expect(TypeCode.Null).toBe(0x00);
    expect(TypeCode.Bool).toBe(0x01);
    expect(TypeCode.U8).toBe(0x02);
    expect(TypeCode.U16).toBe(0x03);
    expect(TypeCode.U32).toBe(0x04);
    expect(TypeCode.U64).toBe(0x05);
    expect(TypeCode.U128).toBe(0x06);
    expect(TypeCode.I8).toBe(0x07);
    expect(TypeCode.I16).toBe(0x08);
    expect(TypeCode.I32).toBe(0x09);
    expect(TypeCode.I64).toBe(0x0a);
    expect(TypeCode.I128).toBe(0x0b);
    expect(TypeCode.F32).toBe(0x0c);
    expect(TypeCode.F64).toBe(0x0d);
    expect(TypeCode.String).toBe(0x0e);
    expect(TypeCode.Array).toBe(0x0f);
    expect(TypeCode.Map).toBe(0x10);
    expect(TypeCode.Struct).toBe(0x11);
    expect(TypeCode.Enum).toBe(0x12);
    expect(TypeCode.Timestamp).toBe(0x13);
  });

  it("has exactly 20 type codes", () => {
    const values = Object.values(TypeCode).filter((v) => typeof v === "number");
    expect(values.length).toBe(20);
  });
});

describe("isPrimitiveTypeCode", () => {
  it("returns true for all primitive types (0x00-0x0e)", () => {
    expect(isPrimitiveTypeCode(TypeCode.Null)).toBe(true);
    expect(isPrimitiveTypeCode(TypeCode.Bool)).toBe(true);
    expect(isPrimitiveTypeCode(TypeCode.U8)).toBe(true);
    expect(isPrimitiveTypeCode(TypeCode.U16)).toBe(true);
    expect(isPrimitiveTypeCode(TypeCode.U32)).toBe(true);
    expect(isPrimitiveTypeCode(TypeCode.U64)).toBe(true);
    expect(isPrimitiveTypeCode(TypeCode.U128)).toBe(true);
    expect(isPrimitiveTypeCode(TypeCode.I8)).toBe(true);
    expect(isPrimitiveTypeCode(TypeCode.I16)).toBe(true);
    expect(isPrimitiveTypeCode(TypeCode.I32)).toBe(true);
    expect(isPrimitiveTypeCode(TypeCode.I64)).toBe(true);
    expect(isPrimitiveTypeCode(TypeCode.I128)).toBe(true);
    expect(isPrimitiveTypeCode(TypeCode.F32)).toBe(true);
    expect(isPrimitiveTypeCode(TypeCode.F64)).toBe(true);
    expect(isPrimitiveTypeCode(TypeCode.String)).toBe(true);
  });

  it("returns true for Timestamp (0x13)", () => {
    expect(isPrimitiveTypeCode(TypeCode.Timestamp)).toBe(true);
  });

  it("returns false for composite types (0x0f-0x12)", () => {
    expect(isPrimitiveTypeCode(TypeCode.Array)).toBe(false);
    expect(isPrimitiveTypeCode(TypeCode.Map)).toBe(false);
    expect(isPrimitiveTypeCode(TypeCode.Struct)).toBe(false);
    expect(isPrimitiveTypeCode(TypeCode.Enum)).toBe(false);
  });
});

describe("RelishValue", () => {
  it("supports null type", () => {
    const value: RelishValue = { type: "null" };
    expect(value.type).toBe("null");
  });

  it("supports bool type", () => {
    const value: RelishValue = { type: "bool", value: true };
    expect(value.type).toBe("bool");
    expect(value.value).toBe(true);
  });

  it("supports numeric types with correct JS representation", () => {
    const u8: RelishValue = { type: "u8", value: 255 };
    const u64: RelishValue = { type: "u64", value: 18446744073709551615n };
    const i128: RelishValue = { type: "i128", value: -170141183460469231731687303715884105728n };
    const f64: RelishValue = { type: "f64", value: 3.14159 };

    expect(u8.value).toBe(255);
    expect(typeof u64.value).toBe("bigint");
    expect(typeof i128.value).toBe("bigint");
    expect(typeof f64.value).toBe("number");
  });

  it("supports string type", () => {
    const value: RelishValue = { type: "string", value: "hello" };
    expect(value.value).toBe("hello");
  });

  it("supports array type with homogeneous raw elements", () => {
    // Arrays hold raw JS values, not wrapped RelishValue
    const u32Array: RelishValue = {
      type: "array",
      elementType: TypeCode.U32,
      elements: [1, 2, 3], // Raw numbers, not { type: "u32", value: 1 }
    };
    expect(u32Array.elementType).toBe(TypeCode.U32);
    expect(u32Array.elements).toEqual([1, 2, 3]);

    const stringArray: RelishValue = {
      type: "array",
      elementType: TypeCode.String,
      elements: ["hello", "world"], // Raw strings
    };
    expect(stringArray.elements).toEqual(["hello", "world"]);
  });

  it("supports nested array with RelishValue elements", () => {
    // Arrays of composite types (Array, Map, Struct, Enum) hold RelishValue
    const nestedArray: RelishValue = {
      type: "array",
      elementType: TypeCode.Array,
      elements: [
        { type: "array", elementType: TypeCode.U8, elements: [1, 2] },
        { type: "array", elementType: TypeCode.U8, elements: [3, 4] },
      ],
    };
    expect(nestedArray.elementType).toBe(TypeCode.Array);
    expect(nestedArray.elements.length).toBe(2);
  });

  it("supports map type with homogeneous raw entries", () => {
    // Maps hold raw JS values for keys and values (when primitive)
    const value: RelishValue = {
      type: "map",
      keyType: TypeCode.String,
      valueType: TypeCode.U32,
      entries: new Map([
        ["a", 1], // Raw [string, number], not [RelishValue, RelishValue]
        ["b", 2],
      ]),
    };
    expect(value.keyType).toBe(TypeCode.String);
    expect(value.valueType).toBe(TypeCode.U32);
    expect(value.entries.get("a")).toBe(1);
    expect(value.entries.get("b")).toBe(2);
  });

  it("supports struct type with field map", () => {
    const value: RelishValue = {
      type: "struct",
      fields: new Map([
        [1, { type: "string", value: "name" }],
        [2, { type: "u32", value: 42 }],
      ]),
    };
    expect(value.fields.size).toBe(2);
    expect(value.fields.get(1)).toEqual({ type: "string", value: "name" });
  });

  it("supports enum type with variant ID and value", () => {
    const value: RelishValue = {
      type: "enum",
      variantId: 1,
      value: { type: "string", value: "data" },
    };
    expect(value.variantId).toBe(1);
    expect(value.value.type).toBe("string");
  });

  it("supports timestamp type", () => {
    const value: RelishValue = { type: "timestamp", unixSeconds: 1704067200n };
    expect(value.unixSeconds).toBe(1704067200n);
  });
});
