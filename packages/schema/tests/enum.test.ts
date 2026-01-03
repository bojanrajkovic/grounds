// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { variant, REnum, RString, RU8, RU32 } from "../src/index.js";
import { RelishTypeCode } from "../src/symbols.js";
import { TypeCode } from "@grounds/core";
import type { Static } from "@sinclair/typebox";

describe("REnum", () => {
  describe("variant helper", () => {
    it("creates a variant schema with correct ID", () => {
      const variantSchema = variant(1, RString());
      expect(variantSchema.variantId).toBe(1);
    });

    it("preserves inner schema properties", () => {
      const variantSchema = variant(2, RU8());
      expect(variantSchema[RelishTypeCode]).toBe(TypeCode.U8);
    });
  });

  describe("REnum constructor", () => {
    it("creates an enum schema with correct type code", () => {
      const schema = REnum({
        active: variant(1, RU8()),
        inactive: variant(2, RString()),
      });
      expect(schema[RelishTypeCode]).toBe(TypeCode.Enum);
    });

    it("infers correct unwrapped union type", () => {
      const schema = REnum({
        success: variant(1, RString()),
        error: variant(2, RU32()),
      });
      // Static infers string | number (unwrapped variant types)
      type Inferred = Static<typeof schema>;
      const value1: Inferred = "ok";
      const value2: Inferred = 500;
      expect(value1).toBe("ok");
      expect(value2).toBe(500);
    });

    it("supports multiple variants with unwrapped types", () => {
      const schema = REnum({
        pending: variant(1, RU8()),
        active: variant(2, RString()),
        complete: variant(3, RU32()),
      });
      // Static infers number | string | number (simplified to string | number)
      type Inferred = Static<typeof schema>;
      const value1: Inferred = 0;
      const value2: Inferred = "running";
      const value3: Inferred = 100;
      expect(value1).toBe(0);
      expect(value2).toBe("running");
      expect(value3).toBe(100);
    });
  });
});
