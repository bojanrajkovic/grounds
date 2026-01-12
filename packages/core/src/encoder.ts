// pattern: Functional Core
import { Result, ok, err } from "neverthrow";
import type {
  RelishValue,
  RelishArray,
  RelishMap,
  RelishStruct,
  RelishEnum,
} from "./types.js";
import { TypeCode } from "./types.js";
import { EncodeError } from "./errors.js";
import { encodeTaggedVarint, getTypeCodeForValue } from "./encoding-helpers.js";
import {
  U8_MAX,
  U16_MAX,
  U32_MAX,
  U64_MAX,
  U128_MAX,
  I8_MIN,
  I8_MAX,
  I16_MIN,
  I16_MAX,
  I32_MIN,
  I32_MAX,
  I64_MIN,
  I64_MAX,
  I128_MIN,
  I128_MAX,
  validateUnsignedNumber,
  validateSignedNumber,
  validateUnsignedBigInt,
  validateSignedBigInt,
  type IntegerValidationError,
} from "./integer-bounds.js";

/**
 * Convert an IntegerValidationError to a Result with EncodeError.
 * Returns ok(undefined) if no error, or err(EncodeError) if validation failed.
 */
function toValidationResult(
  typeName: string,
  error: IntegerValidationError | null
): Result<void, EncodeError> {
  if (error === null) {
    return ok(undefined);
  }
  if (error.kind === "not_integer") {
    return err(EncodeError.notAnInteger(typeName, error.value));
  } else {
    return err(EncodeError.integerOutOfRange(typeName, error.value, error.min, error.max));
  }
}

/**
 * Encodes a Relish value to binary bytes in wire format.
 *
 * Converts a typed Relish value into its binary representation using the Relish
 * wire format. Uses a reusable internal Encoder with a pre-allocated buffer
 * for efficient encoding.
 *
 * @param value - The RelishValue to encode (discriminated union of all Relish types)
 * @returns A Result containing the encoded bytes on success, or an EncodeError on failure
 * @group Encoding
 *
 * @example
 * ```typescript
 * import { encode, U32, String_ } from '@grounds/core';
 *
 * // Encode a simple value
 * const result = encode(U32(42));
 * result.match(
 *   (bytes) => console.log('Encoded:', Array.from(bytes)),
 *   (error) => console.error('Failed:', error.message)
 * );
 *
 * // Encode a string
 * encode(String_('hello')).match(
 *   (bytes) => console.log('String encoded to', bytes.length, 'bytes'),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @remarks
 * The function uses neverthrow's `Result` type for error handling. All errors
 * are captured in the Result and never thrown. The signature is `never -> throws`
 * (uses error handling at callsite, not exceptions).
 *
 * **Defense-in-depth validation**: The encoder re-validates integer ranges even
 * if a value somehow bypasses constructor validation. This ensures wire format
 * correctness by catching non-integer floats (e.g., 3.14) and out-of-range values
 * before they are encoded.
 *
 * For encoding composite types, ensure:
 * - Struct fields are in ascending field ID order (0-127)
 * - Array/Map element types match the type specification
 * - All values are readonly RelishValue objects
 *
 * @see {@link Encoder} for reusable encoding with performance tuning
 * @see {@link decode} for the inverse operation (bytes to value)
 */
export function encode(value: RelishValue): Result<Uint8Array, EncodeError> {
  const encoder = new Encoder();
  return encoder.encode(value);
}

/**
 * Reusable binary encoder with pre-allocated buffer for high-performance encoding.
 *
 * The Encoder class provides stateful encoding with an internal buffer that grows
 * dynamically as needed. Reusing a single Encoder instance avoids repeated buffer
 * allocation overhead for batch encoding operations.
 * @group Encoding
 *
 * @example
 * ```typescript
 * import { Encoder, U8, String_ } from '@grounds/core';
 *
 * // Create encoder once, reuse for multiple values
 * const encoder = new Encoder();
 *
 * const val1 = encoder.encode(U8(42));
 * const val2 = encoder.encode(String_('hello'));
 * const val3 = encoder.encode(U8(255));
 *
 * // Each .encode() call resets the internal position and returns fresh bytes
 * val1.match(
 *   (bytes1) => console.log('First:', bytes1.length),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @remarks
 * The Encoder maintains a resizable internal buffer that grows when needed to
 * accommodate larger values. The buffer is NOT cleared between calls; only the
 * position is reset. This design prioritizes performance over memory footprint
 * for the common case of encoding multiple similar-sized values.
 *
 * **Integer validation**: The encoder performs defense-in-depth validation on
 * all integer values, re-checking ranges and rejecting non-integer floats even
 * if value constructors are somehow bypassed. This ensures wire format integrity.
 *
 * Initialize with a custom size for better memory efficiency if encoding many
 * small values: `new Encoder(256)` instead of the default 1024 bytes.
 */
export class Encoder {
  private buffer: Uint8Array;
  private view: DataView;
  private position: number;

  constructor(initialSize: number = 1024) {
    this.buffer = new Uint8Array(initialSize);
    this.view = new DataView(this.buffer.buffer);
    this.position = 0;
  }

  /**
   * Encodes a single RelishValue to bytes.
   *
   * Resets the internal position and encodes the value, returning a slice of
   * the internal buffer containing only the bytes needed for this value. Each
   * call produces fresh bytes independent of previous calls.
   *
   * @param value - The RelishValue to encode
   * @returns A Result containing the encoded bytes, or an EncodeError on failure
   *
   * @remarks
   * The returned bytes are a fresh slice, not a view into the internal buffer.
   * Safe to retain across multiple .encode() calls without risk of data corruption.
   */
  encode(value: RelishValue): Result<Uint8Array, EncodeError> {
    this.position = 0;
    return this.encodeValue(value).map(() => this.getResult());
  }

  private getResult(): Uint8Array {
    return this.buffer.slice(0, this.position);
  }

  private ensureCapacity(needed: number): void {
    const required = this.position + needed;
    if (required > this.buffer.length) {
      const newSize = Math.max(this.buffer.length * 2, required);
      const newBuffer = new Uint8Array(newSize);
      newBuffer.set(this.buffer);
      this.buffer = newBuffer;
      this.view = new DataView(this.buffer.buffer);
    }
  }

  private writeByte(byte: number): void {
    this.ensureCapacity(1);
    this.buffer[this.position++] = byte;
  }

  private writeBytes(bytes: Uint8Array): void {
    this.ensureCapacity(bytes.length);
    this.buffer.set(bytes, this.position);
    this.position += bytes.length;
  }

  private encodeValue(value: RelishValue): Result<void, EncodeError> {
    const typeCode = getTypeCodeForValue(value);
    this.writeByte(typeCode);

    switch (value.type) {
      case "null":
        return ok(undefined);

      case "bool":
        // Rust: true = 0xFF, false = 0x00
        this.writeByte(value.value ? 0xff : 0x00);
        return ok(undefined);

      case "u8":
        return toValidationResult("u8", validateUnsignedNumber(value.value, U8_MAX)).map(() => {
          this.writeByte(value.value);
        });

      case "u16":
        return toValidationResult("u16", validateUnsignedNumber(value.value, U16_MAX)).map(() => {
          this.ensureCapacity(2);
          this.view.setUint16(this.position, value.value, true);
          this.position += 2;
        });

      case "u32":
        return toValidationResult("u32", validateUnsignedNumber(value.value, U32_MAX)).map(() => {
          this.ensureCapacity(4);
          this.view.setUint32(this.position, value.value, true);
          this.position += 4;
        });

      case "u64":
        return toValidationResult("u64", validateUnsignedBigInt(value.value, U64_MAX)).map(() => {
          this.encodeBigIntLE(value.value, 8);
        });

      case "u128":
        return toValidationResult("u128", validateUnsignedBigInt(value.value, U128_MAX)).map(() => {
          this.encodeBigIntLE(value.value, 16);
        });

      case "i8":
        return toValidationResult("i8", validateSignedNumber(value.value, I8_MIN, I8_MAX)).map(() => {
          this.writeByte(value.value & 0xff);
        });

      case "i16":
        return toValidationResult("i16", validateSignedNumber(value.value, I16_MIN, I16_MAX)).map(() => {
          this.ensureCapacity(2);
          this.view.setInt16(this.position, value.value, true);
          this.position += 2;
        });

      case "i32":
        return toValidationResult("i32", validateSignedNumber(value.value, I32_MIN, I32_MAX)).map(() => {
          this.ensureCapacity(4);
          this.view.setInt32(this.position, value.value, true);
          this.position += 4;
        });

      case "i64":
        return toValidationResult("i64", validateSignedBigInt(value.value, I64_MIN, I64_MAX)).map(() => {
          this.encodeBigIntLE(value.value, 8);
        });

      case "i128":
        return toValidationResult("i128", validateSignedBigInt(value.value, I128_MIN, I128_MAX)).map(() => {
          this.encodeBigIntLE(value.value, 16);
        });

      case "f32":
        this.ensureCapacity(4);
        this.view.setFloat32(this.position, value.value, true);
        this.position += 4;
        return ok(undefined);

      case "f64":
        this.ensureCapacity(8);
        this.view.setFloat64(this.position, value.value, true);
        this.position += 8;
        return ok(undefined);

      case "string":
        return this.encodeString(value.value);

      case "timestamp":
        this.encodeBigIntLE(value.unixSeconds, 8);
        return ok(undefined);

      case "array":
        return this.encodeArray(value);

      case "map":
        return this.encodeMap(value);

      case "struct":
        return this.encodeStruct(value);

      case "enum":
        return this.encodeEnum(value);

      default: {
        // Exhaustiveness check - should never reach here with valid RelishValue
        const _exhaustive: never = value;
        return err(EncodeError.unsupportedType(String(_exhaustive)));
      }
    }
  }

  private encodeBigIntLE(value: bigint, byteLength: number): void {
    this.ensureCapacity(byteLength);
    const mask = (1n << BigInt(byteLength * 8)) - 1n;
    let unsigned = value < 0n ? (value & mask) : value;

    for (let i = 0; i < byteLength; i++) {
      this.buffer[this.position++] = Number(unsigned & 0xffn);
      unsigned >>= 8n;
    }
  }

  private encodeString(str: string): Result<void, EncodeError> {
    const bytes = new TextEncoder().encode(str);
    const lengthBytes = encodeTaggedVarint(bytes.length);
    this.writeBytes(lengthBytes);
    this.writeBytes(bytes);
    return ok(undefined);
  }

  private encodeArray(value: RelishArray): Result<void, EncodeError> {
    // First encode all elements to get content
    const contentEncoder = new Encoder();
    contentEncoder.writeByte(value.elementType);
    for (const element of value.elements) {
      // Array elements hold raw JS values for primitive types, RelishValue for composite types
      const result = contentEncoder.encodeRawValue(value.elementType, element);
      if (result.isErr()) return result;
    }
    const content = contentEncoder.getResult();

    // Write length + content
    const lengthBytes = encodeTaggedVarint(content.length);
    this.writeBytes(lengthBytes);
    this.writeBytes(content);
    return ok(undefined);
  }

  private encodeMap(value: RelishMap): Result<void, EncodeError> {
    // First encode all entries to get content
    const contentEncoder = new Encoder();
    contentEncoder.writeByte(value.keyType);
    contentEncoder.writeByte(value.valueType);
    for (const [key, val] of value.entries) {
      // Map entries hold raw JS values for primitive types, RelishValue for composite types
      const keyResult = contentEncoder.encodeRawValue(value.keyType, key);
      if (keyResult.isErr()) return keyResult;
      const valResult = contentEncoder.encodeRawValue(value.valueType, val);
      if (valResult.isErr()) return valResult;
    }
    const content = contentEncoder.getResult();

    const lengthBytes = encodeTaggedVarint(content.length);
    this.writeBytes(lengthBytes);
    this.writeBytes(content);
    return ok(undefined);
  }

  private encodeStruct(value: RelishStruct): Result<void, EncodeError> {
    // First encode all fields to get content length
    const contentEncoder = new Encoder();

    const sortedFields = [...value.fields.entries()].sort(([a], [b]) => a - b);

    let previousId = -1;
    for (const [fieldId, fieldValue] of sortedFields) {
      if (fieldId <= previousId) {
        return err(EncodeError.unsortedFields(previousId, fieldId));
      }
      if (fieldId > 127) {
        return err(EncodeError.invalidFieldId(fieldId));
      }
      previousId = fieldId;

      contentEncoder.writeByte(fieldId);
      const result = contentEncoder.encodeValue(fieldValue);
      if (result.isErr()) return result;
    }

    const content = contentEncoder.getResult();
    const lengthBytes = encodeTaggedVarint(content.length);
    this.writeBytes(lengthBytes);
    this.writeBytes(content);
    return ok(undefined);
  }

  private encodeEnum(value: RelishEnum): Result<void, EncodeError> {
    if (value.variantId > 127) {
      return err(EncodeError.invalidFieldId(value.variantId));
    }

    // Encode variant content: variant ID + full value encoding
    const contentEncoder = new Encoder();
    contentEncoder.writeByte(value.variantId);
    const innerResult = contentEncoder.encodeValue(value.value);
    if (innerResult.isErr()) return err(innerResult.error);
    const content = contentEncoder.getResult();

    const lengthBytes = encodeTaggedVarint(content.length);
    this.writeBytes(lengthBytes);
    this.writeBytes(content);
    return ok(undefined);
  }

  /**
   * Encode a raw value (JS primitive or RelishValue) based on its TypeCode.
   * For primitive types, value is the raw JS value (number, bigint, string, etc.)
   * For composite types (Array, Map, Struct, Enum), value is a RelishValue.
   */
  private encodeRawValue(typeCode: TypeCode, value: unknown): Result<void, EncodeError> {
    switch (typeCode) {
      case TypeCode.Null:
        return ok(undefined);
      case TypeCode.Bool:
        this.writeByte((value as boolean) ? 0xff : 0x00);
        return ok(undefined);
      case TypeCode.U8:
        this.writeByte(value as number);
        return ok(undefined);
      case TypeCode.U16:
        this.ensureCapacity(2);
        this.view.setUint16(this.position, value as number, true);
        this.position += 2;
        return ok(undefined);
      case TypeCode.U32:
        this.ensureCapacity(4);
        this.view.setUint32(this.position, value as number, true);
        this.position += 4;
        return ok(undefined);
      case TypeCode.U64:
        this.encodeBigIntLE(value as bigint, 8);
        return ok(undefined);
      case TypeCode.U128:
        this.encodeBigIntLE(value as bigint, 16);
        return ok(undefined);
      case TypeCode.I8:
        this.writeByte((value as number) & 0xff);
        return ok(undefined);
      case TypeCode.I16:
        this.ensureCapacity(2);
        this.view.setInt16(this.position, value as number, true);
        this.position += 2;
        return ok(undefined);
      case TypeCode.I32:
        this.ensureCapacity(4);
        this.view.setInt32(this.position, value as number, true);
        this.position += 4;
        return ok(undefined);
      case TypeCode.I64:
        this.encodeBigIntLE(value as bigint, 8);
        return ok(undefined);
      case TypeCode.I128:
        this.encodeBigIntLE(value as bigint, 16);
        return ok(undefined);
      case TypeCode.F32:
        this.ensureCapacity(4);
        this.view.setFloat32(this.position, value as number, true);
        this.position += 4;
        return ok(undefined);
      case TypeCode.F64:
        this.ensureCapacity(8);
        this.view.setFloat64(this.position, value as number, true);
        this.position += 8;
        return ok(undefined);
      case TypeCode.String: {
        const bytes = new TextEncoder().encode(value as string);
        const lengthBytes = encodeTaggedVarint(bytes.length);
        this.writeBytes(lengthBytes);
        this.writeBytes(bytes);
        return ok(undefined);
      }
      case TypeCode.Timestamp:
        this.encodeBigIntLE(value as bigint, 8);
        return ok(undefined);
      case TypeCode.Array:
        // Composite types: encode [L]V without type code (already in container header)
        return this.encodeArray(value as RelishArray);
      case TypeCode.Map:
        return this.encodeMap(value as RelishMap);
      case TypeCode.Struct:
        return this.encodeStruct(value as RelishStruct);
      case TypeCode.Enum:
        return this.encodeEnum(value as RelishEnum);
      default:
        return err(EncodeError.invalidTypeCode(typeCode));
    }
  }
}
