// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { toRelish, fromRelish } from "../src/convert.js";
import { createCodec } from "../src/codec.js";
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
  EncodeError,
  DecodeError,
} from "@grounds/core";
import { DateTime } from "luxon";

describe("toRelish primitives", () => {
  it("converts null to bytes and round-trips", () => {
    const bytes = toRelish(null, RNull());
    expect(bytes.isOk()).toBe(true);
    const encoded = bytes._unsafeUnwrap();
    expect(encoded).toBeInstanceOf(Uint8Array);

    const decoded = fromRelish(encoded, RNull());
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toBeNull();
  });

  it("converts boolean true to bytes and round-trips", () => {
    const bytes = toRelish(true, RBool());
    expect(bytes.isOk()).toBe(true);
    const encoded = bytes._unsafeUnwrap();
    expect(encoded).toBeInstanceOf(Uint8Array);

    const decoded = fromRelish(encoded, RBool());
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toBe(true);
  });

  it("converts boolean false to bytes and round-trips", () => {
    const bytes = toRelish(false, RBool());
    expect(bytes.isOk()).toBe(true);

    const decoded = fromRelish(bytes._unsafeUnwrap(), RBool());
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toBe(false);
  });

  it("converts u8 to bytes and round-trips", () => {
    const bytes = toRelish(42, RU8());
    expect(bytes.isOk()).toBe(true);

    const decoded = fromRelish(bytes._unsafeUnwrap(), RU8());
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toBe(42);
  });

  it("converts u32 to bytes and round-trips", () => {
    const bytes = toRelish(123456, RU32());
    expect(bytes.isOk()).toBe(true);

    const decoded = fromRelish(bytes._unsafeUnwrap(), RU32());
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toBe(123456);
  });

  it("converts u64 bigint to bytes and round-trips", () => {
    const bytes = toRelish(123n, RU64());
    expect(bytes.isOk()).toBe(true);

    const decoded = fromRelish(bytes._unsafeUnwrap(), RU64());
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toBe(123n);
  });

  it("converts i32 to bytes and round-trips", () => {
    const bytes = toRelish(-100, RI32());
    expect(bytes.isOk()).toBe(true);

    const decoded = fromRelish(bytes._unsafeUnwrap(), RI32());
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toBe(-100);
  });

  it("converts f64 to bytes and round-trips", () => {
    const original = 3.14159;
    const bytes = toRelish(original, RF64());
    expect(bytes.isOk()).toBe(true);

    const decoded = fromRelish(bytes._unsafeUnwrap(), RF64());
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toBeCloseTo(original);
  });

  it("converts string to bytes and round-trips", () => {
    const bytes = toRelish("hello", RString());
    expect(bytes.isOk()).toBe(true);

    const decoded = fromRelish(bytes._unsafeUnwrap(), RString());
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toBe("hello");
  });
});

describe("toRelish Timestamp", () => {
  it("converts DateTime to timestamp bytes and round-trips", () => {
    const dt = DateTime.fromObject(
      { year: 2024, month: 1, day: 1 },
      { zone: "UTC" },
    );
    const bytes = toRelish(dt, RTimestamp());
    expect(bytes.isOk()).toBe(true);
    expect(bytes._unsafeUnwrap()).toBeInstanceOf(Uint8Array);

    const decoded = fromRelish(bytes._unsafeUnwrap(), RTimestamp());
    expect(decoded.isOk()).toBe(true);
    const resultDt = decoded._unsafeUnwrap() as DateTime;
    expect(resultDt.toUnixInteger()).toBe(dt.toUnixInteger());
  });

  it("converts DateTime.now() and round-trips", () => {
    const dt = DateTime.now();
    const bytes = toRelish(dt, RTimestamp());
    expect(bytes.isOk()).toBe(true);

    const decoded = fromRelish(bytes._unsafeUnwrap(), RTimestamp());
    expect(decoded.isOk()).toBe(true);
    const resultDt = decoded._unsafeUnwrap() as DateTime;
    expect(resultDt.toUnixInteger()).toBe(dt.toUnixInteger());
  });
});

describe("toRelish Array", () => {
  it("converts Array<number> to bytes and round-trips", () => {
    const schema = RArray(RU32());
    const original = [1, 2, 3];
    const bytes = toRelish(original, schema);
    expect(bytes.isOk()).toBe(true);
    expect(bytes._unsafeUnwrap()).toBeInstanceOf(Uint8Array);

    const decoded = fromRelish(bytes._unsafeUnwrap(), schema);
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toEqual(original);
  });

  it("converts empty array to bytes and round-trips", () => {
    const schema = RArray(RU32());
    const bytes = toRelish([], schema);
    expect(bytes.isOk()).toBe(true);

    const decoded = fromRelish(bytes._unsafeUnwrap(), schema);
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toEqual([]);
  });

  it("converts Array<string> to bytes and round-trips", () => {
    const schema = RArray(RString());
    const original = ["foo", "bar"];
    const bytes = toRelish(original, schema);
    expect(bytes.isOk()).toBe(true);

    const decoded = fromRelish(bytes._unsafeUnwrap(), schema);
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toEqual(original);
  });
});

describe("toRelish Map", () => {
  it("converts Map<number, string> to bytes and round-trips", () => {
    const schema = RMap(RU32(), RString());
    const original = new Map([[1, "one"], [2, "two"]]);
    const bytes = toRelish(original, schema);
    expect(bytes.isOk()).toBe(true);
    expect(bytes._unsafeUnwrap()).toBeInstanceOf(Uint8Array);

    const decoded = fromRelish(bytes._unsafeUnwrap(), schema);
    expect(decoded.isOk()).toBe(true);
    const map = decoded._unsafeUnwrap() as Map<number, string>;
    expect(map.get(1)).toBe("one");
    expect(map.get(2)).toBe("two");
  });

  it("converts empty Map to bytes and round-trips", () => {
    const schema = RMap(RString(), RU32());
    const original = new Map<string, number>();
    const bytes = toRelish(original, schema);
    expect(bytes.isOk()).toBe(true);

    const decoded = fromRelish(bytes._unsafeUnwrap(), schema);
    expect(decoded.isOk()).toBe(true);
    expect((decoded._unsafeUnwrap() as Map<string, number>).size).toBe(0);
  });
});

describe("toRelish Struct", () => {
  it("converts struct with all fields to bytes and round-trips", () => {
    const schema = RStruct({
      name: field(1, RString()),
      age: field(2, RU32()),
    });
    const original = { name: "Alice", age: 30 };
    const bytes = toRelish(original, schema);
    expect(bytes.isOk()).toBe(true);
    expect(bytes._unsafeUnwrap()).toBeInstanceOf(Uint8Array);

    const decoded = fromRelish(bytes._unsafeUnwrap(), schema);
    expect(decoded.isOk()).toBe(true);
    const obj = decoded._unsafeUnwrap() as { name: string; age: number };
    expect(obj.name).toBe("Alice");
    expect(obj.age).toBe(30);
  });

  it("omits null optional fields in encoding and restores on decode", () => {
    const schema = RStruct({
      name: field(1, RString()),
      nickname: field(2, ROptional(RString())),
    });
    const original = { name: "Alice", nickname: null };
    const bytes = toRelish(original, schema);
    expect(bytes.isOk()).toBe(true);

    const decoded = fromRelish(bytes._unsafeUnwrap(), schema);
    expect(decoded.isOk()).toBe(true);
    const obj = decoded._unsafeUnwrap() as { name: string; nickname: string | null };
    expect(obj.name).toBe("Alice");
    expect(obj.nickname).toBeNull();
  });

  it("includes non-null optional fields and round-trips", () => {
    const schema = RStruct({
      name: field(1, RString()),
      nickname: field(2, ROptional(RString())),
    });
    const original = { name: "Alice", nickname: "Ali" };
    const bytes = toRelish(original, schema);
    expect(bytes.isOk()).toBe(true);

    const decoded = fromRelish(bytes._unsafeUnwrap(), schema);
    expect(decoded.isOk()).toBe(true);
    const obj = decoded._unsafeUnwrap() as { name: string; nickname: string | null };
    expect(obj.name).toBe("Alice");
    expect(obj.nickname).toBe("Ali");
  });

  it("orders fields by field ID internally and round-trips correctly", () => {
    const schema = RStruct({
      z_last: field(10, RString()),
      a_first: field(1, RString()),
      m_middle: field(5, RU32()),
    });
    const original = { z_last: "z", a_first: "a", m_middle: 5 };
    const bytes = toRelish(original, schema);
    expect(bytes.isOk()).toBe(true);

    const decoded = fromRelish(bytes._unsafeUnwrap(), schema);
    expect(decoded.isOk()).toBe(true);
    const obj = decoded._unsafeUnwrap() as { z_last: string; a_first: string; m_middle: number };
    expect(obj.z_last).toBe("z");
    expect(obj.a_first).toBe("a");
    expect(obj.m_middle).toBe(5);
  });
});

describe("toRelish Enum", () => {
  it("converts enum variant to bytes and round-trips", () => {
    const schema = REnum({
      success: variant(1, RString()),
      failure: variant(2, RU32()),
    });
    const original = { variant: "success", value: "ok" };
    const bytes = toRelish(original, schema);
    expect(bytes.isOk()).toBe(true);
    expect(bytes._unsafeUnwrap()).toBeInstanceOf(Uint8Array);

    const decoded = fromRelish(bytes._unsafeUnwrap(), schema);
    expect(decoded.isOk()).toBe(true);
    const enumVal = decoded._unsafeUnwrap() as { variant: string; value: unknown };
    expect(enumVal.variant).toBe("success");
    expect(enumVal.value).toBe("ok");
  });

  it("converts different variant to bytes and round-trips", () => {
    const schema = REnum({
      success: variant(1, RString()),
      failure: variant(2, RU32()),
    });
    const original = { variant: "failure", value: 404 };
    const bytes = toRelish(original, schema);
    expect(bytes.isOk()).toBe(true);

    const decoded = fromRelish(bytes._unsafeUnwrap(), schema);
    expect(decoded.isOk()).toBe(true);
    const enumVal = decoded._unsafeUnwrap() as { variant: string; value: unknown };
    expect(enumVal.variant).toBe("failure");
    expect(enumVal.value).toBe(404);
  });

  it("returns error for unknown variant", () => {
    const schema = REnum({
      success: variant(1, RString()),
    });
    const result = toRelish({ variant: "unknown", value: "x" }, schema);
    expect(result.isErr()).toBe(true);
  });
});

describe("fromRelish", () => {
  it("converts null from bytes", () => {
    // Get the codec to properly encode
    const codec = createCodec(RNull());
    const encoded = codec.encode(null);
    expect(encoded.isOk()).toBe(true);
    const bytes = encoded._unsafeUnwrap();

    // Now decode using fromRelish
    const result = fromRelish(bytes, RNull());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBeNull();
  });

  it("converts boolean from bytes", () => {
    const codec = createCodec(RBool());
    const encoded = codec.encode(true);
    expect(encoded.isOk()).toBe(true);

    const result = fromRelish(encoded._unsafeUnwrap(), RBool());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(true);
  });

  it("converts u32 from bytes", () => {
    const codec = createCodec(RU32());
    const encoded = codec.encode(42);
    expect(encoded.isOk()).toBe(true);

    const result = fromRelish(encoded._unsafeUnwrap(), RU32());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(42);
  });

  it("converts u64 bigint from bytes", () => {
    const codec = createCodec(RU64());
    const encoded = codec.encode(123n);
    expect(encoded.isOk()).toBe(true);

    const result = fromRelish(encoded._unsafeUnwrap(), RU64());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(123n);
  });

  it("converts string from bytes", () => {
    const codec = createCodec(RString());
    const encoded = codec.encode("hello");
    expect(encoded.isOk()).toBe(true);

    const result = fromRelish(encoded._unsafeUnwrap(), RString());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe("hello");
  });

  it("converts DateTime from bytes", () => {
    const dt = DateTime.fromSeconds(1704067200, { zone: "UTC" }); // 2024-01-01 00:00:00 UTC
    const codec = createCodec(RTimestamp());
    const encoded = codec.encode(dt);
    expect(encoded.isOk()).toBe(true);

    const result = fromRelish(encoded._unsafeUnwrap(), RTimestamp());
    expect(result.isOk()).toBe(true);
    const resultDt = result._unsafeUnwrap() as DateTime;
    expect(DateTime.isDateTime(resultDt)).toBe(true);
    expect(resultDt.toUnixInteger()).toBe(1704067200);
  });

  it("converts Array<number> from bytes", () => {
    const schema = RArray(RU32());
    const codec = createCodec(schema);
    const encoded = codec.encode([1, 2, 3]);
    expect(encoded.isOk()).toBe(true);

    const result = fromRelish(encoded._unsafeUnwrap(), schema);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual([1, 2, 3]);
  });

  it("converts Map<number, string> from bytes", () => {
    const schema = RMap(RU32(), RString());
    const codec = createCodec(schema);
    const map = new Map([[1, "one"], [2, "two"]]);
    const encoded = codec.encode(map);
    expect(encoded.isOk()).toBe(true);

    const result = fromRelish(encoded._unsafeUnwrap(), schema);
    expect(result.isOk()).toBe(true);
    const jsMap = result._unsafeUnwrap() as Map<number, string>;
    expect(jsMap.get(1)).toBe("one");
    expect(jsMap.get(2)).toBe("two");
  });

  it("converts Struct from bytes", () => {
    const schema = RStruct({
      name: field(1, RString()),
      age: field(2, RU32()),
    });
    const codec = createCodec(schema);
    const encoded = codec.encode({ name: "Alice", age: 30 });
    expect(encoded.isOk()).toBe(true);

    const result = fromRelish(encoded._unsafeUnwrap(), schema);
    expect(result.isOk()).toBe(true);
    const obj = result._unsafeUnwrap() as { name: string; age: number };
    expect(obj.name).toBe("Alice");
    expect(obj.age).toBe(30);
  });

  it("converts Struct with missing optional field to null from bytes", () => {
    const schema = RStruct({
      name: field(1, RString()),
      nickname: field(2, ROptional(RString())),
    });
    const codec = createCodec(schema);
    const encoded = codec.encode({ name: "Alice", nickname: null });
    expect(encoded.isOk()).toBe(true);

    const result = fromRelish(encoded._unsafeUnwrap(), schema);
    expect(result.isOk()).toBe(true);
    const obj = result._unsafeUnwrap() as { name: string; nickname: string | null };
    expect(obj.name).toBe("Alice");
    expect(obj.nickname).toBeNull();
  });

  it("converts Enum from bytes", () => {
    const schema = REnum({
      success: variant(1, RString()),
      failure: variant(2, RU32()),
    });
    const codec = createCodec(schema);
    const encoded = codec.encode({ variant: "success", value: "ok" });
    expect(encoded.isOk()).toBe(true);

    const result = fromRelish(encoded._unsafeUnwrap(), schema);
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
