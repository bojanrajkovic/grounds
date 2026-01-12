// pattern: Functional Core

/**
 * Integer range constants and validation functions.
 * Used by both value constructors (values.ts) and encoder validation (encoder.ts).
 * @internal
 */

// Unsigned integer maximums
export const U8_MAX = 255;
export const U16_MAX = 65535;
export const U32_MAX = 4294967295;
export const U64_MAX = 18446744073709551615n;
export const U128_MAX = 340282366920938463463374607431768211455n;

// Signed integer ranges
export const I8_MIN = -128;
export const I8_MAX = 127;
export const I16_MIN = -32768;
export const I16_MAX = 32767;
export const I32_MIN = -2147483648;
export const I32_MAX = 2147483647;
export const I64_MIN = -9223372036854775808n;
export const I64_MAX = 9223372036854775807n;
export const I128_MIN = -170141183460469231731687303715884105728n;
export const I128_MAX = 170141183460469231731687303715884105727n;

/**
 * Validation error result for integer checks.
 * Returns null if valid, or an error object with details.
 */
export type IntegerValidationError =
  | { readonly kind: "not_integer"; readonly value: number }
  | {
      readonly kind: "out_of_range";
      readonly value: number | bigint;
      readonly min: number | bigint;
      readonly max: number | bigint;
    };

/**
 * Validate an unsigned number (u8, u16, u32) is an integer within range.
 * @returns null if valid, or error details if invalid
 */
export function validateUnsignedNumber(
  value: number,
  max: number
): IntegerValidationError | null {
  if (!Number.isInteger(value)) {
    return { kind: "not_integer", value };
  }
  if (value < 0 || value > max) {
    return { kind: "out_of_range", value, min: 0, max };
  }
  return null;
}

/**
 * Validate a signed number (i8, i16, i32) is an integer within range.
 * @returns null if valid, or error details if invalid
 */
export function validateSignedNumber(
  value: number,
  min: number,
  max: number
): IntegerValidationError | null {
  if (!Number.isInteger(value)) {
    return { kind: "not_integer", value };
  }
  if (value < min || value > max) {
    return { kind: "out_of_range", value, min, max };
  }
  return null;
}

/**
 * Validate an unsigned bigint (u64, u128) is within range.
 * @returns null if valid, or error details if invalid
 */
export function validateUnsignedBigInt(
  value: bigint,
  max: bigint
): IntegerValidationError | null {
  if (value < 0n || value > max) {
    return { kind: "out_of_range", value, min: 0n, max };
  }
  return null;
}

/**
 * Validate a signed bigint (i64, i128) is within range.
 * @returns null if valid, or error details if invalid
 */
export function validateSignedBigInt(
  value: bigint,
  min: bigint,
  max: bigint
): IntegerValidationError | null {
  if (value < min || value > max) {
    return { kind: "out_of_range", value, min, max };
  }
  return null;
}
