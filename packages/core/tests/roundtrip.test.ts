// pattern: Functional Core
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { encode, decode, Null, Bool, U8, U16, U32, U64, U128, I8, I32, I64, I128, F64, String_ as Str, Timestamp, Array_, Map_, TypeCode, DateTime } from "../src/index.js";
import { expectOk } from "@grounds/test-utils";

describe("Roundtrip encode/decode", () => {
  it("roundtrips Null", () => {
    const value = Null;
    const encoded = expectOk(encode(value));
    const decoded = expectOk(decode(encoded));
    expect(decoded).toBe(null);
  });

  it("roundtrips Bool", () => {
    fc.assert(
      fc.property(fc.boolean(), (b) => {
        const value = Bool(b);
        const encoded = encode(value);
        if (encoded.isErr()) return false;
        const decoded = decode(encoded.value);
        if (decoded.isErr()) return false;
        return decoded.value === b;
      })
    );
  });

  it("roundtrips u8", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 255 }), (n) => {
        const value = U8(n);
        const encoded = encode(value);
        if (encoded.isErr()) return false;
        const decoded = decode(encoded.value);
        if (decoded.isErr()) return false;
        return decoded.value === n;
      })
    );
  });

  it("roundtrips u16", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 65535 }), (n) => {
        const value = U16(n);
        const encoded = encode(value);
        if (encoded.isErr()) return false;
        const decoded = decode(encoded.value);
        if (decoded.isErr()) return false;
        return decoded.value === n;
      })
    );
  });

  it("roundtrips u32", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), (n) => {
        const value = U32(n);
        const encoded = encode(value);
        if (encoded.isErr()) return false;
        const decoded = decode(encoded.value);
        if (decoded.isErr()) return false;
        return decoded.value === n;
      })
    );
  });

  it("roundtrips u64", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), (n) => {
        const bign = BigInt(n);
        const value = U64(bign);
        const encoded = encode(value);
        if (encoded.isErr()) return false;
        const decoded = decode(encoded.value);
        if (decoded.isErr()) return false;
        return decoded.value === bign;
      })
    );
  });

  it("roundtrips u128", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: (1n << 64n) - 1n }), (bign) => {
        const value = U128(bign);
        const encoded = encode(value);
        if (encoded.isErr()) return false;
        const decoded = decode(encoded.value);
        if (decoded.isErr()) return false;
        return decoded.value === bign;
      })
    );
  });

  it("roundtrips u128 max value", () => {
    const max = (1n << 128n) - 1n;
    const value = U128(max);
    const encoded = expectOk(encode(value));
    const decoded = expectOk(decode(encoded));
    expect(decoded).toBe(max);
  });

  it("roundtrips i8", () => {
    fc.assert(
      fc.property(fc.integer({ min: -128, max: 127 }), (n) => {
        const value = I8(n);
        const encoded = encode(value);
        if (encoded.isErr()) return false;
        const decoded = decode(encoded.value);
        if (decoded.isErr()) return false;
        return decoded.value === n;
      })
    );
  });

  it("roundtrips i32", () => {
    fc.assert(
      fc.property(fc.integer({ min: -0x80000000, max: 0x7fffffff }), (n) => {
        const value = I32(n);
        const encoded = encode(value);
        if (encoded.isErr()) return false;
        const decoded = decode(encoded.value);
        if (decoded.isErr()) return false;
        return decoded.value === n;
      })
    );
  });

  it("roundtrips i64", () => {
    fc.assert(
      fc.property(fc.integer({ min: -Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER }), (n) => {
        const bign = BigInt(n);
        const value = I64(bign);
        const encoded = encode(value);
        if (encoded.isErr()) return false;
        const decoded = decode(encoded.value);
        if (decoded.isErr()) return false;
        return decoded.value === bign;
      })
    );
  });

  it("roundtrips i128", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: -(1n << 63n), max: (1n << 63n) - 1n }), (bign) => {
        const value = I128(bign);
        const encoded = encode(value);
        if (encoded.isErr()) return false;
        const decoded = decode(encoded.value);
        if (decoded.isErr()) return false;
        return decoded.value === bign;
      })
    );
  });

  it("roundtrips i128 min value", () => {
    const min = -(1n << 127n);
    const value = I128(min);
    const encoded = expectOk(encode(value));
    const decoded = expectOk(decode(encoded));
    expect(decoded).toBe(min);
  });

  it("roundtrips i128 max value", () => {
    const max = (1n << 127n) - 1n;
    const value = I128(max);
    const encoded = expectOk(encode(value));
    const decoded = expectOk(decode(encoded));
    expect(decoded).toBe(max);
  });

  it("roundtrips f64", () => {
    fc.assert(
      fc.property(fc.double({ noNaN: true, noInfinityIfNegative: false }), (n) => {
        const value = F64(n);
        const encoded = encode(value);
        if (encoded.isErr()) return false;
        const decoded = decode(encoded.value);
        if (decoded.isErr()) return false;
        return decoded.value === n;
      })
    );
  });

  it("roundtrips String", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const value = Str(s);
        const encoded = encode(value);
        if (encoded.isErr()) return false;
        const decoded = decode(encoded.value);
        if (decoded.isErr()) return false;
        return decoded.value === s;
      })
    );
  });

  it("roundtrips Timestamp as DateTime", () => {
    // Use a reasonable timestamp range that Luxon can handle well
    // (roughly year 1970 to 2286 in Unix seconds)
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000000000 }), (n) => {
        const bign = BigInt(n);
        const value = Timestamp(bign);
        const encoded = encode(value);
        if (encoded.isErr()) return false;
        const decoded = decode(encoded.value);
        if (decoded.isErr()) return false;
        const dt = decoded.value;
        return DateTime.isDateTime(dt) && dt.toSeconds() === n;
      })
    );
  });

  it("roundtrips Array<u32> as ReadonlyArray", () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 0xffffffff })), (arr) => {
        const value = Array_(TypeCode.U32, arr);
        const encoded = encode(value);
        if (encoded.isErr()) return false;
        const decoded = decode(encoded.value);
        if (decoded.isErr()) return false;
        const decodedArr = decoded.value;
        if (!Array.isArray(decodedArr)) return false;
        return JSON.stringify(decodedArr) === JSON.stringify(arr);
      })
    );
  });

  it("roundtrips Array<string> as ReadonlyArray", () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (arr) => {
        const value = Array_(TypeCode.String, arr);
        const encoded = encode(value);
        if (encoded.isErr()) return false;
        const decoded = decode(encoded.value);
        if (decoded.isErr()) return false;
        const decodedArr = decoded.value;
        if (!Array.isArray(decodedArr)) return false;
        return JSON.stringify(decodedArr) === JSON.stringify(arr);
      })
    );
  });

  it("roundtrips Map<u32, string> as ReadonlyMap", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            fc.integer({ min: 0, max: 0xffffffff }),
            fc.string()
          )
        ),
        (entries) => {
          // Remove duplicate keys
          const uniqueEntries = new Map(entries);
          const value = Map_(TypeCode.U32, TypeCode.String, uniqueEntries);
          const encoded = encode(value);
          if (encoded.isErr()) {
            return false;
          }
          const decoded = decode(encoded.value);
          if (decoded.isErr()) {
            return false;
          }
          const decodedMap = decoded.value;
          if (!(decodedMap instanceof Map)) {
            return false;
          }
          if (decodedMap.size !== uniqueEntries.size) {
            return false;
          }
          for (const [k, v] of uniqueEntries) {
            if (decodedMap.get(k) !== v) {
              return false;
            }
          }
          return true;
        }
      )
    );
  });
});
