// pattern: Functional Core
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  encode,
  decode,
  Null,
  Bool,
  U8,
  U16,
  U32,
  U64,
  U128,
  I8,
  I32,
  I64,
  I128,
  F64,
  String_ as Str,
  Timestamp,
  Array_,
  Map_,
  Struct,
  Enum,
  TypeCode,
  DateTime,
  type RelishValue,
} from "../src/index.js";
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
        if (encoded.isErr()) {
          return false;
        }
        const decoded = decode(encoded.value);
        if (decoded.isErr()) {
          return false;
        }
        return decoded.value === b;
      }),
    );
  });

  it("roundtrips u8", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 255 }), (n) => {
        const value = U8(n);
        const encoded = encode(value);
        if (encoded.isErr()) {
          return false;
        }
        const decoded = decode(encoded.value);
        if (decoded.isErr()) {
          return false;
        }
        return decoded.value === n;
      }),
    );
  });

  it("roundtrips u16", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 65535 }), (n) => {
        const value = U16(n);
        const encoded = encode(value);
        if (encoded.isErr()) {
          return false;
        }
        const decoded = decode(encoded.value);
        if (decoded.isErr()) {
          return false;
        }
        return decoded.value === n;
      }),
    );
  });

  it("roundtrips u32", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), (n) => {
        const value = U32(n);
        const encoded = encode(value);
        if (encoded.isErr()) {
          return false;
        }
        const decoded = decode(encoded.value);
        if (decoded.isErr()) {
          return false;
        }
        return decoded.value === n;
      }),
    );
  });

  it("roundtrips u64", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), (n) => {
        const bign = BigInt(n);
        const value = U64(bign);
        const encoded = encode(value);
        if (encoded.isErr()) {
          return false;
        }
        const decoded = decode(encoded.value);
        if (decoded.isErr()) {
          return false;
        }
        return decoded.value === bign;
      }),
    );
  });

  it("roundtrips u128", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: (1n << 64n) - 1n }), (bign) => {
        const value = U128(bign);
        const encoded = encode(value);
        if (encoded.isErr()) {
          return false;
        }
        const decoded = decode(encoded.value);
        if (decoded.isErr()) {
          return false;
        }
        return decoded.value === bign;
      }),
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
        if (encoded.isErr()) {
          return false;
        }
        const decoded = decode(encoded.value);
        if (decoded.isErr()) {
          return false;
        }
        return decoded.value === n;
      }),
    );
  });

  it("roundtrips i32", () => {
    fc.assert(
      fc.property(fc.integer({ min: -0x80000000, max: 0x7fffffff }), (n) => {
        const value = I32(n);
        const encoded = encode(value);
        if (encoded.isErr()) {
          return false;
        }
        const decoded = decode(encoded.value);
        if (decoded.isErr()) {
          return false;
        }
        return decoded.value === n;
      }),
    );
  });

  it("roundtrips i64", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER }),
        (n) => {
          const bign = BigInt(n);
          const value = I64(bign);
          const encoded = encode(value);
          if (encoded.isErr()) {
            return false;
          }
          const decoded = decode(encoded.value);
          if (decoded.isErr()) {
            return false;
          }
          return decoded.value === bign;
        },
      ),
    );
  });

  it("roundtrips i128", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: -(1n << 63n), max: (1n << 63n) - 1n }), (bign) => {
        const value = I128(bign);
        const encoded = encode(value);
        if (encoded.isErr()) {
          return false;
        }
        const decoded = decode(encoded.value);
        if (decoded.isErr()) {
          return false;
        }
        return decoded.value === bign;
      }),
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
        if (encoded.isErr()) {
          return false;
        }
        const decoded = decode(encoded.value);
        if (decoded.isErr()) {
          return false;
        }
        return decoded.value === n;
      }),
    );
  });

  it("roundtrips String", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const value = Str(s);
        const encoded = encode(value);
        if (encoded.isErr()) {
          return false;
        }
        const decoded = decode(encoded.value);
        if (decoded.isErr()) {
          return false;
        }
        return decoded.value === s;
      }),
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
        if (encoded.isErr()) {
          return false;
        }
        const decoded = decode(encoded.value);
        if (decoded.isErr()) {
          return false;
        }
        const dt = decoded.value;
        return DateTime.isDateTime(dt) && dt.toSeconds() === n;
      }),
    );
  });

  it("roundtrips Array<u32> as ReadonlyArray", () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 0xffffffff })), (arr) => {
        const value = Array_(TypeCode.U32, arr);
        const encoded = encode(value);
        if (encoded.isErr()) {
          return false;
        }
        const decoded = decode(encoded.value);
        if (decoded.isErr()) {
          return false;
        }
        const decodedArr = decoded.value;
        if (!Array.isArray(decodedArr)) {
          return false;
        }
        return JSON.stringify(decodedArr) === JSON.stringify(arr);
      }),
    );
  });

  it("roundtrips Array<string> as ReadonlyArray", () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (arr) => {
        const value = Array_(TypeCode.String, arr);
        const encoded = encode(value);
        if (encoded.isErr()) {
          return false;
        }
        const decoded = decode(encoded.value);
        if (decoded.isErr()) {
          return false;
        }
        const decodedArr = decoded.value;
        if (!Array.isArray(decodedArr)) {
          return false;
        }
        return JSON.stringify(decodedArr) === JSON.stringify(arr);
      }),
    );
  });

  it("roundtrips Map<u32, string> as ReadonlyMap", () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.integer({ min: 0, max: 0xffffffff }), fc.string())),
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
        },
      ),
    );
  });
});

// =============================================================================
// Nested Composite Type Roundtrip Tests
// =============================================================================

describe("Nested Arrays roundtrip", () => {
  it("roundtrips Array<Array<u8>> (2D array)", () => {
    fc.assert(
      fc.property(
        fc.array(fc.array(fc.integer({ min: 0, max: 255 }), { maxLength: 10 }), { maxLength: 5 }),
        (matrix) => {
          // Build nested array structure
          const innerArrays = matrix.map((row) => Array_(TypeCode.U8, row));
          const value = Array_(TypeCode.Array, innerArrays);

          const encoded = encode(value);
          if (encoded.isErr()) {
            return false;
          }

          const decoded = decode(encoded.value);
          if (decoded.isErr()) {
            return false;
          }

          const result = decoded.value as ReadonlyArray<ReadonlyArray<number>>;
          if (!Array.isArray(result)) {
            return false;
          }
          if (result.length !== matrix.length) {
            return false;
          }

          for (let i = 0; i < matrix.length; i++) {
            const row = result[i];
            if (!Array.isArray(row)) {
              return false;
            }
            if (row.length !== matrix[i]!.length) {
              return false;
            }
            for (let j = 0; j < matrix[i]!.length; j++) {
              if (row[j] !== matrix[i]![j]) {
                return false;
              }
            }
          }
          return true;
        },
      ),
    );
  });

  it("roundtrips Array<Array<Array<string>>> (3D array)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.array(fc.array(fc.string({ maxLength: 10 }), { maxLength: 3 }), { maxLength: 3 }),
          { maxLength: 3 },
        ),
        (cube) => {
          // Build 3D nested array structure
          const innerMost = cube.map((plane) => plane.map((row) => Array_(TypeCode.String, row)));
          const middle = innerMost.map((plane) => Array_(TypeCode.Array, plane));
          const value = Array_(TypeCode.Array, middle);

          const encoded = encode(value);
          if (encoded.isErr()) {
            return false;
          }

          const decoded = decode(encoded.value);
          if (decoded.isErr()) {
            return false;
          }

          // Deep equality check
          return JSON.stringify(decoded.value) === JSON.stringify(cube);
        },
      ),
    );
  });

  it("roundtrips mixed-type nested arrays", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 0xffffffff }), { maxLength: 5 }),
        (u32Array) => {
          // Array of arrays with the same element type (required by Relish)
          const inner1 = Array_(TypeCode.U32, u32Array);
          const inner2 = Array_(TypeCode.U32, u32Array);

          const value = Array_(TypeCode.Array, [inner1, inner2]);

          const encoded = encode(value);
          if (encoded.isErr()) {
            return false;
          }

          const decoded = decode(encoded.value);
          if (decoded.isErr()) {
            return false;
          }

          const result = decoded.value as ReadonlyArray<ReadonlyArray<number>>;
          return (
            Array.isArray(result) &&
            result.length === 2 &&
            JSON.stringify(result[0]) === JSON.stringify(u32Array) &&
            JSON.stringify(result[1]) === JSON.stringify(u32Array)
          );
        },
      ),
    );
  });
});

describe("Nested Maps roundtrip", () => {
  it("roundtrips Map<string, Array<u32>> (map with composite values)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            fc.string({ maxLength: 10 }),
            fc.array(fc.integer({ min: 0, max: 0xffffffff }), { maxLength: 5 }),
          ),
          { maxLength: 5 },
        ),
        (entries) => {
          // Remove duplicate keys
          const uniqueEntries = new Map(entries);

          // Build map with array values
          const mapEntries = new Map<string, RelishValue>();
          for (const [key, arr] of uniqueEntries) {
            mapEntries.set(key, Array_(TypeCode.U32, arr));
          }

          const value = Map_(TypeCode.String, TypeCode.Array, mapEntries);

          const encoded = encode(value);
          if (encoded.isErr()) {
            return false;
          }

          const decoded = decode(encoded.value);
          if (decoded.isErr()) {
            return false;
          }

          const result = decoded.value as ReadonlyMap<string, ReadonlyArray<number>>;
          if (!(result instanceof Map)) {
            return false;
          }
          if (result.size !== uniqueEntries.size) {
            return false;
          }

          for (const [key, arr] of uniqueEntries) {
            const decodedArr = result.get(key);
            if (!decodedArr || JSON.stringify(decodedArr) !== JSON.stringify(arr)) {
              return false;
            }
          }
          return true;
        },
      ),
    );
  });

  it("roundtrips Map<string, Map<string, u32>> (nested maps)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            fc.string({ maxLength: 10 }),
            fc.array(
              fc.tuple(fc.string({ maxLength: 10 }), fc.integer({ min: 0, max: 0xffffffff })),
              { maxLength: 3 },
            ),
          ),
          { maxLength: 3 },
        ),
        (outerEntries) => {
          // Remove duplicate keys at outer level
          const uniqueOuter = new Map(outerEntries);

          // Build nested map structure
          const outerMap = new Map<string, RelishValue>();
          const expectedOuter = new Map<string, Map<string, number>>();

          for (const [outerKey, innerEntries] of uniqueOuter) {
            const uniqueInner = new Map(innerEntries);
            const innerMap = Map_(TypeCode.String, TypeCode.U32, uniqueInner);
            outerMap.set(outerKey, innerMap);
            expectedOuter.set(outerKey, uniqueInner);
          }

          const value = Map_(TypeCode.String, TypeCode.Map, outerMap);

          const encoded = encode(value);
          if (encoded.isErr()) {
            return false;
          }

          const decoded = decode(encoded.value);
          if (decoded.isErr()) {
            return false;
          }

          const result = decoded.value as ReadonlyMap<string, ReadonlyMap<string, number>>;
          if (!(result instanceof Map)) {
            return false;
          }
          if (result.size !== expectedOuter.size) {
            return false;
          }

          for (const [outerKey, expectedInner] of expectedOuter) {
            const decodedInner = result.get(outerKey);
            if (!(decodedInner instanceof Map)) {
              return false;
            }
            if (decodedInner.size !== expectedInner.size) {
              return false;
            }
            for (const [innerKey, innerVal] of expectedInner) {
              if (decodedInner.get(innerKey) !== innerVal) {
                return false;
              }
            }
          }
          return true;
        },
      ),
    );
  });
});

describe("Nested Structs roundtrip", () => {
  it("roundtrips Struct with array fields", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 20 }),
        fc.array(fc.string({ maxLength: 10 }), { maxLength: 5 }),
        fc.integer({ min: 0, max: 0xffffffff }),
        (name, friends, age) => {
          // Struct: { 0: name, 1: friends, 2: age }
          const fields = new Map<number, RelishValue>([
            [0, Str(name)],
            [1, Array_(TypeCode.String, friends)],
            [2, U32(age)],
          ]);
          const value = Struct(fields);

          const encoded = encode(value);
          if (encoded.isErr()) {
            return false;
          }

          const decoded = decode(encoded.value);
          if (decoded.isErr()) {
            return false;
          }

          const result = decoded.value as { 0: string; 1: ReadonlyArray<string>; 2: number };
          return (
            result[0] === name &&
            JSON.stringify(result[1]) === JSON.stringify(friends) &&
            result[2] === age
          );
        },
      ),
    );
  });

  it("roundtrips Struct with map fields", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 20 }),
        fc.array(fc.tuple(fc.string({ maxLength: 10 }), fc.string({ maxLength: 20 })), {
          maxLength: 5,
        }),
        (name, settingsEntries) => {
          const settings = new Map(settingsEntries);

          // Struct: { 0: name, 1: settings }
          const fields = new Map<number, RelishValue>([
            [0, Str(name)],
            [1, Map_(TypeCode.String, TypeCode.String, settings)],
          ]);
          const value = Struct(fields);

          const encoded = encode(value);
          if (encoded.isErr()) {
            return false;
          }

          const decoded = decode(encoded.value);
          if (decoded.isErr()) {
            return false;
          }

          const result = decoded.value as { 0: string; 1: ReadonlyMap<string, string> };
          if (result[0] !== name) {
            return false;
          }
          if (!(result[1] instanceof Map)) {
            return false;
          }
          if (result[1].size !== settings.size) {
            return false;
          }
          for (const [k, v] of settings) {
            if (result[1].get(k) !== v) {
              return false;
            }
          }
          return true;
        },
      ),
    );
  });

  it("roundtrips nested Structs (Struct with Struct fields)", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 20 }),
        fc.string({ maxLength: 50 }),
        fc.string({ maxLength: 20 }),
        fc.string({ maxLength: 20 }),
        (street, city, personName, company) => {
          // Inner struct: Address { 0: street, 1: city }
          const addressFields = new Map<number, RelishValue>([
            [0, Str(street)],
            [1, Str(city)],
          ]);
          const address = Struct(addressFields);

          // Outer struct: Person { 0: name, 1: company, 2: address }
          const personFields = new Map<number, RelishValue>([
            [0, Str(personName)],
            [1, Str(company)],
            [2, address],
          ]);
          const person = Struct(personFields);

          const encoded = encode(person);
          if (encoded.isErr()) {
            return false;
          }

          const decoded = decode(encoded.value);
          if (decoded.isErr()) {
            return false;
          }

          const result = decoded.value as {
            0: string;
            1: string;
            2: { 0: string; 1: string };
          };
          return (
            result[0] === personName &&
            result[1] === company &&
            result[2][0] === street &&
            result[2][1] === city
          );
        },
      ),
    );
  });
});

describe("Complex combinations roundtrip", () => {
  it("roundtrips Array<Struct>", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ maxLength: 20 }),
            age: fc.integer({ min: 0, max: 150 }),
          }),
          { maxLength: 5 },
        ),
        (people) => {
          // Build array of struct values
          const structs = people.map((p) =>
            Struct(
              new Map<number, RelishValue>([
                [0, Str(p.name)],
                [1, U8(p.age)],
              ]),
            ),
          );
          const value = Array_(TypeCode.Struct, structs);

          const encoded = encode(value);
          if (encoded.isErr()) {
            return false;
          }

          const decoded = decode(encoded.value);
          if (decoded.isErr()) {
            return false;
          }

          const result = decoded.value as ReadonlyArray<{ 0: string; 1: number }>;
          if (!Array.isArray(result)) {
            return false;
          }
          if (result.length !== people.length) {
            return false;
          }

          for (let i = 0; i < people.length; i++) {
            const person = people[i]!;
            const decodedPerson = result[i]!;
            if (decodedPerson[0] !== person.name || decodedPerson[1] !== person.age) {
              return false;
            }
          }
          return true;
        },
      ),
    );
  });

  it("roundtrips Struct with Array<Struct> (Team with members)", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 30 }),
        fc.array(
          fc.record({
            name: fc.string({ maxLength: 20 }),
            role: fc.string({ maxLength: 20 }),
          }),
          { maxLength: 5 },
        ),
        (teamName, members) => {
          // Build member structs
          const memberStructs = members.map((m) =>
            Struct(
              new Map<number, RelishValue>([
                [0, Str(m.name)],
                [1, Str(m.role)],
              ]),
            ),
          );

          // Team struct: { 0: name, 1: members }
          const team = Struct(
            new Map<number, RelishValue>([
              [0, Str(teamName)],
              [1, Array_(TypeCode.Struct, memberStructs)],
            ]),
          );

          const encoded = encode(team);
          if (encoded.isErr()) {
            return false;
          }

          const decoded = decode(encoded.value);
          if (decoded.isErr()) {
            return false;
          }

          const result = decoded.value as {
            0: string;
            1: ReadonlyArray<{ 0: string; 1: string }>;
          };
          if (result[0] !== teamName) {
            return false;
          }
          if (!Array.isArray(result[1])) {
            return false;
          }
          if (result[1].length !== members.length) {
            return false;
          }

          for (let i = 0; i < members.length; i++) {
            const member = members[i]!;
            const decodedMember = result[1][i]!;
            if (decodedMember[0] !== member.name || decodedMember[1] !== member.role) {
              return false;
            }
          }
          return true;
        },
      ),
    );
  });

  it("roundtrips Map<string, Struct>", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            fc.string({ maxLength: 10 }),
            fc.record({
              value: fc.integer({ min: 0, max: 0xffffffff }),
              enabled: fc.boolean(),
            }),
          ),
          { maxLength: 5 },
        ),
        (entries) => {
          const uniqueEntries = new Map(entries);

          // Build map with struct values
          const mapEntries = new Map<string, RelishValue>();
          for (const [key, config] of uniqueEntries) {
            mapEntries.set(
              key,
              Struct(
                new Map<number, RelishValue>([
                  [0, U32(config.value)],
                  [1, Bool(config.enabled)],
                ]),
              ),
            );
          }

          const value = Map_(TypeCode.String, TypeCode.Struct, mapEntries);

          const encoded = encode(value);
          if (encoded.isErr()) {
            return false;
          }

          const decoded = decode(encoded.value);
          if (decoded.isErr()) {
            return false;
          }

          const result = decoded.value as ReadonlyMap<string, { 0: number; 1: boolean }>;
          if (!(result instanceof Map)) {
            return false;
          }
          if (result.size !== uniqueEntries.size) {
            return false;
          }

          for (const [key, config] of uniqueEntries) {
            const decodedConfig = result.get(key);
            if (!decodedConfig) {
              return false;
            }
            if (decodedConfig[0] !== config.value) {
              return false;
            }
            if (decodedConfig[1] !== config.enabled) {
              return false;
            }
          }
          return true;
        },
      ),
    );
  });

  it("roundtrips Enum with Struct payload", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ type: fc.constant("success" as const), data: fc.string({ maxLength: 50 }) }),
          fc.record({
            type: fc.constant("error" as const),
            code: fc.integer({ min: 0, max: 1000 }),
            message: fc.string({ maxLength: 100 }),
          }),
        ),
        (result) => {
          let value: RelishValue;
          let expectedVariantId: number;

          if (result.type === "success") {
            // Variant 0: Success { 0: data }
            expectedVariantId = 0;
            value = Enum(0, Struct(new Map<number, RelishValue>([[0, Str(result.data)]])));
          } else {
            // Variant 1: Error { 0: code, 1: message }
            expectedVariantId = 1;
            value = Enum(
              1,
              Struct(
                new Map<number, RelishValue>([
                  [0, U32(result.code)],
                  [1, Str(result.message)],
                ]),
              ),
            );
          }

          const encoded = encode(value);
          if (encoded.isErr()) {
            return false;
          }

          const decoded = decode(encoded.value);
          if (decoded.isErr()) {
            return false;
          }

          const decodedResult = decoded.value as { variantId: number; value: object };
          if (decodedResult.variantId !== expectedVariantId) {
            return false;
          }

          if (result.type === "success") {
            const payload = decodedResult.value as { 0: string };
            return payload[0] === result.data;
          } else {
            const payload = decodedResult.value as { 0: number; 1: string };
            return payload[0] === result.code && payload[1] === result.message;
          }
        },
      ),
    );
  });

  it("roundtrips Enum with Array payload", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({
            variant: fc.constant(0 as const),
            values: fc.array(fc.integer({ min: 0, max: 255 }), { maxLength: 10 }),
          }),
          fc.record({
            variant: fc.constant(1 as const),
            values: fc.array(fc.string({ maxLength: 20 }), { maxLength: 5 }),
          }),
        ),
        (input) => {
          let value: RelishValue;

          if (input.variant === 0) {
            value = Enum(0, Array_(TypeCode.U8, input.values));
          } else {
            value = Enum(1, Array_(TypeCode.String, input.values));
          }

          const encoded = encode(value);
          if (encoded.isErr()) {
            return false;
          }

          const decoded = decode(encoded.value);
          if (decoded.isErr()) {
            return false;
          }

          const decodedResult = decoded.value as {
            variantId: number;
            value: ReadonlyArray<unknown>;
          };
          if (decodedResult.variantId !== input.variant) {
            return false;
          }

          return JSON.stringify(decodedResult.value) === JSON.stringify(input.values);
        },
      ),
    );
  });
});

describe("Edge cases roundtrip", () => {
  it("roundtrips empty nested arrays", () => {
    // Empty 2D array
    const emptyMatrix = Array_(TypeCode.Array, []);
    const encoded1 = expectOk(encode(emptyMatrix));
    const decoded1 = expectOk(decode(encoded1));
    expect(decoded1).toEqual([]);

    // 2D array with empty inner arrays
    const emptyRows = Array_(TypeCode.Array, [Array_(TypeCode.U8, []), Array_(TypeCode.U8, [])]);
    const encoded2 = expectOk(encode(emptyRows));
    const decoded2 = expectOk(decode(encoded2));
    expect(decoded2).toEqual([[], []]);
  });

  it("roundtrips empty nested maps", () => {
    // Empty map with map values
    const emptyMapOfMaps = Map_(TypeCode.String, TypeCode.Map, new Map());
    const encoded1 = expectOk(encode(emptyMapOfMaps));
    const decoded1 = expectOk(decode(encoded1));
    expect(decoded1).toEqual(new Map());

    // Map with empty map values
    const mapWithEmptyMaps = Map_(
      TypeCode.String,
      TypeCode.Map,
      new Map([
        ["a", Map_(TypeCode.String, TypeCode.U32, new Map())],
        ["b", Map_(TypeCode.String, TypeCode.U32, new Map())],
      ]),
    );
    const encoded2 = expectOk(encode(mapWithEmptyMaps));
    const decoded2 = expectOk(decode(encoded2)) as ReadonlyMap<string, ReadonlyMap<string, number>>;
    expect(decoded2.size).toBe(2);
    expect(decoded2.get("a")).toEqual(new Map());
    expect(decoded2.get("b")).toEqual(new Map());
  });

  it("roundtrips empty structs", () => {
    const emptyStruct = Struct(new Map());
    const encoded = expectOk(encode(emptyStruct));
    const decoded = expectOk(decode(encoded));
    expect(decoded).toEqual({});
  });

  it("roundtrips deeply nested structure (4 levels)", () => {
    // Level 4: innermost struct
    const innermost = Struct(
      new Map<number, RelishValue>([
        [0, Str("deep")],
        [1, U32(42)],
      ]),
    );

    // Level 3: array of structs
    const level3 = Array_(TypeCode.Struct, [innermost, innermost]);

    // Level 2: map with array values
    const level2 = Map_(TypeCode.String, TypeCode.Array, new Map([["items", level3]]));

    // Level 1: struct with map field
    const level1 = Struct(
      new Map<number, RelishValue>([
        [0, Str("container")],
        [1, level2],
      ]),
    );

    const encoded = expectOk(encode(level1));
    const decoded = expectOk(decode(encoded)) as {
      0: string;
      1: ReadonlyMap<string, ReadonlyArray<{ 0: string; 1: number }>>;
    };

    expect(decoded[0]).toBe("container");
    expect(decoded[1].get("items")).toEqual([
      { 0: "deep", 1: 42 },
      { 0: "deep", 1: 42 },
    ]);
  });

  it("roundtrips large nested structure", () => {
    // Generate a reasonably large but not excessive structure
    const numRows = 50;
    const numCols = 20;

    // Build a 50x20 matrix of u8 values
    const rows: Array<RelishValue> = [];
    for (let i = 0; i < numRows; i++) {
      const row: Array<number> = [];
      for (let j = 0; j < numCols; j++) {
        row.push((i * numCols + j) % 256);
      }
      rows.push(Array_(TypeCode.U8, row));
    }

    const matrix = Array_(TypeCode.Array, rows);

    const encoded = expectOk(encode(matrix));
    const decoded = expectOk(decode(encoded)) as ReadonlyArray<ReadonlyArray<number>>;

    expect(decoded.length).toBe(numRows);
    for (let i = 0; i < numRows; i++) {
      expect(decoded[i]!.length).toBe(numCols);
      for (let j = 0; j < numCols; j++) {
        expect(decoded[i]![j]).toBe((i * numCols + j) % 256);
      }
    }
  });

  it("roundtrips struct with all field types", () => {
    // A struct with every supported primitive type as fields
    const fields = new Map<number, RelishValue>([
      [0, Null],
      [1, Bool(true)],
      [2, U8(255)],
      [3, U16(65535)],
      [4, U32(0xffffffff)],
      [5, U64(BigInt("18446744073709551615"))],
      [6, I8(-128)],
      [7, I32(-2147483648)],
      [8, I64(BigInt("-9223372036854775808"))],
      [9, F64(3.14159265359)],
      [10, Str("hello")],
      [11, Array_(TypeCode.U8, [1, 2, 3])],
      [12, Map_(TypeCode.String, TypeCode.U32, new Map([["key", 42]]))],
    ]);

    const value = Struct(fields);
    const encoded = expectOk(encode(value));
    const decoded = expectOk(decode(encoded)) as Record<number, unknown>;

    expect(decoded[0]).toBe(null);
    expect(decoded[1]).toBe(true);
    expect(decoded[2]).toBe(255);
    expect(decoded[3]).toBe(65535);
    expect(decoded[4]).toBe(0xffffffff);
    expect(decoded[5]).toBe(BigInt("18446744073709551615"));
    expect(decoded[6]).toBe(-128);
    expect(decoded[7]).toBe(-2147483648);
    expect(decoded[8]).toBe(BigInt("-9223372036854775808"));
    expect(decoded[9]).toBeCloseTo(3.14159265359);
    expect(decoded[10]).toBe("hello");
    expect(decoded[11]).toEqual([1, 2, 3]);
    expect(decoded[12]).toEqual(new Map([["key", 42]]));
  });
});
