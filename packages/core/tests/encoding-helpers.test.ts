// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { encodeTaggedVarint, getTypeCodeForValue } from "../src/encoding-helpers.js";
import { TypeCode } from "../src/types.js";
import { U32, String_, Null, Bool } from "../src/values.js";

describe("encodeTaggedVarint", () => {
  it("encodes lengths 0-127 as single byte (length << 1)", () => {
    expect(encodeTaggedVarint(0)).toEqual(new Uint8Array([0x00]));
    expect(encodeTaggedVarint(5)).toEqual(new Uint8Array([0x0a])); // 5 << 1 = 10
    expect(encodeTaggedVarint(14)).toEqual(new Uint8Array([0x1c])); // 14 << 1 = 28
    expect(encodeTaggedVarint(127)).toEqual(new Uint8Array([0xfe])); // 127 << 1 = 254
  });

  it("encodes lengths >= 128 as 4 bytes little-endian with LSB=1", () => {
    // length 128: (128 << 1) | 1 = 257 = 0x101
    expect(encodeTaggedVarint(128)).toEqual(new Uint8Array([0x01, 0x01, 0x00, 0x00]));
    // length 1000: (1000 << 1) | 1 = 2001 = 0x7D1
    expect(encodeTaggedVarint(1000)).toEqual(new Uint8Array([0xd1, 0x07, 0x00, 0x00]));
  });
});

describe("getTypeCodeForValue", () => {
  it("returns correct type code for each value type", () => {
    expect(getTypeCodeForValue(Null)).toBe(TypeCode.Null);
    expect(getTypeCodeForValue(Bool(true))).toBe(TypeCode.Bool);
    expect(getTypeCodeForValue(U32(42))).toBe(TypeCode.U32);
    expect(getTypeCodeForValue(String_("hello"))).toBe(TypeCode.String);
  });
});
