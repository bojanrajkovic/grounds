// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { EncodeError, DecodeError } from "../src/errors.js";

describe("EncodeError", () => {
  it("creates error with message", () => {
    const error = new EncodeError("invalid value");
    expect(error.message).toBe("invalid value");
    expect(error.name).toBe("EncodeError");
    expect(error).toBeInstanceOf(Error);
  });

  it("has static factory for unsorted fields", () => {
    const error = EncodeError.unsortedFields(5, 3);
    expect(error.message).toBe(
      "struct fields must be in ascending order: field 5 followed by field 3"
    );
  });

  it("has static factory for invalid field ID", () => {
    const error = EncodeError.invalidFieldId(128);
    expect(error.message).toBe(
      "field ID 128 is invalid: bit 7 must not be set"
    );
  });

  it("has static factory for invalid type code", () => {
    const error = EncodeError.invalidTypeCode(0x80);
    expect(error.message).toBe(
      "type code 0x80 is invalid: bit 7 must not be set"
    );
  });
});

describe("DecodeError", () => {
  it("creates error with message", () => {
    const error = new DecodeError("unexpected end of input");
    expect(error.message).toBe("unexpected end of input");
    expect(error.name).toBe("DecodeError");
    expect(error).toBeInstanceOf(Error);
  });

  it("has static factory for unexpected end", () => {
    const error = DecodeError.unexpectedEnd(10, 5);
    expect(error.message).toBe("expected 10 bytes but only 5 available");
  });

  it("has static factory for unknown type code", () => {
    const error = DecodeError.unknownTypeCode(0x99);
    expect(error.message).toBe("unknown type code: 0x99");
  });

  it("has static factory for invalid type code (bit 7)", () => {
    const error = DecodeError.invalidTypeCode(0x80);
    expect(error.message).toBe(
      "type code 0x80 is invalid: bit 7 must not be set"
    );
  });

  it("has static factory for unsorted fields", () => {
    const error = DecodeError.unsortedFields(5, 3);
    expect(error.message).toBe(
      "struct fields must be in ascending order: field 5 followed by field 3"
    );
  });

  it("has static factory for duplicate map keys", () => {
    const error = DecodeError.duplicateMapKey();
    expect(error.message).toBe("map contains duplicate keys");
  });

  it("has static factory for invalid UTF-8", () => {
    const error = DecodeError.invalidUtf8();
    expect(error.message).toBe("string contains invalid UTF-8");
  });

  it("has static factory for enum length mismatch", () => {
    const error = DecodeError.enumLengthMismatch(10, 8);
    expect(error.message).toBe(
      "enum variant content length 8 does not match declared length 10"
    );
  });
});
