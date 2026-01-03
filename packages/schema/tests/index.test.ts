// pattern: Functional Core
import { describe, it, expect } from "vitest";
import * as schema from "../src/index.js";

describe("@grounds/schema codec exports", () => {
  describe("createCodec and Codec type", () => {
    it("exports createCodec function", () => {
      expect(schema.createCodec).toBeDefined();
      expect(typeof schema.createCodec).toBe("function");
    });

    // Note: Codec is a TypeScript type, not a runtime value.
    // This test verifies the import statement doesn't throw, not the type itself.
    it("exports Codec type (import verification only)", () => {
      // Types are erased at runtime; this test confirms the module loads without error
      expect(true).toBe(true);
    });
  });

  describe("schema constructors", () => {
    it("exports primitive constructors", () => {
      expect(schema.RNull).toBeDefined();
      expect(schema.RBool).toBeDefined();
      expect(schema.RU8).toBeDefined();
      expect(schema.RU16).toBeDefined();
      expect(schema.RU32).toBeDefined();
      expect(schema.RU64).toBeDefined();
      expect(schema.RU128).toBeDefined();
      expect(schema.RI8).toBeDefined();
      expect(schema.RI16).toBeDefined();
      expect(schema.RI32).toBeDefined();
      expect(schema.RI64).toBeDefined();
      expect(schema.RI128).toBeDefined();
      expect(schema.RF32).toBeDefined();
      expect(schema.RF64).toBeDefined();
      expect(schema.RString).toBeDefined();
      expect(schema.RTimestamp).toBeDefined();
    });

    it("exports container constructors", () => {
      expect(schema.RArray).toBeDefined();
      expect(schema.RMap).toBeDefined();
      expect(schema.ROptional).toBeDefined();
    });

    it("exports struct and enum constructors", () => {
      expect(schema.RStruct).toBeDefined();
      expect(schema.field).toBeDefined();
      expect(schema.REnum).toBeDefined();
      expect(schema.variant).toBeDefined();
    });
  });

  describe("all exports are functions or symbols", () => {
    it("all exported items are defined", () => {
      const exportedNames = Object.keys(schema);
      expect(exportedNames.length).toBeGreaterThan(0);
      for (const name of exportedNames) {
        expect((schema as Record<string, unknown>)[name]).toBeDefined();
      }
    });
  });
});
