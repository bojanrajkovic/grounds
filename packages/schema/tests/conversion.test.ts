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
import { expectOk, expectErr, expectDateTime, expectMap } from "@grounds/test-utils";

describe("toRelish primitives", () => {
  it("converts null to bytes and round-trips", () => {
    const encoded = expectOk(toRelish(null, RNull()));
    expect(encoded).toBeInstanceOf(Uint8Array);

    const decoded = expectOk(fromRelish(encoded, RNull()));
    expect(decoded).toBeNull();
  });

  it("converts boolean true to bytes and round-trips", () => {
    const encoded = expectOk(toRelish(true, RBool()));
    expect(encoded).toBeInstanceOf(Uint8Array);

    const decoded = expectOk(fromRelish(encoded, RBool()));
    expect(decoded).toBe(true);
  });

  it("converts boolean false to bytes and round-trips", () => {
    const encoded = expectOk(toRelish(false, RBool()));

    const decoded = expectOk(fromRelish(encoded, RBool()));
    expect(decoded).toBe(false);
  });

  it("converts u8 to bytes and round-trips", () => {
    const encoded = expectOk(toRelish(42, RU8()));

    const decoded = expectOk(fromRelish(encoded, RU8()));
    expect(decoded).toBe(42);
  });

  it("converts u32 to bytes and round-trips", () => {
    const encoded = expectOk(toRelish(123456, RU32()));

    const decoded = expectOk(fromRelish(encoded, RU32()));
    expect(decoded).toBe(123456);
  });

  it("converts u64 bigint to bytes and round-trips", () => {
    const encoded = expectOk(toRelish(123n, RU64()));

    const decoded = expectOk(fromRelish(encoded, RU64()));
    expect(decoded).toBe(123n);
  });

  it("converts i32 to bytes and round-trips", () => {
    const encoded = expectOk(toRelish(-100, RI32()));

    const decoded = expectOk(fromRelish(encoded, RI32()));
    expect(decoded).toBe(-100);
  });

  it("converts f64 to bytes and round-trips", () => {
    const original = 3.14159;
    const encoded = expectOk(toRelish(original, RF64()));

    const decoded = expectOk(fromRelish(encoded, RF64()));
    expect(decoded).toBeCloseTo(original);
  });

  it("converts string to bytes and round-trips", () => {
    const encoded = expectOk(toRelish("hello", RString()));

    const decoded = expectOk(fromRelish(encoded, RString()));
    expect(decoded).toBe("hello");
  });
});

describe("toRelish Timestamp", () => {
  it("converts DateTime to timestamp bytes and round-trips", () => {
    const dt = DateTime.fromObject(
      { year: 2024, month: 1, day: 1 },
      { zone: "UTC" },
    );
    const encoded = expectOk(toRelish(dt, RTimestamp()));
    expect(encoded).toBeInstanceOf(Uint8Array);

    const resultDt = expectOk(fromRelish(encoded, RTimestamp()));
    expectDateTime(resultDt);
    expect(resultDt.toUnixInteger()).toBe(dt.toUnixInteger());
  });

  it("converts DateTime.now() and round-trips", () => {
    const dt = DateTime.now();
    const encoded = expectOk(toRelish(dt, RTimestamp()));

    const resultDt = expectOk(fromRelish(encoded, RTimestamp()));
    expectDateTime(resultDt);
    expect(resultDt.toUnixInteger()).toBe(dt.toUnixInteger());
  });
});

describe("toRelish Array", () => {
  it("converts Array<number> to bytes and round-trips", () => {
    const schema = RArray(RU32());
    const original = [1, 2, 3];
    const encoded = expectOk(toRelish(original, schema));
    expect(encoded).toBeInstanceOf(Uint8Array);

    const decoded = expectOk(fromRelish(encoded, schema));
    expect(decoded).toEqual(original);
  });

  it("converts empty array to bytes and round-trips", () => {
    const schema = RArray(RU32());
    const encoded = expectOk(toRelish([], schema));

    const decoded = expectOk(fromRelish(encoded, schema));
    expect(decoded).toEqual([]);
  });

  it("converts Array<string> to bytes and round-trips", () => {
    const schema = RArray(RString());
    const original = ["foo", "bar"];
    const encoded = expectOk(toRelish(original, schema));

    const decoded = expectOk(fromRelish(encoded, schema));
    expect(decoded).toEqual(original);
  });
});

describe("toRelish Map", () => {
  it("converts Map<number, string> to bytes and round-trips", () => {
    const schema = RMap(RU32(), RString());
    const original = new Map([[1, "one"], [2, "two"]]);
    const encoded = expectOk(toRelish(original, schema));
    expect(encoded).toBeInstanceOf(Uint8Array);

    const map = expectOk(fromRelish(encoded, schema));
    expectMap<number, string>(map);
    expect(map.get(1)).toBe("one");
    expect(map.get(2)).toBe("two");
  });

  it("converts empty Map to bytes and round-trips", () => {
    const schema = RMap(RString(), RU32());
    const original = new Map<string, number>();
    const encoded = expectOk(toRelish(original, schema));

    const map = expectOk(fromRelish(encoded, schema));
    expectMap<string, number>(map);
    expect(map.size).toBe(0);
  });
});

describe("toRelish Struct", () => {
  it("converts struct with all fields to bytes and round-trips", () => {
    const schema = RStruct({
      name: field(1, RString()),
      age: field(2, RU32()),
    });
    const original = { name: "Alice", age: 30 };
    const encoded = expectOk(toRelish(original, schema));
    expect(encoded).toBeInstanceOf(Uint8Array);

    const obj = expectOk(fromRelish(encoded, schema));
    expect(obj.name).toBe("Alice");
    expect(obj.age).toBe(30);
  });

  it("omits null optional fields in encoding and restores on decode", () => {
    const schema = RStruct({
      name: field(1, RString()),
      nickname: field(2, ROptional(RString())),
    });
    const original = { name: "Alice", nickname: null };
    const encoded = expectOk(toRelish(original, schema));

    const obj = expectOk(fromRelish(encoded, schema));
    expect(obj.name).toBe("Alice");
    expect(obj.nickname).toBeNull();
  });

  it("includes non-null optional fields and round-trips", () => {
    const schema = RStruct({
      name: field(1, RString()),
      nickname: field(2, ROptional(RString())),
    });
    const original = { name: "Alice", nickname: "Ali" };
    const encoded = expectOk(toRelish(original, schema));

    const obj = expectOk(fromRelish(encoded, schema));
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
    const encoded = expectOk(toRelish(original, schema));

    const obj = expectOk(fromRelish(encoded, schema));
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
    const encoded = expectOk(toRelish(original, schema));
    expect(encoded).toBeInstanceOf(Uint8Array);

    const enumVal = expectOk(fromRelish(encoded, schema));
    expect(enumVal.variant).toBe("success");
    expect(enumVal.value).toBe("ok");
  });

  it("converts different variant to bytes and round-trips", () => {
    const schema = REnum({
      success: variant(1, RString()),
      failure: variant(2, RU32()),
    });
    const original = { variant: "failure", value: 404 };
    const encoded = expectOk(toRelish(original, schema));

    const enumVal = expectOk(fromRelish(encoded, schema));
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
    const bytes = expectOk(codec.encode(null));

    // Now decode using fromRelish
    const result = expectOk(fromRelish(bytes, RNull()));
    expect(result).toBeNull();
  });

  it("converts boolean from bytes", () => {
    const codec = createCodec(RBool());
    const encoded = expectOk(codec.encode(true));

    const result = expectOk(fromRelish(encoded, RBool()));
    expect(result).toBe(true);
  });

  it("converts u32 from bytes", () => {
    const codec = createCodec(RU32());
    const encoded = expectOk(codec.encode(42));

    const result = expectOk(fromRelish(encoded, RU32()));
    expect(result).toBe(42);
  });

  it("converts u64 bigint from bytes", () => {
    const codec = createCodec(RU64());
    const encoded = expectOk(codec.encode(123n));

    const result = expectOk(fromRelish(encoded, RU64()));
    expect(result).toBe(123n);
  });

  it("converts string from bytes", () => {
    const codec = createCodec(RString());
    const encoded = expectOk(codec.encode("hello"));

    const result = expectOk(fromRelish(encoded, RString()));
    expect(result).toBe("hello");
  });

  it("converts DateTime from bytes", () => {
    const dt = DateTime.fromSeconds(1704067200, { zone: "UTC" }); // 2024-01-01 00:00:00 UTC
    const codec = createCodec(RTimestamp());
    const encoded = expectOk(codec.encode(dt));

    const resultDt = expectOk(fromRelish(encoded, RTimestamp()));
    expectDateTime(resultDt);
    expect(resultDt.toUnixInteger()).toBe(1704067200);
  });

  it("converts Array<number> from bytes", () => {
    const schema = RArray(RU32());
    const codec = createCodec(schema);
    const encoded = expectOk(codec.encode([1, 2, 3]));

    const result = expectOk(fromRelish(encoded, schema));
    expect(result).toEqual([1, 2, 3]);
  });

  it("converts Map<number, string> from bytes", () => {
    const schema = RMap(RU32(), RString());
    const codec = createCodec(schema);
    const map = new Map([[1, "one"], [2, "two"]]);
    const encoded = expectOk(codec.encode(map));

    const jsMap = expectOk(fromRelish(encoded, schema));
    expectMap<number, string>(jsMap);
    expect(jsMap.get(1)).toBe("one");
    expect(jsMap.get(2)).toBe("two");
  });

  it("converts Struct from bytes", () => {
    const schema = RStruct({
      name: field(1, RString()),
      age: field(2, RU32()),
    });
    const codec = createCodec(schema);
    const encoded = expectOk(codec.encode({ name: "Alice", age: 30 }));

    const obj = expectOk(fromRelish(encoded, schema));
    expect(obj.name).toBe("Alice");
    expect(obj.age).toBe(30);
  });

  it("converts Struct with missing optional field to null from bytes", () => {
    const schema = RStruct({
      name: field(1, RString()),
      nickname: field(2, ROptional(RString())),
    });
    const codec = createCodec(schema);
    const encoded = expectOk(codec.encode({ name: "Alice", nickname: null }));

    const obj = expectOk(fromRelish(encoded, schema));
    expect(obj.name).toBe("Alice");
    expect(obj.nickname).toBeNull();
  });

  it("converts Enum from bytes", () => {
    const schema = REnum({
      success: variant(1, RString()),
      failure: variant(2, RU32()),
    });
    const codec = createCodec(schema);
    const encoded = expectOk(codec.encode({ variant: "success", value: "ok" }));

    const enumVal = expectOk(fromRelish(encoded, schema));
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
