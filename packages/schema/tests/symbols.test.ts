// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { RelishKind, RelishTypeCode, RelishFieldId, RelishVariantId } from "../src/symbols.js";

describe("Relish Symbols", () => {
  it("exports unique symbols for metadata", () => {
    expect(typeof RelishKind).toBe("symbol");
    expect(typeof RelishTypeCode).toBe("symbol");
    expect(typeof RelishFieldId).toBe("symbol");
    expect(typeof RelishVariantId).toBe("symbol");
  });

  it("symbols are unique", () => {
    expect(RelishKind).not.toBe(RelishTypeCode);
    expect(RelishFieldId).not.toBe(RelishVariantId);
  });
});
