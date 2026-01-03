// pattern: Functional Core

/**
 * Error thrown when encoding a value fails.
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
}

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
 * Error thrown when decoding bytes fails.
 */
export class DecodeError extends Error {
  override readonly name = "DecodeError";
  readonly code: DecodeErrorCode;

  constructor(code: DecodeErrorCode | string, message?: string) {
    // Support both old (message-only) and new (code, message) signatures
    if (message === undefined) {
      // Old signature: DecodeError(message)
      super(code);
      this.code = "UNEXPECTED_EOF"; // Default code for backward compatibility
    } else {
      // New signature: DecodeError(code, message)
      super(message);
      this.code = code as DecodeErrorCode;
    }
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
