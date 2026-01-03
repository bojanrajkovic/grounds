// pattern: Functional Core
// Test assertion helpers for type-safe test assertions

import { expect } from "vitest";
import type { Result } from "neverthrow";
import { DateTime } from "luxon";

/**
 * Assert that a Result is Ok and return the unwrapped value.
 * Combines the assertion and unwrap into a single type-safe operation.
 */
export function expectOk<T, E>(result: Result<T, E>): T {
  expect(result.isOk()).toBe(true);
  return result._unsafeUnwrap();
}

/**
 * Assert that a Result is Err and return the error.
 * Combines the assertion and unwrap into a single type-safe operation.
 */
export function expectErr<T, E>(result: Result<T, E>): E {
  expect(result.isErr()).toBe(true);
  return result._unsafeUnwrapErr();
}

/**
 * Assert that a value is a ReadonlyArray.
 */
export function expectArray<T>(value: unknown): asserts value is ReadonlyArray<T> {
  expect(Array.isArray(value)).toBe(true);
}

/**
 * Assert that a value is a ReadonlyMap.
 */
export function expectMap<K, V>(value: unknown): asserts value is ReadonlyMap<K, V> {
  expect(value).toBeInstanceOf(Map);
}

/**
 * Assert that a value is a Luxon DateTime.
 */
export function expectDateTime(value: unknown): asserts value is DateTime {
  expect(DateTime.isDateTime(value)).toBe(true);
}

/**
 * Assert that a value is a struct (plain object with numeric field IDs).
 */
export function expectStruct(value: unknown): asserts value is Readonly<{ [fieldId: number]: unknown }> {
  expect(value).toBeTypeOf("object");
  expect(value).not.toBeNull();
  expect(Array.isArray(value)).toBe(false);
}

/**
 * Assert that a value is an enum (object with variantId and value).
 */
export function expectEnum(value: unknown): asserts value is Readonly<{ variantId: number; value: unknown }> {
  expect(value).toBeTypeOf("object");
  expect(value).not.toBeNull();
  expect(value).toHaveProperty("variantId");
  expect(value).toHaveProperty("value");
}
