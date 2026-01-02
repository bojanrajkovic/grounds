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
}

/**
 * Error thrown when decoding bytes fails.
 */
export class DecodeError extends Error {
  override readonly name = "DecodeError";

  constructor(message: string) {
    super(message);
  }

  static unexpectedEnd(expected: number, available: number): DecodeError {
    return new DecodeError(
      `expected ${expected} bytes but only ${available} available`
    );
  }

  static unknownTypeCode(typeCode: number): DecodeError {
    return new DecodeError(`unknown type code: 0x${typeCode.toString(16)}`);
  }

  static invalidTypeCode(typeCode: number): DecodeError {
    return new DecodeError(
      `type code 0x${typeCode.toString(16)} is invalid: bit 7 must not be set`
    );
  }

  static unsortedFields(previousId: number, currentId: number): DecodeError {
    return new DecodeError(
      `struct fields must be in ascending order: field ${previousId} followed by field ${currentId}`
    );
  }

  static duplicateMapKey(): DecodeError {
    return new DecodeError("map contains duplicate keys");
  }

  static invalidUtf8(): DecodeError {
    return new DecodeError("string contains invalid UTF-8");
  }

  static enumLengthMismatch(
    declaredLength: number,
    actualLength: number
  ): DecodeError {
    return new DecodeError(
      `enum variant content length ${actualLength} does not match declared length ${declaredLength}`
    );
  }
}
