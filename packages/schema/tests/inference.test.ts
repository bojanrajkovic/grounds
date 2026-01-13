// pattern: Functional Core
// These tests verify TypeScript type inference at compile time
// If types are wrong, the file won't compile

import { describe, it, expect } from "vitest";
import type { Static } from "@sinclair/typebox";
import {
  RNull,
  RBool,
  RU8,
  RU16,
  RU32,
  RU64,
  RU128,
  RI8,
  RI16,
  RI32,
  RI64,
  RI128,
  RF32,
  RF64,
  RString,
  RTimestamp,
  RArray,
  RMap,
  ROptional,
} from "../src/index.js";
import { RelishElementType, RelishKeyType, RelishValueType } from "../src/symbols.js";
import { field, RStruct } from "../src/struct.js";
import { variant, REnum } from "../src/enum.js";
import { DateTime } from "luxon";

describe("Type Inference (compile-time)", () => {
  describe("Primitive Types", () => {
    it("infers null type correctly", () => {
      const schema = RNull();
      type Inferred = Static<typeof schema>;
      const value: Inferred = null;
      expect(value).toBeNull();
    });

    it("infers boolean type correctly", () => {
      const schema = RBool();
      type Inferred = Static<typeof schema>;
      const value: Inferred = true;
      expect(typeof value).toBe("boolean");
    });

    it("infers number types correctly for u8/u16/u32/i8/i16/i32/f32/f64", () => {
      type U8T = Static<ReturnType<typeof RU8>>;
      type U16T = Static<ReturnType<typeof RU16>>;
      type U32T = Static<ReturnType<typeof RU32>>;
      type I8T = Static<ReturnType<typeof RI8>>;
      type I16T = Static<ReturnType<typeof RI16>>;
      type I32T = Static<ReturnType<typeof RI32>>;
      type F32T = Static<ReturnType<typeof RF32>>;
      type F64T = Static<ReturnType<typeof RF64>>;

      const u8Val: U8T = 255;
      const u16Val: U16T = 65535;
      const u32Val: U32T = 4294967295;
      const i8Val: I8T = -128;
      const i16Val: I16T = -32768;
      const i32Val: I32T = -2147483648;
      const f32Val: F32T = 3.14;
      const f64Val: F64T = 3.14159265359;

      expect(typeof u8Val).toBe("number");
      expect(typeof u16Val).toBe("number");
      expect(typeof u32Val).toBe("number");
      expect(typeof i8Val).toBe("number");
      expect(typeof i16Val).toBe("number");
      expect(typeof i32Val).toBe("number");
      expect(typeof f32Val).toBe("number");
      expect(typeof f64Val).toBe("number");
    });

    it("infers bigint types correctly for u64/u128/i64/i128", () => {
      type U64T = Static<ReturnType<typeof RU64>>;
      type U128T = Static<ReturnType<typeof RU128>>;
      type I64T = Static<ReturnType<typeof RI64>>;
      type I128T = Static<ReturnType<typeof RI128>>;

      const u64Val: U64T = 123n;
      const u128Val: U128T = 123n;
      const i64Val: I64T = -123n;
      const i128Val: I128T = -123n;

      expect(typeof u64Val).toBe("bigint");
      expect(typeof u128Val).toBe("bigint");
      expect(typeof i64Val).toBe("bigint");
      expect(typeof i128Val).toBe("bigint");
    });

    it("infers string type correctly", () => {
      const schema = RString();
      type Inferred = Static<typeof schema>;
      const value: Inferred = "hello";
      expect(typeof value).toBe("string");
    });

    it("infers DateTime type correctly for timestamp", () => {
      const schema = RTimestamp();
      type Inferred = Static<typeof schema>;
      const value: Inferred = DateTime.now();
      expect(value instanceof DateTime).toBe(true);
    });
  });

  describe("Collection Types", () => {
    it("infers array element type correctly", () => {
      const u32ArraySchema = RArray(RU32());
      type U32Array = Static<typeof u32ArraySchema>;
      const u32Array: U32Array = [1, 2, 3];
      expect(Array.isArray(u32Array)).toBe(true);

      const stringArraySchema = RArray(RString());
      type StringArray = Static<typeof stringArraySchema>;
      const stringArray: StringArray = ["a", "b", "c"];
      expect(Array.isArray(stringArray)).toBe(true);
    });

    it("stores element schema reference in RArray", () => {
      const elementSchema = RU32();
      const arraySchema = RArray(elementSchema);
      expect(arraySchema[RelishElementType]).toBe(elementSchema);
    });

    it("infers Map key and value types correctly", () => {
      const mapSchema = RMap(RString(), RU32());
      type MapType = Static<typeof mapSchema>;
      const value: MapType = new Map([
        ["one", 1],
        ["two", 2],
      ]);
      expect(value instanceof Map).toBe(true);
    });

    it("stores key and value schema references in RMap", () => {
      const keySchema = RString();
      const valueSchema = RU32();
      const mapSchema = RMap(keySchema, valueSchema);
      expect(mapSchema[RelishKeyType]).toBe(keySchema);
      expect(mapSchema[RelishValueType]).toBe(valueSchema);
    });

    it("infers optional type correctly (T | null)", () => {
      const optionalStringSchema = ROptional(RString());
      type OptionalString = Static<typeof optionalStringSchema>;
      const value1: OptionalString = "hello";
      const value2: OptionalString = null;
      expect(value1).toBe("hello");
      expect(value2).toBeNull();
    });

    it("stores inner schema reference in ROptional", () => {
      const innerSchema = RString();
      const optionalSchema = ROptional(innerSchema);
      expect(optionalSchema.inner).toBe(innerSchema);
    });
  });

  describe("Struct Types", () => {
    it("infers object type from fields", () => {
      const UserSchema = RStruct({
        id: field(1, RU64()),
        name: field(2, RString()),
        email: field(3, ROptional(RString())),
      });

      type User = Static<typeof UserSchema>;

      const user: User = {
        id: 123n,
        name: "Alice",
        email: "alice@example.com",
      };

      const userWithoutEmail: User = {
        id: 456n,
        name: "Bob",
        email: null,
      };

      expect(user.name).toBe("Alice");
      expect(userWithoutEmail.email).toBeNull();
    });

    it("stores field definitions in .fields property", () => {
      const nameField = field(1, RString());
      const ageField = field(2, RU8());
      const schema = RStruct({
        name: nameField,
        age: ageField,
      });
      expect(schema.fields.name).toBe(nameField);
      expect(schema.fields.age).toBe(ageField);
    });
  });

  describe("Enum Types", () => {
    it("infers unwrapped union type", () => {
      const ResultSchema = REnum({
        success: variant(1, RString()),
        error: variant(2, RU32()),
      });

      // Static infers string | number (unwrapped variant types)
      type Result = Static<typeof ResultSchema>;

      const okResult: Result = "ok";
      const errorResult: Result = 404;

      expect(okResult).toBe("ok");
      expect(errorResult).toBe(404);
    });

    it("stores variant definitions in .variants property", () => {
      const successVariant = variant(1, RString());
      const errorVariant = variant(2, RU32());
      const schema = REnum({
        success: successVariant,
        error: errorVariant,
      });
      expect(schema.variants.success).toBe(successVariant);
      expect(schema.variants.error).toBe(errorVariant);
    });
  });

  describe("Nested Types", () => {
    it("infers nested struct types correctly", () => {
      const AddressSchema = RStruct({
        street: field(1, RString()),
        city: field(2, RString()),
      });

      const PersonSchema = RStruct({
        name: field(1, RString()),
        addresses: field(2, RArray(AddressSchema)),
      });

      type Person = Static<typeof PersonSchema>;

      const person: Person = {
        name: "Alice",
        addresses: [
          { street: "123 Main St", city: "Boston" },
          { street: "456 Oak Ave", city: "Cambridge" },
        ],
      };

      expect(person.addresses[0]?.city).toBe("Boston");
    });

    it("infers nested map types correctly", () => {
      const schema = RMap(RString(), RArray(RU32()));
      type MapOfArrays = Static<typeof schema>;
      const value: MapOfArrays = new Map([
        ["a", [1, 2, 3]],
        ["b", [4, 5, 6]],
      ]);
      expect(value instanceof Map).toBe(true);
    });

    it("infers deeply nested optional types", () => {
      const schema = ROptional(RArray(ROptional(RString())));
      type NestedOptional = Static<typeof schema>;
      const value1: NestedOptional = ["hello", null, "world"];
      const value2: NestedOptional = null;
      expect(Array.isArray(value1)).toBe(true);
      expect(value2).toBeNull();
    });
  });
});
