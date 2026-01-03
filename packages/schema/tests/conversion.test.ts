// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { jsToRelish } from "../src/convert.js";
import { RNull, RBool, RU8, RU32, RU64, RI32, RF64, RString } from "../src/types.js";

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
    const value = result._unsafeUnwrap();
    expect(value.type).toBe("f64");
    expect((value as { value: number }).value).toBeCloseTo(3.14159);
  });

  it("converts string", () => {
    const result = jsToRelish("hello", RString());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ type: "string", value: "hello" });
  });
});
