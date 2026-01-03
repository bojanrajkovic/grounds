import { describe, it, expect } from "vitest";
import { jsToRelish, decodedToTyped } from "../src/convert.js";
import {
  RNull,
  RBool,
  RU8,
  RU32,
  RU64,
  RI32,
  RF64,
  RString,
  RTimestamp,
  RArray,
  RMap,
  ROptional,
} from "../src/types.js";
import { RStruct, field } from "../src/struct.js";
import { REnum, variant } from "../src/enum.js";
import {
  TypeCode,
  type RelishArray,
  type RelishTimestamp,
  type RelishF64,
  type RelishMap,
  type RelishStruct,
  type RelishEnum,
  EncodeError,
  DecodeError,
} from "@grounds/core";
import { DateTime } from "luxon";

describe("jsToRelish primitives", () => {
  it("converts null", () => {
    const result = jsToRelish(null, RNull());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ type: "null" });
  });

  it("converts boolean true", () => {
    const result = jsToRelish(true, RBool());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ type: "bool", value: true });
  });

  it("converts boolean false", () => {
    const result = jsToRelish(false, RBool());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ type: "bool", value: false });
  });

  it("converts u8", () => {
    const result = jsToRelish(42, RU8());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ type: "u8", value: 42 });
  });

  it("converts u32", () => {
    const result = jsToRelish(123456, RU32());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ type: "u32", value: 123456 });
  });

  it("converts u64 bigint", () => {
    const result = jsToRelish(123n, RU64());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ type: "u64", value: 123n });
  });

  it("converts i32", () => {
    const result = jsToRelish(-100, RI32());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ type: "i32", value: -100 });
  });

  it("converts f64", () => {
    const result = jsToRelish(3.14159, RF64());
    expect(result.isOk()).toBe(true);
    const value = result._unsafeUnwrap() as RelishF64;
    expect(value.type).toBe("f64");
    expect(value.value).toBeCloseTo(3.14159);
  });

  it("converts string", () => {
    const result = jsToRelish("hello", RString());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ type: "string", value: "hello" });
  });
});

describe("jsToRelish Timestamp", () => {
  it("converts DateTime to Timestamp bigint", () => {
    const dt = DateTime.fromObject(
      { year: 2024, month: 1, day: 1 },
      { zone: "UTC" },
    );
    const result = jsToRelish(dt, RTimestamp());
    expect(result.isOk()).toBe(true);
    const value = result._unsafeUnwrap() as RelishTimestamp;
    expect(value.type).toBe("timestamp");
    expect(value.unixSeconds).toBe(BigInt(dt.toUnixInteger()));
  });

  it("converts DateTime.now()", () => {
    const dt = DateTime.now();
    const result = jsToRelish(dt, RTimestamp());
    expect(result.isOk()).toBe(true);
    const value = result._unsafeUnwrap() as RelishTimestamp;
    expect(value.unixSeconds).toBe(BigInt(dt.toUnixInteger()));
  });
});

describe("jsToRelish Array", () => {
  it("converts Array<number> to Relish Array", () => {
    const schema = RArray(RU32());
    const result = jsToRelish([1, 2, 3], schema);
    expect(result.isOk()).toBe(true);
    const arr = result._unsafeUnwrap() as RelishArray;
    expect(arr.type).toBe("array");
    expect(arr.elementType).toBe(TypeCode.U32);
    expect(arr.elements.length).toBe(3);
  });

  it("converts empty array", () => {
    const schema = RArray(RU32());
    const result = jsToRelish([], schema);
    expect(result.isOk()).toBe(true);
    const arr = result._unsafeUnwrap() as RelishArray;
    expect(arr.elements.length).toBe(0);
  });

  it("converts Array<string>", () => {
    const schema = RArray(RString());
    const result = jsToRelish(["foo", "bar"], schema);
    expect(result.isOk()).toBe(true);
    const arr = result._unsafeUnwrap() as RelishArray;
    expect(arr.elementType).toBe(TypeCode.String);
  });
});

describe("jsToRelish Map", () => {
  it("converts Map<number, string>", () => {
    const schema = RMap(RU32(), RString());
    const input = new Map([[1, "one"], [2, "two"]]);
    const result = jsToRelish(input, schema);
    expect(result.isOk()).toBe(true);
    const map = result._unsafeUnwrap() as RelishMap;
    expect(map.type).toBe("map");
    expect(map.keyType).toBe(TypeCode.U32);
    expect(map.valueType).toBe(TypeCode.String);
  });

  it("converts empty Map", () => {
    const schema = RMap(RString(), RU32());
    const input = new Map<string, number>();
    const result = jsToRelish(input, schema);
    expect(result.isOk()).toBe(true);
    const map = result._unsafeUnwrap() as RelishMap;
    expect(map.entries.size).toBe(0);
  });
});

describe("jsToRelish Struct", () => {
  it("converts struct with all fields", () => {
    const schema = RStruct({
      name: field(1, RString()),
      age: field(2, RU32()),
    });
    const result = jsToRelish({ name: "Alice", age: 30 }, schema);
    expect(result.isOk()).toBe(true);
    const struct = result._unsafeUnwrap() as RelishStruct;
    expect(struct.type).toBe("struct");
  });

  it("omits null optional fields", () => {
    const schema = RStruct({
      name: field(1, RString()),
      nickname: field(2, ROptional(RString())),
    });
    const result = jsToRelish({ name: "Alice", nickname: null }, schema);
    expect(result.isOk()).toBe(true);
    const struct = result._unsafeUnwrap() as RelishStruct;
    // Should have only 1 field (nickname omitted)
    expect(struct.fields.size).toBe(1);
  });

  it("includes non-null optional fields", () => {
    const schema = RStruct({
      name: field(1, RString()),
      nickname: field(2, ROptional(RString())),
    });
    const result = jsToRelish({ name: "Alice", nickname: "Ali" }, schema);
    expect(result.isOk()).toBe(true);
    const struct = result._unsafeUnwrap() as RelishStruct;
    // Should have 2 fields
    expect(struct.fields.size).toBe(2);
  });

  it("orders fields by field ID", () => {
    const schema = RStruct({
      z_last: field(10, RString()),
      a_first: field(1, RString()),
      m_middle: field(5, RU32()),
    });
    const result = jsToRelish({ z_last: "z", a_first: "a", m_middle: 5 }, schema);
    expect(result.isOk()).toBe(true);
    const struct = result._unsafeUnwrap() as RelishStruct;
    const fieldIds = Array.from(struct.fields.keys());
    expect(fieldIds).toEqual([1, 5, 10]);
  });
});

describe("jsToRelish Enum", () => {
  it("converts enum variant", () => {
    const schema = REnum({
      success: variant(1, RString()),
      failure: variant(2, RU32()),
    });
    const result = jsToRelish({ variant: "success", value: "ok" }, schema);
    expect(result.isOk()).toBe(true);
    const enumVal = result._unsafeUnwrap() as RelishEnum;
    expect(enumVal.type).toBe("enum");
    expect(enumVal.variantId).toBe(1);
  });

  it("converts different variant", () => {
    const schema = REnum({
      success: variant(1, RString()),
      failure: variant(2, RU32()),
    });
    const result = jsToRelish({ variant: "failure", value: 404 }, schema);
    expect(result.isOk()).toBe(true);
    const enumVal = result._unsafeUnwrap() as RelishEnum;
    expect(enumVal.variantId).toBe(2);
  });

  it("returns error for unknown variant", () => {
    const schema = REnum({
      success: variant(1, RString()),
    });
    const result = jsToRelish({ variant: "unknown", value: "x" }, schema);
    expect(result.isErr()).toBe(true);
  });
});

describe("decodedToTyped", () => {
  it("converts null (pass through)", () => {
    const result = decodedToTyped(null, RNull());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBeNull();
  });

  it("converts boolean (pass through)", () => {
    const result = decodedToTyped(true, RBool());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(true);
  });

  it("converts u32 (pass through)", () => {
    const result = decodedToTyped(42, RU32());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(42);
  });

  it("converts u64 bigint (pass through)", () => {
    const result = decodedToTyped(123n, RU64());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(123n);
  });

  it("converts string (pass through)", () => {
    const result = decodedToTyped("hello", RString());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe("hello");
  });

  it("converts DateTime (pass through from decoder)", () => {
    const dt = DateTime.fromSeconds(1704067200, { zone: "UTC" }); // 2024-01-01 00:00:00 UTC
    const result = decodedToTyped(dt, RTimestamp());
    expect(result.isOk()).toBe(true);
    const resultDt = result._unsafeUnwrap() as DateTime;
    expect(DateTime.isDateTime(resultDt)).toBe(true);
    expect(resultDt.toUnixInteger()).toBe(1704067200);
  });

  it("converts Array<number> (already decoded)", () => {
    const decodedArr: ReadonlyArray<number> = [1, 2, 3];
    const result = decodedToTyped(decodedArr, RArray(RU32()));
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual([1, 2, 3]);
  });

  it("converts Map<number, string> (already decoded)", () => {
    const decodedMap = new Map<number, string>([[1, "one"], [2, "two"]]);
    const result = decodedToTyped(decodedMap, RMap(RU32(), RString()));
    expect(result.isOk()).toBe(true);
    const jsMap = result._unsafeUnwrap() as Map<number, string>;
    expect(jsMap.get(1)).toBe("one");
    expect(jsMap.get(2)).toBe("two");
  });

  it("converts Struct from field IDs to property names", () => {
    const decodedStruct: Readonly<{ [fieldId: number]: unknown }> = {
      1: "Alice",
      2: 30,
    };
    const schema = RStruct({
      name: field(1, RString()),
      age: field(2, RU32()),
    });
    const result = decodedToTyped(decodedStruct, schema);
    expect(result.isOk()).toBe(true);
    const obj = result._unsafeUnwrap() as { name: string; age: number };
    expect(obj.name).toBe("Alice");
    expect(obj.age).toBe(30);
  });

  it("converts Struct with missing optional field to null", () => {
    const decodedStruct: Readonly<{ [fieldId: number]: unknown }> = {
      1: "Alice",
    };
    const schema = RStruct({
      name: field(1, RString()),
      nickname: field(2, ROptional(RString())),
    });
    const result = decodedToTyped(decodedStruct, schema);
    expect(result.isOk()).toBe(true);
    const obj = result._unsafeUnwrap() as { name: string; nickname: string | null };
    expect(obj.name).toBe("Alice");
    expect(obj.nickname).toBeNull();
  });

  it("converts Enum from variant ID to variant name", () => {
    const decodedEnum: Readonly<{ variantId: number; value: unknown }> = {
      variantId: 1,
      value: "ok",
    };
    const schema = REnum({
      success: variant(1, RString()),
      failure: variant(2, RU32()),
    });
    const result = decodedToTyped(decodedEnum, schema);
    expect(result.isOk()).toBe(true);
    const enumVal = result._unsafeUnwrap() as { variant: string; value: unknown };
    expect(enumVal.variant).toBe("success");
    expect(enumVal.value).toBe("ok");
  });
});

describe("Error factory methods", () => {
  describe("EncodeError factories", () => {
    it("creates unsupportedType encode error", () => {
      const error = EncodeError.unsupportedType("FooSchema");
      expect(error).toBeInstanceOf(EncodeError);
      expect(error.message).toContain("unsupported schema type");
      expect(error.message).toContain("FooSchema");
    });

    it("creates unknownVariant encode error", () => {
      const error = EncodeError.unknownVariant("badVariant");
      expect(error).toBeInstanceOf(EncodeError);
      expect(error.message).toContain("unknown enum variant");
      expect(error.message).toContain("badVariant");
    });
  });

  describe("DecodeError factories", () => {
    it("creates missingRequiredField decode error", () => {
      const error = DecodeError.missingRequiredField(5);
      expect(error).toBeInstanceOf(DecodeError);
      expect(error.message).toContain("missing required field");
      expect(error.message).toContain("5");
    });

    it("creates unknownVariantId decode error", () => {
      const error = DecodeError.unknownVariantId(99);
      expect(error).toBeInstanceOf(DecodeError);
      expect(error.message).toContain("unknown variant ID");
      expect(error.message).toContain("99");
    });

    it("creates unsupportedType decode error", () => {
      const error = DecodeError.unsupportedType("BarSchema");
      expect(error).toBeInstanceOf(DecodeError);
      expect(error.message).toContain("unsupported schema type");
      expect(error.message).toContain("BarSchema");
    });
  });
});
