// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { field, RStruct, RString, RU8 } from "../src/index.js";
import { RelishTypeCode } from "../src/symbols.js";
import { TypeCode } from "@grounds/core";
import type { Static } from "@sinclair/typebox";

describe("RStruct", () => {
  describe("field helper", () => {
    it("creates a field schema with correct ID", () => {
      const fieldSchema = field(1, RString());
      expect(fieldSchema.fieldId).toBe(1);
    });

    it("preserves inner schema properties", () => {
      const fieldSchema = field(2, RU8());
      expect(fieldSchema[RelishTypeCode]).toBe(TypeCode.U8);
    });
  });

  describe("RStruct constructor", () => {
    it("creates a struct schema with correct type code", () => {
      const schema = RStruct({
        name: field(1, RString()),
        age: field(2, RU8()),
      });
      expect(schema[RelishTypeCode]).toBe(TypeCode.Struct);
    });

    it("infers correct object type", () => {
      const schema = RStruct({
        name: field(1, RString()),
        age: field(2, RU8()),
      });
      type Inferred = Static<typeof schema>;
      const value: Inferred = { name: "Alice", age: 30 };
      expect(value.name).toBe("Alice");
      expect(value.age).toBe(30);
    });

    it("supports multiple fields", () => {
      const schema = RStruct({
        id: field(1, RString()),
        count: field(2, RU8()),
        label: field(3, RString()),
      });
      type Inferred = Static<typeof schema>;
      const value: Inferred = { id: "x", count: 5, label: "test" };
      expect(Object.keys(value)).toHaveLength(3);
    });
  });
});
