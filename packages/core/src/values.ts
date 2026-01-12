// pattern: Functional Core

/**
 * Type-safe value constructors for creating Relish values with runtime validation.
 * @module
 */

import type {
  RelishValue,
  RelishNull,
  RelishBool,
  RelishU8,
  RelishU16,
  RelishU32,
  RelishU64,
  RelishU128,
  RelishI8,
  RelishI16,
  RelishI32,
  RelishI64,
  RelishI128,
  RelishF32,
  RelishF64,
  RelishString,
  RelishArray,
  RelishMap,
  RelishStruct,
  RelishEnum,
  RelishTimestamp,
  TypeCodeToJsType,
  MapInput,
} from "./types.js";
import { TypeCode, RELISH_BRAND } from "./types.js";
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
 * Convert a validation error to a thrown Error for value constructors.
 * @internal
 */
function throwValidationError(typeName: string, error: IntegerValidationError): never {
  if (error.kind === "not_integer") {
    throw new Error(`${typeName} value must be an integer: ${error.value}`);
  } else {
    throw new Error(`${typeName} value out of range: ${error.value}`);
  }
}

/**
 * Singleton null value.
 * @group Value Constructors
 *
 * @example
 * ```typescript
 * import { Null, encode } from '@grounds/core';
 *
 * const result = encode(Null);
 * ```
 */
export const Null: RelishNull = { [RELISH_BRAND]: true, type: "null" };

/**
 * Creates a boolean Relish value.
 * @group Value Constructors
 *
 * @param value - JavaScript boolean
 * @returns RelishBool value
 *
 * @example
 * ```typescript
 * import { Bool, encode } from '@grounds/core';
 *
 * const trueValue = Bool(true);
 * const falseValue = Bool(false);
 *
 * encode(trueValue); // -> [0x01, 0xff]
 * encode(falseValue); // -> [0x01, 0x00]
 * ```
 */
export function Bool(value: boolean): RelishBool {
  return { [RELISH_BRAND]: true, type: "bool", value };
}

/**
 * Creates an unsigned 8-bit integer Relish value.
 *
 * @group Value Constructors
 *
 * @param value - Integer in range 0-255
 * @returns RelishU8 value
 * @throws Error if value is not an integer or out of range
 *
 * @example
 * ```typescript
 * import { U8 } from '@grounds/core';
 *
 * const valid = U8(42);     // OK
 * const edge = U8(255);     // OK (max value)
 * const zero = U8(0);       // OK (min value)
 *
 * // Runtime errors:
 * // U8(-1)    // Error: out of range
 * // U8(256)   // Error: out of range
 * // U8(3.14)  // Error: not an integer
 * ```
 */
export function U8(value: number): RelishU8 {
  const error = validateUnsignedNumber(value, U8_MAX);
  if (error) {
    throwValidationError("U8", error);
  }
  return { [RELISH_BRAND]: true, type: "u8", value };
}

/**
 * Creates an unsigned 16-bit integer Relish value.
 *
 * @group Value Constructors
 *
 * @param value - Integer in range 0-65535
 * @returns RelishU16 value
 * @throws Error if value is not an integer or out of range
 *
 * @example
 * ```typescript
 * import { U16 } from '@grounds/core';
 *
 * const valid = U16(1000);   // OK
 * const edge = U16(65535);   // OK (max value)
 * const zero = U16(0);       // OK (min value)
 *
 * // Runtime errors:
 * // U16(-1)    // Error: out of range
 * // U16(65536) // Error: out of range
 * // U16(3.14)  // Error: not an integer
 * ```
 *
 * @see {@link U8} for 8-bit unsigned
 * @see {@link U32} for 32-bit unsigned
 */
export function U16(value: number): RelishU16 {
  const error = validateUnsignedNumber(value, U16_MAX);
  if (error) {
    throwValidationError("U16", error);
  }
  return { [RELISH_BRAND]: true, type: "u16", value };
}

/**
 * Creates an unsigned 32-bit integer Relish value.
 *
 * @group Value Constructors
 *
 * @param value - Integer in range 0-4294967295
 * @returns RelishU32 value
 * @throws Error if value is not an integer or out of range
 *
 * @example
 * ```typescript
 * import { U32 } from '@grounds/core';
 *
 * const valid = U32(1000000);   // OK
 * const edge = U32(4294967295); // OK (max value)
 * const zero = U32(0);          // OK (min value)
 *
 * // Runtime errors:
 * // U32(-1)        // Error: out of range
 * // U32(4294967296) // Error: out of range
 * ```
 *
 * @see {@link U16} for 16-bit unsigned
 * @see {@link U64} for 64-bit unsigned
 */
export function U32(value: number): RelishU32 {
  const error = validateUnsignedNumber(value, U32_MAX);
  if (error) {
    throwValidationError("U32", error);
  }
  return { [RELISH_BRAND]: true, type: "u32", value };
}

/**
 * Creates an unsigned 64-bit integer Relish value using JavaScript BigInt.
 *
 * Use this for large integers beyond JavaScript's safe integer range (2^53-1).
 *
 * @group Value Constructors
 *
 * @param value - BigInt in range 0-18446744073709551615
 * @returns RelishU64 value
 * @throws Error if value is out of range
 *
 * @example
 * ```typescript
 * import { U64 } from '@grounds/core';
 *
 * const valid = U64(BigInt('9007199254740992'));
 * const max = U64(BigInt('18446744073709551615'));
 * const zero = U64(0n);
 *
 * // Runtime errors:
 * // U64(-1n) // Error: out of range
 * // U64(BigInt('18446744073709551616')) // Error: out of range
 * ```
 *
 * @see {@link U32} for 32-bit unsigned
 * @see {@link U128} for 128-bit unsigned
 */
export function U64(value: bigint): RelishU64 {
  const error = validateUnsignedBigInt(value, U64_MAX);
  if (error) {
    throwValidationError("U64", error);
  }
  return { [RELISH_BRAND]: true, type: "u64", value };
}

/**
 * Creates an unsigned 128-bit integer Relish value using JavaScript BigInt.
 *
 * Use for extremely large unsigned integers not representable in 64 bits.
 *
 * @group Value Constructors
 *
 * @param value - BigInt in range 0-340282366920938463463374607431768211455
 * @returns RelishU128 value
 * @throws Error if value is out of range
 *
 * @example
 * ```typescript
 * import { U128 } from '@grounds/core';
 *
 * const valid = U128(BigInt('340282366920938463463374607431768211455'));
 * const zero = U128(0n);
 *
 * // Runtime errors:
 * // U128(-1n) // Error: out of range
 * // U128(BigInt('340282366920938463463374607431768211456')) // Error: out of range
 * ```
 *
 * @see {@link U64} for 64-bit unsigned
 */
export function U128(value: bigint): RelishU128 {
  const error = validateUnsignedBigInt(value, U128_MAX);
  if (error) {
    throwValidationError("U128", error);
  }
  return { [RELISH_BRAND]: true, type: "u128", value };
}

/**
 * Creates a signed 8-bit integer Relish value.
 *
 * @group Value Constructors
 *
 * @param value - Integer in range -128 to 127
 * @returns RelishI8 value
 * @throws Error if value is not an integer or out of range
 *
 * @example
 * ```typescript
 * import { I8 } from '@grounds/core';
 *
 * const valid = I8(-42);    // OK
 * const max = I8(127);      // OK (max value)
 * const min = I8(-128);     // OK (min value)
 *
 * // Runtime errors:
 * // I8(-129) // Error: out of range
 * // I8(128)  // Error: out of range
 * // I8(3.14) // Error: not an integer
 * ```
 *
 * @see {@link U8} for unsigned 8-bit
 * @see {@link I16} for 16-bit signed
 */
export function I8(value: number): RelishI8 {
  const error = validateSignedNumber(value, I8_MIN, I8_MAX);
  if (error) {
    throwValidationError("I8", error);
  }
  return { [RELISH_BRAND]: true, type: "i8", value };
}

/**
 * Creates a signed 16-bit integer Relish value.
 *
 * @group Value Constructors
 *
 * @param value - Integer in range -32768 to 32767
 * @returns RelishI16 value
 * @throws Error if value is not an integer or out of range
 *
 * @example
 * ```typescript
 * import { I16 } from '@grounds/core';
 *
 * const valid = I16(-1000);  // OK
 * const max = I16(32767);    // OK (max value)
 * const min = I16(-32768);   // OK (min value)
 *
 * // Runtime errors:
 * // I16(-32769) // Error: out of range
 * // I16(32768)  // Error: out of range
 * ```
 *
 * @see {@link I8} for 8-bit signed
 * @see {@link I32} for 32-bit signed
 */
export function I16(value: number): RelishI16 {
  const error = validateSignedNumber(value, I16_MIN, I16_MAX);
  if (error) {
    throwValidationError("I16", error);
  }
  return { [RELISH_BRAND]: true, type: "i16", value };
}

/**
 * Creates a signed 32-bit integer Relish value.
 *
 * @group Value Constructors
 *
 * @param value - Integer in range -2147483648 to 2147483647
 * @returns RelishI32 value
 * @throws Error if value is not an integer or out of range
 *
 * @example
 * ```typescript
 * import { I32 } from '@grounds/core';
 *
 * const valid = I32(-1000000);  // OK
 * const max = I32(2147483647);  // OK (max value)
 * const min = I32(-2147483648); // OK (min value)
 *
 * // Runtime errors:
 * // I32(-2147483649) // Error: out of range
 * // I32(2147483648)  // Error: out of range
 * ```
 *
 * @see {@link I16} for 16-bit signed
 * @see {@link I64} for 64-bit signed
 */
export function I32(value: number): RelishI32 {
  const error = validateSignedNumber(value, I32_MIN, I32_MAX);
  if (error) {
    throwValidationError("I32", error);
  }
  return { [RELISH_BRAND]: true, type: "i32", value };
}

/**
 * Creates a signed 64-bit integer Relish value using JavaScript BigInt.
 *
 * Use for large signed integers that exceed JavaScript's safe integer range (±2^53-1).
 *
 * @group Value Constructors
 *
 * @param value - BigInt in range -9223372036854775808 to 9223372036854775807
 * @returns RelishI64 value
 * @throws Error if value is out of range
 *
 * @example
 * ```typescript
 * import { I64 } from '@grounds/core';
 *
 * const valid = I64(BigInt('-9007199254740992'));
 * const max = I64(BigInt('9223372036854775807'));
 * const min = I64(BigInt('-9223372036854775808'));
 *
 * // Runtime errors:
 * // I64(BigInt('-9223372036854775809')) // Error: out of range
 * // I64(BigInt('9223372036854775808'))  // Error: out of range
 * ```
 *
 * @see {@link I32} for 32-bit signed
 * @see {@link I128} for 128-bit signed
 */
export function I64(value: bigint): RelishI64 {
  const error = validateSignedBigInt(value, I64_MIN, I64_MAX);
  if (error) {
    throwValidationError("I64", error);
  }
  return { [RELISH_BRAND]: true, type: "i64", value };
}

/**
 * Creates a signed 128-bit integer Relish value using JavaScript BigInt.
 *
 * Use for extremely large signed integers not representable in 64 bits.
 *
 * @group Value Constructors
 *
 * @param value - BigInt in range ±170141183460469231731687303715884105728
 * @returns RelishI128 value
 * @throws Error if value is out of range
 *
 * @example
 * ```typescript
 * import { I128 } from '@grounds/core';
 *
 * const valid = I128(BigInt('-170141183460469231731687303715884105728'));
 * const max = I128(BigInt('170141183460469231731687303715884105727'));
 *
 * // Runtime errors:
 * // I128(BigInt('-170141183460469231731687303715884105729')) // Error: out of range
 * // I128(BigInt('170141183460469231731687303715884105728'))  // Error: out of range
 * ```
 *
 * @see {@link I64} for 64-bit signed
 */
export function I128(value: bigint): RelishI128 {
  const error = validateSignedBigInt(value, I128_MIN, I128_MAX);
  if (error) {
    throwValidationError("I128", error);
  }
  return { [RELISH_BRAND]: true, type: "i128", value };
}

/**
 * Creates a 32-bit floating point Relish value.
 *
 * Represents single-precision IEEE 754 floating point numbers.
 * Note: JavaScript loses precision when encoding/decoding f32 since all numbers
 * are 64-bit internally. Decoded values may lose significant digits.
 *
 * @group Value Constructors
 *
 * @param value - A JavaScript number (will be encoded as f32 with potential precision loss)
 * @returns RelishF32 value
 *
 * @example
 * ```typescript
 * import { F32, encode } from '@grounds/core';
 *
 * const pi = F32(3.14159);
 * encode(pi).match(
 *   (bytes) => console.log('F32 encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @remarks
 * For high-precision requirements, use F64 instead.
 *
 * @see {@link F64} for 64-bit floating point
 */
export function F32(value: number): RelishF32 {
  return { [RELISH_BRAND]: true, type: "f32", value };
}

/**
 * Creates a 64-bit floating point Relish value.
 *
 * Represents double-precision IEEE 754 floating point numbers. This matches
 * JavaScript's native number type and preserves full precision for the range
 * of representable values.
 *
 * @group Value Constructors
 *
 * @param value - A JavaScript number
 * @returns RelishF64 value
 *
 * @example
 * ```typescript
 * import { F64, encode } from '@grounds/core';
 *
 * const euler = F64(2.71828);
 * encode(euler).match(
 *   (bytes) => console.log('F64 encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link F32} for 32-bit floating point
 */
export function F64(value: number): RelishF64 {
  return { [RELISH_BRAND]: true, type: "f64", value };
}

/**
 * Creates a string Relish value.
 *
 * The name has an underscore suffix to avoid shadowing the global String object.
 * Strings are encoded as UTF-8 with a variable-length size prefix using a
 * tagged varint: 7 bits for lengths 0-127, or 4 bytes for larger strings.
 *
 * @group Value Constructors
 *
 * @param value - A JavaScript string
 * @returns RelishString value
 *
 * @example
 * ```typescript
 * import { String_, encode } from '@grounds/core';
 *
 * const greeting = String_('hello world');
 * encode(greeting).match(
 *   (bytes) => console.log('String encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @remarks
 * Named String_ (with trailing underscore) to avoid shadowing the global String type.
 *
 * @see {@link U8} for creating other value types
 * @see {@link encode} for encoding the string to bytes
 */
export function String_(value: string): RelishString {
  return { [RELISH_BRAND]: true, type: "string", value };
}

/**
 * Validate that a value matches the expected JS type for a TypeCode.
 * Returns true if valid, false otherwise.
 */
function validateElementType(elementType: TypeCode, value: unknown): boolean {
  switch (elementType) {
    case TypeCode.Null:
      return value === null;
    case TypeCode.Bool:
      return typeof value === "boolean";
    case TypeCode.U8:
    case TypeCode.U16:
    case TypeCode.U32:
    case TypeCode.I8:
    case TypeCode.I16:
    case TypeCode.I32:
    case TypeCode.F32:
    case TypeCode.F64:
      return typeof value === "number";
    case TypeCode.U64:
    case TypeCode.U128:
    case TypeCode.I64:
    case TypeCode.I128:
    case TypeCode.Timestamp:
      return typeof value === "bigint";
    case TypeCode.String:
      return typeof value === "string";
    case TypeCode.Array:
    case TypeCode.Map:
    case TypeCode.Struct:
    case TypeCode.Enum:
      // Composite types expect RelishValue objects with a type property
      return (
        typeof value === "object" &&
        value !== null &&
        "type" in value &&
        typeof (value as { type: unknown }).type === "string"
      );
    default:
      return false;
  }
}

/**
 * Creates a homogeneous array Relish value.
 *
 * The name has an underscore suffix to avoid shadowing the global Array object.
 * All elements must be the same type specified by elementType. For primitive
 * element types, elements are raw JS values. For composite types (Array, Map,
 * Struct, Enum), elements are RelishValue objects.
 *
 * @param elementType - TypeCode specifying the type of all array elements
 * @group Value Constructors
 *
 * @param elements - Array of elements matching the elementType
 * @returns RelishArray value
 * @throws Error if any element does not match the expected type
 *
 * @example
 * ```typescript
 * import { Array_, U32, encode } from '@grounds/core';
 *
 * // Array of unsigned 32-bit integers
 * const numbers = Array_(0x04, [10, 20, 30]); // TypeCode.U32 = 0x04
 * encode(numbers).match(
 *   (bytes) => console.log('Array encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @remarks
 * Named Array_ (with trailing underscore) to avoid shadowing the global Array type.
 * Type validation is performed at runtime to catch mismatches early.
 *
 * @see {@link Map_} for heterogeneous key-value collections
 * @see {@link Struct} for fixed fields with different types
 */
export function Array_<T extends TypeCode>(
  elementType: T,
  elements: ReadonlyArray<TypeCodeToJsType<T>>
): RelishArray<T> {
  for (let i = 0; i < elements.length; i++) {
    if (!validateElementType(elementType, elements[i])) {
      throw new Error(
        `array element at index ${i} does not match expected type for type code ${elementType}`
      );
    }
  }
  return { [RELISH_BRAND]: true, type: "array", elementType, elements };
}

/**
 * Creates a homogeneous map Relish value.
 *
 * The name has an underscore suffix to avoid shadowing the global Map object.
 * All keys and values must match their respective types. For string keys, accepts
 * either Record<string, V> or Map for convenience. For non-string keys, requires
 * a native JavaScript Map.
 *
 * @param keyType - TypeCode specifying the type of all keys
 * @param valueType - TypeCode specifying the type of all values
 * @group Value Constructors
 *
 * @param input - Either a Record<string, V> (for string keys) or Map<K, V>
 * @returns RelishMap value
 * @throws Error if any key or value does not match the expected type
 *
 * @example
 * ```typescript
 * import { Map_, String_, U32, encode } from '@grounds/core';
 *
 * // Map with string keys and 32-bit integer values
 * const scores = Map_(
 *   0x0e,  // TypeCode.String
 *   0x04,  // TypeCode.U32
 *   { alice: 100, bob: 95 }
 * );
 * encode(scores).match(
 *   (bytes) => console.log('Map encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @remarks
 * Named Map_ (with trailing underscore) to avoid shadowing the global Map type.
 * For string keys, pass a plain object for ergonomics. For other key types,
 * use a Map. Type validation is performed at runtime.
 *
 * @see {@link Array_} for homogeneous collections without keys
 * @see {@link Struct} for fixed fields
 */
export function Map_<K extends TypeCode, V extends TypeCode>(
  keyType: K,
  valueType: V,
  input: MapInput<TypeCodeToJsType<K>, TypeCodeToJsType<V>>
): RelishMap<K, V> {
  const entries: ReadonlyMap<TypeCodeToJsType<K>, TypeCodeToJsType<V>> =
    input instanceof Map ? input : new Map(Object.entries(input) as Array<[TypeCodeToJsType<K>, TypeCodeToJsType<V>]>);

  for (const [key, value] of entries) {
    if (!validateElementType(keyType, key)) {
      throw new Error(
        `map key does not match expected type for type code ${keyType}`
      );
    }
    if (!validateElementType(valueType, value)) {
      throw new Error(
        `map value does not match expected type for type code ${valueType}`
      );
    }
  }
  return { [RELISH_BRAND]: true, type: "map", keyType, valueType, entries };
}

/**
 * Creates a struct Relish value.
 *
 * A struct is a heterogeneous collection of named fields, each with a numeric
 * field ID (0-127) and a RelishValue. Fields are encoded in ascending ID order.
 *
 * @group Value Constructors
 *
 * @param fields - Map of field ID to RelishValue for each field
 * @returns RelishStruct value
 *
 * @example
 * ```typescript
 * import { Struct, String_, U32, encode } from '@grounds/core';
 *
 * const person = Struct(new Map([
 *   [0, String_('Alice')],  // field 0: name
 *   [1, U32(30)]            // field 1: age
 * ]));
 * encode(person).match(
 *   (bytes) => console.log('Struct encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @remarks
 * Fields must be in ascending ID order during encoding. The Encoder enforces
 * this constraint and returns an error if violations occur. Field IDs must be
 * in range 0-127 (bit 7 must be clear).
 *
 * @see {@link Array_} for homogeneous ordered collections
 * @see {@link Map_} for homogeneous key-value collections
 * @see {@link Enum} for tagged unions
 */
export function Struct(fields: ReadonlyMap<number, RelishValue>): RelishStruct {
  return { [RELISH_BRAND]: true, type: "struct", fields };
}

/**
 * Creates an enum Relish value (tagged union).
 *
 * Enums represent one of several variants, each with a numeric ID (0-127) and
 * an associated value. The variant ID and value are encoded together.
 *
 * @param variantId - Numeric ID (0-127) identifying which variant is active
 * @group Value Constructors
 *
 * @param value - RelishValue for the active variant
 * @returns RelishEnum value
 *
 * @example
 * ```typescript
 * import { Enum, String_, U32, encode } from '@grounds/core';
 *
 * // Success variant with message
 * const success = Enum(0, String_('operation completed'));
 * encode(success).match(
 *   (bytes) => console.log('Success encoded:', bytes),
 *   (error) => console.error(error)
 * );
 *
 * // Error variant with code
 * const error_ = Enum(1, U32(404));
 * encode(error_).match(
 *   (bytes) => console.log('Error encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @remarks
 * Variant IDs must be in range 0-127 (bit 7 must be clear).
 *
 * @see {@link Struct} for heterogeneous fixed fields
 */
export function Enum(variantId: number, value: RelishValue): RelishEnum {
  return { [RELISH_BRAND]: true, type: "enum", variantId, value };
}

/**
 * Creates a timestamp Relish value.
 *
 * Timestamps represent Unix epoch time (seconds since 1970-01-01 00:00:00 UTC)
 * as a 64-bit signed integer. When decoded, produces a Luxon DateTime object.
 *
 * @group Value Constructors
 *
 * @param unixSeconds - BigInt representing seconds since Unix epoch
 * @returns RelishTimestamp value
 *
 * @example
 * ```typescript
 * import { Timestamp, encode } from '@grounds/core';
 *
 * // Encode current time
 * const now = BigInt(Math.floor(Date.now() / 1000));
 * const timestamp = Timestamp(now);
 * encode(timestamp).match(
 *   (bytes) => console.log('Timestamp encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @remarks
 * Precision is seconds (no milliseconds or microseconds). For nanosecond
 * precision, encode as a struct with separate second and nanosecond fields.
 *
 * @see {@link U64} for raw 64-bit integers
 */
export function Timestamp(unixSeconds: bigint): RelishTimestamp {
  return { [RELISH_BRAND]: true, type: "timestamp", unixSeconds };
}
