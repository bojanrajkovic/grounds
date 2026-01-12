// pattern: Functional Core

/**
 * Error type for encoding failures.
 *
 * Provides factory methods for specific error conditions encountered during encoding.
 * All EncodeError instances include a descriptive message property.
 * @group Error Handling
 *
 * @example
 * Handling encode errors:
 * ```typescript
 * import { encode, Struct, U8 } from '@grounds/core';
 *
 * const invalidStruct = Struct(new Map([
 *   [5, U8(1)],
 *   [2, U8(2)]  // Out of order! Should be sorted by field ID
 * ]));
 *
 * encode(invalidStruct).match(
 *   (bytes) => console.log('Encoded'),
 *   (error) => {
 *     console.error(error.message); // "Struct fields must be sorted"
 *   }
 * );
 * ```
 *
 * @remarks
 * Encode errors indicate programmer errors (invalid input structure), not I/O failures.
 * Common errors include unsorted struct fields, invalid field IDs, and unsupported types.
 */
export class EncodeError extends Error {
  override readonly name = "EncodeError";

  constructor(message: string) {
    super(message);
  }

  static unsortedFields(previousId: number, currentId: number): EncodeError {
    return new EncodeError(
      `struct fields must be in ascending order: field ${previousId} followed by field ${currentId}`
    );
  }

  static invalidFieldId(fieldId: number): EncodeError {
    return new EncodeError(
      `field ID ${fieldId} is invalid: bit 7 must not be set`
    );
  }

  static invalidTypeCode(typeCode: number): EncodeError {
    return new EncodeError(
      `type code 0x${typeCode.toString(16)} is invalid: bit 7 must not be set`
    );
  }

  static unsupportedType(typeName: string): EncodeError {
    return new EncodeError(`unsupported schema type: ${typeName}`);
  }

  static unknownVariant(variantName: string): EncodeError {
    return new EncodeError(`unknown enum variant: ${variantName}`);
  }

  /**
   * Error for integer values that exceed type-specific bounds.
   *
   * This error is part of encoder defense-in-depth validation: even if a value
   * somehow bypasses value constructor validation, the encoder re-validates integer
   * ranges before writing bytes. This ensures wire format correctness.
   *
   * @param typeName - The integer type name (e.g., "u8", "i64")
   * @param value - The out-of-range value that failed validation
   * @param min - The minimum valid value for the type
   * @param max - The maximum valid value for the type
   * @returns EncodeError describing the range violation
   */
  static integerOutOfRange(typeName: string, value: number | bigint, min: number | bigint, max: number | bigint): EncodeError {
    return new EncodeError(
      `${typeName} value ${value} is out of range (${min} to ${max})`
    );
  }

  /**
   * Error for non-integer number values in integer types.
   *
   * This error is part of encoder defense-in-depth validation: the encoder validates
   * that floating-point numbers like 3.14 are rejected for integer type codes.
   * This ensures only whole numbers are encoded in integer fields.
   *
   * @param typeName - The integer type name (e.g., "u32", "i64")
   * @param value - The non-integer number that failed validation
   * @returns EncodeError describing the non-integer value
   */
  static notAnInteger(typeName: string, value: number): EncodeError {
    return new EncodeError(
      `${typeName} value must be an integer, got ${value}`
    );
  }
}

/**
 * Discriminated union of all possible decode error codes.
 *
 * Enables exhaustive error handling via switch statements or type guards.
 *
 * @example
 * ```typescript
 * import type { DecodeErrorCode } from '@grounds/core';
 *
 * function handleError(code: DecodeErrorCode): string {
 *   switch (code) {
 *     case 'UNEXPECTED_EOF':
 *       return 'Data truncated';
 *     case 'INVALID_TYPE_CODE':
 *       return 'Unknown type';
 *     case 'DUPLICATE_MAP_KEY':
 *       return 'Duplicate key in map';
 *     // ... handle all cases
 *     default:
 *       const _exhaustive: never = code;
 *       return 'Unknown error';
 *   }
 * }
 * ```
 */
export type DecodeErrorCode =
  | "UNEXPECTED_EOF"
  | "INVALID_TYPE_CODE"
  | "INVALID_LENGTH"
  | "INVALID_UTF8"
  | "INTEGER_OVERFLOW"
  | "TRUNCATED_STREAM"
  | "UNSORTED_FIELDS"
  | "DUPLICATE_MAP_KEY"
  | "ENUM_LENGTH_MISMATCH"
  | "INVALID_FIELD_ID"
  | "INVALID_VARIANT_ID"
  | "MISSING_REQUIRED_FIELD"
  | "UNKNOWN_VARIANT_ID"
  | "UNSUPPORTED_TYPE";

/**
 * Error type for decoding failures with structured error codes.
 *
 * Provides factory methods for specific decode failures and includes a `code` property
 * for programmatic error classification. Use the code property to distinguish error types.
 * @group Error Handling
 *
 * @example
 * Handling specific decode errors:
 * ```typescript
 * import { decode, DecodeErrorCode } from '@grounds/core';
 *
 * const bytes = new Uint8Array([0x02]); // U8 but missing value byte
 *
 * decode(bytes).match(
 *   (value) => console.log('Decoded:', value),
 *   (error) => {
 *     switch (error.code) {
 *       case 'UNEXPECTED_EOF':
 *         console.error('Truncated data');
 *         break;
 *       case 'INVALID_UTF8':
 *         console.error('Bad string encoding');
 *         break;
 *       default:
 *         console.error('Other error:', error.message);
 *     }
 *   }
 * );
 * ```
 *
 * @remarks
 * DecodeError.code enables robust error handling for different failure modes:
 * - Wire format violations (INVALID_TYPE_CODE, INVALID_LENGTH)
 * - Data corruption (INVALID_UTF8, UNEXPECTED_EOF)
 * - Constraint violations (UNSORTED_FIELDS, DUPLICATE_MAP_KEY)
 */
export class DecodeError extends Error {
  override readonly name = "DecodeError";
  readonly code: DecodeErrorCode;

  constructor(code: DecodeErrorCode, message: string) {
    super(message);
    this.code = code;
  }

  static unexpectedEnd(expected: number, available: number): DecodeError {
    return new DecodeError(
      "UNEXPECTED_EOF",
      `expected ${expected} bytes but only ${available} available`
    );
  }

  static unknownTypeCode(typeCode: number): DecodeError {
    return new DecodeError(
      "INVALID_TYPE_CODE",
      `unknown type code: 0x${typeCode.toString(16)}`
    );
  }

  static invalidTypeCode(typeCode: number): DecodeError {
    return new DecodeError(
      "INVALID_TYPE_CODE",
      `type code 0x${typeCode.toString(16)} is invalid: bit 7 must not be set`
    );
  }

  static unsortedFields(previousId: number, currentId: number): DecodeError {
    return new DecodeError(
      "UNSORTED_FIELDS",
      `struct fields must be in ascending order: field ${previousId} followed by field ${currentId}`
    );
  }

  static duplicateMapKey(): DecodeError {
    return new DecodeError("DUPLICATE_MAP_KEY", "map contains duplicate keys");
  }

  static invalidUtf8(): DecodeError {
    return new DecodeError("INVALID_UTF8", "string contains invalid UTF-8");
  }

  static enumLengthMismatch(
    declaredLength: number,
    actualLength: number
  ): DecodeError {
    return new DecodeError(
      "ENUM_LENGTH_MISMATCH",
      `enum variant content length ${actualLength} does not match declared length ${declaredLength}`
    );
  }

  static invalidFieldId(fieldId: number): DecodeError {
    return new DecodeError(
      "INVALID_FIELD_ID",
      `field ID ${fieldId} is invalid: bit 7 must not be set`
    );
  }

  static invalidVariantId(variantId: number): DecodeError {
    return new DecodeError(
      "INVALID_VARIANT_ID",
      `variant ID ${variantId} is invalid: bit 7 must not be set`
    );
  }

  static missingRequiredField(fieldId: number): DecodeError {
    return new DecodeError(
      "MISSING_REQUIRED_FIELD",
      `missing required field with ID ${fieldId}`
    );
  }

  static unknownVariantId(variantId: number): DecodeError {
    return new DecodeError(
      "UNKNOWN_VARIANT_ID",
      `unknown variant ID ${variantId}`
    );
  }

  static unsupportedType(typeName: string): DecodeError {
    return new DecodeError(
      "UNSUPPORTED_TYPE",
      `unsupported schema type: ${typeName}`
    );
  }

  static truncatedStream(context: string): DecodeError {
    return new DecodeError(
      "TRUNCATED_STREAM",
      `truncated stream: incomplete value at end of input (${context})`
    );
  }
}
