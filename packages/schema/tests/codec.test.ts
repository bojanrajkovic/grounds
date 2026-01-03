// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { createCodec } from "../src/codec.js";
import { RString, RU32, RArray, RMap, ROptional } from "../src/types.js";
import { field, RStruct } from "../src/struct.js";
import { variant, REnum } from "../src/enum.js";
import type { Static } from "@sinclair/typebox";
import { expectOk, expectMap } from "@grounds/test-utils";

describe("Codec", () => {
  it("encodes and decodes primitive", () => {
    const codec = createCodec(RU32());
    const encoded = expectOk(codec.encode(42));

    const decoded = expectOk(codec.decode(encoded));
    expect(decoded).toBe(42);
  });

  it("encodes and decodes string", () => {
    const codec = createCodec(RString());
    const encoded = expectOk(codec.encode("hello world"));

    const decoded = expectOk(codec.decode(encoded));
    expect(decoded).toBe("hello world");
  });

  it("encodes and decodes array", () => {
    const codec = createCodec(RArray(RU32()));
    const encoded = expectOk(codec.encode([1, 2, 3]));

    const decoded = expectOk(codec.decode(encoded));
    expect(decoded).toEqual([1, 2, 3]);
  });

  it("encodes and decodes struct", () => {
    const UserSchema = RStruct({
      name: field(1, RString()),
      age: field(2, RU32()),
    });

    type User = Static<typeof UserSchema>;
    const codec = createCodec(UserSchema);

    const user: User = { name: "Alice", age: 30 };
    const encoded = expectOk(codec.encode(user));

    const decoded = expectOk(codec.decode(encoded));
    expect(decoded).toEqual(user);
  });

  it("encodes and decodes struct with optional", () => {
    const UserSchema = RStruct({
      name: field(1, RString()),
      nickname: field(2, ROptional(RString())),
    });

    type User = Static<typeof UserSchema>;
    const codec = createCodec(UserSchema);

    // With optional present
    const user1: User = { name: "Alice", nickname: "Ali" };
    const encoded1 = expectOk(codec.encode(user1));
    const decoded1 = expectOk(codec.decode(encoded1));
    expect(decoded1).toEqual(user1);

    // With optional null
    const user2: User = { name: "Bob", nickname: null };
    const encoded2 = expectOk(codec.encode(user2));
    const decoded2 = expectOk(codec.decode(encoded2));
    expect(decoded2).toEqual(user2);
  });

  it("encodes and decodes enum", () => {
    const ResultSchema = REnum({
      ok: variant(1, RString()),
      error: variant(2, RU32()),
    });

    const codec = createCodec(ResultSchema);

    // Encode: pass just the value, variant inferred from schema matching
    const encoded = expectOk(codec.encode("success"));

    // Decode: returns { variantName: value }
    const decoded = expectOk(codec.decode(encoded));
    expect(decoded).toEqual({ ok: "success" });
  });

  it("encodes and decodes map", () => {
    const codec = createCodec(RMap(RString(), RU32()));
    const input = new Map([["one", 1], ["two", 2]]);

    const encoded = expectOk(codec.encode(input));

    const result = expectOk(codec.decode(encoded));
    expectMap<string, number>(result);
    expect(result.get("one")).toBe(1);
    expect(result.get("two")).toBe(2);
  });
});
