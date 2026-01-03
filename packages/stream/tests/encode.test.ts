// pattern: Functional Core
import { describe, it, expect } from "vitest";
import { encodeIterable } from "../src/encode.js";
import {
  type RelishValue,
  Null,
  Bool,
  U8,
  Struct,
  EncodeError,
} from "@grounds/core";

describe("encodeIterable", () => {
  it("should yield Result types from encodeIterable", async () => {
    async function* values(): AsyncGenerator<RelishValue> {
      yield Null;
      yield Bool(true);
    }

    const results = [];
    for await (const result of encodeIterable(values())) {
      results.push(result);
    }

    expect(results).toHaveLength(2);
    expect(results[0]?.isOk()).toBe(true);
    expect(results[1]?.isOk()).toBe(true);
  });

  it("should yield error Result for invalid field ID in struct", async () => {
    // Struct with field ID > 127 is invalid (bit 7 must not be set)
    async function* values(): AsyncGenerator<RelishValue> {
      yield Struct(new Map([[200, Null]]));
    }

    const results = [];
    for await (const result of encodeIterable(values())) {
      results.push(result);
    }

    expect(results).toHaveLength(1);
    expect(results[0]?.isErr()).toBe(true);
    if (results[0]?.isErr()) {
      expect(results[0].error).toBeInstanceOf(EncodeError);
    }
  });
});
