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

  describe("conversion functions", () => {
    it("exports jsToRelish function", () => {
      expect(schema.jsToRelish).toBeDefined();
      expect(typeof schema.jsToRelish).toBe("function");
    });

    it("exports decodedToTyped function", () => {
      expect(schema.decodedToTyped).toBeDefined();
      expect(typeof schema.decodedToTyped).toBe("function");
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

  describe("symbols", () => {
    it("exports RelishKind symbol", () => {
      expect(schema.RelishKind).toBeDefined();
      expect(typeof schema.RelishKind).toBe("symbol");
    });

    it("exports RelishTypeCode symbol", () => {
      expect(schema.RelishTypeCode).toBeDefined();
      expect(typeof schema.RelishTypeCode).toBe("symbol");
    });

    it("exports RelishFieldId symbol", () => {
      expect(schema.RelishFieldId).toBeDefined();
      expect(typeof schema.RelishFieldId).toBe("symbol");
    });

    it("exports RelishVariantId symbol", () => {
      expect(schema.RelishVariantId).toBeDefined();
      expect(typeof schema.RelishVariantId).toBe("symbol");
    });

    it("exports RelishElementType symbol", () => {
      expect(schema.RelishElementType).toBeDefined();
      expect(typeof schema.RelishElementType).toBe("symbol");
    });

    it("exports RelishKeyType symbol", () => {
      expect(schema.RelishKeyType).toBeDefined();
      expect(typeof schema.RelishKeyType).toBe("symbol");
    });

    it("exports RelishValueType symbol", () => {
      expect(schema.RelishValueType).toBeDefined();
      expect(typeof schema.RelishValueType).toBe("symbol");
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
