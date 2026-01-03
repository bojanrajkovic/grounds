// pattern: Functional Core
import { describe, it, expect } from "vitest";
import {
  RelishKind,
  RelishTypeCode,
  RelishFieldId,
  RelishVariantId,
  RelishElementType,
  RelishKeyType,
  RelishValueType,
} from "../src/symbols.js";

describe("Relish Symbols", () => {
  it("exports unique symbols for metadata", () => {
    expect(typeof RelishKind).toBe("symbol");
    expect(typeof RelishTypeCode).toBe("symbol");
    expect(typeof RelishFieldId).toBe("symbol");
    expect(typeof RelishVariantId).toBe("symbol");
    expect(typeof RelishElementType).toBe("symbol");
    expect(typeof RelishKeyType).toBe("symbol");
    expect(typeof RelishValueType).toBe("symbol");
  });

  it("symbols are unique", () => {
    const allSymbols = [
      RelishKind,
      RelishTypeCode,
      RelishFieldId,
      RelishVariantId,
      RelishElementType,
      RelishKeyType,
      RelishValueType,
    ];
    const uniqueSymbols = new Set(allSymbols);
    expect(uniqueSymbols.size).toBe(allSymbols.length);
  });
});
