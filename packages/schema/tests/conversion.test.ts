// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { jsToRelish } from "../src/convert.js";
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
import { TypeCode, type RelishArray, type RelishTimestamp, type RelishF64 } from "@grounds/core";
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
    const map = result._unsafeUnwrap() as any;
    expect(map.type).toBe("map");
    expect(map.keyType).toBe(TypeCode.U32);
    expect(map.valueType).toBe(TypeCode.String);
  });

  it("converts empty Map", () => {
    const schema = RMap(RString(), RU32());
    const input = new Map<string, number>();
    const result = jsToRelish(input, schema);
    expect(result.isOk()).toBe(true);
    const map = result._unsafeUnwrap() as any;
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
    const struct = result._unsafeUnwrap() as any;
    expect(struct.type).toBe("struct");
  });

  it("omits null optional fields", () => {
    const schema = RStruct({
      name: field(1, RString()),
      nickname: field(2, ROptional(RString())),
    });
    const result = jsToRelish({ name: "Alice", nickname: null }, schema);
    expect(result.isOk()).toBe(true);
    const struct = result._unsafeUnwrap() as any;
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
    const struct = result._unsafeUnwrap() as any;
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
    const struct = result._unsafeUnwrap() as any;
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
    const enumVal = result._unsafeUnwrap() as any;
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
    const enumVal = result._unsafeUnwrap() as any;
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
