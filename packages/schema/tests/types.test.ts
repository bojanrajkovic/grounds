// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { RNull, RBool, RU8, RU64, RI32, RF64 } from "../src/types.js";
import { RelishTypeCode } from "../src/symbols.js";
import { TypeCode } from "@grounds/core";
import type { Static } from "@sinclair/typebox";

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
