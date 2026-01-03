// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { createCodec } from "../src/codec.js";
import { RString, RU32, RArray, RMap, ROptional } from "../src/types.js";
import { field, RStruct } from "../src/struct.js";
import { variant, REnum } from "../src/enum.js";
import type { Static } from "@sinclair/typebox";

describe("Codec", () => {
  it("encodes and decodes primitive", () => {
    const codec = createCodec(RU32());
    const encoded = codec.encode(42);
    expect(encoded.isOk()).toBe(true);

    const decoded = codec.decode(encoded._unsafeUnwrap());
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toBe(42);
  });

  it("encodes and decodes string", () => {
    const codec = createCodec(RString());
    const encoded = codec.encode("hello world");
    expect(encoded.isOk()).toBe(true);

    const decoded = codec.decode(encoded._unsafeUnwrap());
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toBe("hello world");
  });

  it("encodes and decodes array", () => {
    const codec = createCodec(RArray(RU32()));
    const encoded = codec.encode([1, 2, 3]);
    expect(encoded.isOk()).toBe(true);

    const decoded = codec.decode(encoded._unsafeUnwrap());
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toEqual([1, 2, 3]);
  });

  it("encodes and decodes struct", () => {
    const UserSchema = RStruct({
      name: field(1, RString()),
      age: field(2, RU32()),
    });

    type User = Static<typeof UserSchema>;
    const codec = createCodec(UserSchema);

    const user: User = { name: "Alice", age: 30 };
    const encoded = codec.encode(user);
    expect(encoded.isOk()).toBe(true);

    const decoded = codec.decode(encoded._unsafeUnwrap());
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toEqual(user);
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
    const encoded1 = codec.encode(user1);
    const decoded1 = codec.decode(encoded1._unsafeUnwrap());
    expect(decoded1._unsafeUnwrap()).toEqual(user1);

    // With optional null
    const user2: User = { name: "Bob", nickname: null };
    const encoded2 = codec.encode(user2);
    const decoded2 = codec.decode(encoded2._unsafeUnwrap());
    expect(decoded2._unsafeUnwrap()).toEqual(user2);
  });

  it("encodes and decodes enum", () => {
    const ResultSchema = REnum({
      ok: variant(1, RString()),
      error: variant(2, RU32()),
    });

    type Result = Static<typeof ResultSchema>;
    const codec = createCodec(ResultSchema);

    const okResult: Result = { variant: "ok", value: "success" };
    const encoded = codec.encode(okResult);
    expect(encoded.isOk()).toBe(true);

    const decoded = codec.decode(encoded._unsafeUnwrap());
    expect(decoded.isOk()).toBe(true);
    expect(decoded._unsafeUnwrap()).toEqual(okResult);
  });

  it("encodes and decodes map", () => {
    const codec = createCodec(RMap(RString(), RU32()));
    const input = new Map([["one", 1], ["two", 2]]);

    const encoded = codec.encode(input);
    expect(encoded.isOk()).toBe(true);

    const decoded = codec.decode(encoded._unsafeUnwrap());
    expect(decoded.isOk()).toBe(true);
    const result = decoded._unsafeUnwrap() as Map<string, number>;
    expect(result.get("one")).toBe(1);
    expect(result.get("two")).toBe(2);
  });
});
