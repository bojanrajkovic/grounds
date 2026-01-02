// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { encode } from "../src/encoder.js";
import {
  Null,
  Bool,
  U8,
  U16,
  U32,
  U64,
  U128,
  I8,
  I16,
  I32,
  I64,
  I128,
  F32,
  F64,
  String_,
  Timestamp,
} from "../src/values.js";
import { TypeCode } from "../src/types.js";

describe("encode primitives (Rust test vectors)", () => {
  describe("Null", () => {
    it("encodes as single type byte", () => {
      const result = encode(Null);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(new Uint8Array([TypeCode.Null]));
    });
  });

  describe("Bool", () => {
    // From Rust: true = 0xFF, false = 0x00
    it("encodes true as type byte + 0xFF", () => {
      const result = encode(Bool(true));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(
        new Uint8Array([TypeCode.Bool, 0xff])
      );
    });

    it("encodes false as type byte + 0x00", () => {
      const result = encode(Bool(false));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(
        new Uint8Array([TypeCode.Bool, 0x00])
      );
    });
  });

  describe("unsigned integers (little-endian)", () => {
    // From Rust: u8(42) = [0x02, 0x2A]
    it("encodes u8(42)", () => {
      const result = encode(U8(42));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(
        new Uint8Array([TypeCode.U8, 0x2a])
      );
    });

    // From Rust: u32(42) = [0x04, 0x2A, 0x00, 0x00, 0x00]
    it("encodes u32(42) little-endian", () => {
      const result = encode(U32(42));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(
        new Uint8Array([TypeCode.U32, 0x2a, 0x00, 0x00, 0x00])
      );
    });

    it("encodes u64 little-endian", () => {
      const result = encode(U64(0x123456789abcdef0n));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(
        new Uint8Array([
          TypeCode.U64,
          0xf0, 0xde, 0xbc, 0x9a, 0x78, 0x56, 0x34, 0x12,
        ])
      );
    });

    // From Rust: u128(MAX) = [0x06, 0xFF x 16]
    it("encodes u128 max value", () => {
      const max = (1n << 128n) - 1n;
      const result = encode(U128(max));
      expect(result.isOk()).toBe(true);
      const bytes = result._unsafeUnwrap();
      expect(bytes[0]).toBe(TypeCode.U128);
      expect(bytes.length).toBe(17);
      for (let i = 1; i < 17; i++) {
        expect(bytes[i]).toBe(0xff);
      }
    });
  });

  describe("signed integers (little-endian)", () => {
    // From Rust: i32(-42) = [0x09, 0xD6, 0xFF, 0xFF, 0xFF]
    it("encodes i32(-42)", () => {
      const result = encode(I32(-42));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(
        new Uint8Array([TypeCode.I32, 0xd6, 0xff, 0xff, 0xff])
      );
    });

    it("encodes i64(-1)", () => {
      const result = encode(I64(-1n));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(
        new Uint8Array([
          TypeCode.I64,
          0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        ])
      );
    });
  });

  describe("String", () => {
    // From Rust: "Hello, Relish!" = [0x0E, 0x1C, ...bytes]
    // 0x1C = 28 = 14 << 1 (length 14)
    it("encodes 'Hello, Relish!'", () => {
      const result = encode(String_("Hello, Relish!"));
      expect(result.isOk()).toBe(true);
      const bytes = result._unsafeUnwrap();
      expect(bytes[0]).toBe(TypeCode.String);
      expect(bytes[1]).toBe(0x1c); // length 14 << 1
      expect(bytes.slice(2)).toEqual(
        new TextEncoder().encode("Hello, Relish!")
      );
    });

    it("encodes empty string", () => {
      const result = encode(String_(""));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(
        new Uint8Array([TypeCode.String, 0x00])
      );
    });
  });

  describe("Timestamp", () => {
    it("encodes timestamp as i64 little-endian", () => {
      const result = encode(Timestamp(1704067200n));
      expect(result.isOk()).toBe(true);
      const bytes = result._unsafeUnwrap();
      expect(bytes[0]).toBe(TypeCode.Timestamp);
      expect(bytes.length).toBe(9); // type + 8 bytes
    });
  });
});
