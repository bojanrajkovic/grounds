// pattern: Functional Core
import { describe, it, expect } from "vitest";
import {
  RNull,
  RBool,
  RU8,
  RU64,
  RI32,
  RF64,
  RString,
  RArray,
  RMap,
  ROptional,
  RTimestamp,
} from "../src/types.js";
import { RelishTypeCode } from "../src/symbols.js";
import { TypeCode } from "@grounds/core";
import type { Static } from "@sinclair/typebox";
import { DateTime } from "luxon";

describe("Primitive Schema Types", () => {
  describe("RNull", () => {
    it("has correct type code", () => {
      const schema = RNull();
      expect(schema[RelishTypeCode]).toBe(TypeCode.Null);
    });

    it("infers null type", () => {
      const schema = RNull();
      type Inferred = Static<typeof schema>;
      const value: Inferred = null;
      expect(value).toBeNull();
    });
  });

  describe("RBool", () => {
    it("has correct type code", () => {
      const schema = RBool();
      expect(schema[RelishTypeCode]).toBe(TypeCode.Bool);
    });

    it("infers boolean type", () => {
      const schema = RBool();
      type Inferred = Static<typeof schema>;
      const value: Inferred = true;
      expect(typeof value).toBe("boolean");
    });
  });

  describe("RU8", () => {
    it("has correct type code", () => {
      const schema = RU8();
      expect(schema[RelishTypeCode]).toBe(TypeCode.U8);
    });

    it("infers number type", () => {
      const schema = RU8();
      type Inferred = Static<typeof schema>;
      const value: Inferred = 255;
      expect(typeof value).toBe("number");
    });
  });

  describe("RU64", () => {
    it("has correct type code", () => {
      const schema = RU64();
      expect(schema[RelishTypeCode]).toBe(TypeCode.U64);
    });

    it("infers bigint type", () => {
      const schema = RU64();
      type Inferred = Static<typeof schema>;
      const value: Inferred = 123n;
      expect(typeof value).toBe("bigint");
    });
  });

  describe("RI32", () => {
    it("has correct type code", () => {
      const schema = RI32();
      expect(schema[RelishTypeCode]).toBe(TypeCode.I32);
    });
  });

  describe("RF64", () => {
    it("has correct type code", () => {
      const schema = RF64();
      expect(schema[RelishTypeCode]).toBe(TypeCode.F64);
    });

    it("infers number type", () => {
      const schema = RF64();
      type Inferred = Static<typeof schema>;
      const value: Inferred = 3.14159;
      expect(typeof value).toBe("number");
    });
  });
});

describe("Collection Schema Types", () => {
  describe("RString", () => {
    it("has correct type code", () => {
      const schema = RString();
      expect(schema[RelishTypeCode]).toBe(TypeCode.String);
    });

    it("infers string type", () => {
      const schema = RString();
      type Inferred = Static<typeof schema>;
      const value: Inferred = "hello";
      expect(typeof value).toBe("string");
    });
  });

  describe("RArray", () => {
    it("has correct type code", () => {
      const schema = RArray(RU8());
      expect(schema[RelishTypeCode]).toBe(TypeCode.Array);
    });

    it("infers array type", () => {
      const schema = RArray(RU8());
      type Inferred = Static<typeof schema>;
      const value: Inferred = [1, 2, 3];
      expect(Array.isArray(value)).toBe(true);
    });

    it("infers correct element type", () => {
      const schema = RArray(RString());
      type Inferred = Static<typeof schema>;
      const value: Inferred = ["a", "b"];
      expect(value[0]).toBe("a");
    });
  });

  describe("RMap", () => {
    it("has correct type code", () => {
      const schema = RMap(RString(), RU8());
      expect(schema[RelishTypeCode]).toBe(TypeCode.Map);
    });

    it("infers Map type", () => {
      const schema = RMap(RString(), RU8());
      type Inferred = Static<typeof schema>;
      const value: Inferred = new Map([["a", 1]]);
      expect(value instanceof Map).toBe(true);
    });
  });

  describe("ROptional", () => {
    it("preserves type code from wrapped schema", () => {
      const schema = ROptional(RString());
      expect(schema[RelishTypeCode]).toBe(TypeCode.String);
    });

    it("infers optional type", () => {
      const schema = ROptional(RString());
      type Inferred = Static<typeof schema>;
      const value1: Inferred = "hello";
      const value2: Inferred = null;
      expect(value1).toBe("hello");
      expect(value2).toBeNull();
    });
  });

  describe("RTimestamp", () => {
    it("has correct type code", () => {
      const schema = RTimestamp();
      expect(schema[RelishTypeCode]).toBe(TypeCode.Timestamp);
    });

    it("infers DateTime type", () => {
      const schema = RTimestamp();
      type Inferred = Static<typeof schema>;
      const value: Inferred = DateTime.now();
      expect(value instanceof DateTime).toBe(true);
    });
  });
});
