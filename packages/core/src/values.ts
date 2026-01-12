// pattern: Functional Core
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
 *
 * @example
 * ```typescript
 * import { Null, encode } from '@grounds/core';
 *
 * const result = encode(Null);
 * ```
 */
export const Null: RelishNull = { [RELISH_BRAND]: true, type: "null" };

/** Create a boolean value */
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

/** Create an unsigned 16-bit integer value */
export function U16(value: number): RelishU16 {
  const error = validateUnsignedNumber(value, U16_MAX);
  if (error) {
    throwValidationError("U16", error);
  }
  return { [RELISH_BRAND]: true, type: "u16", value };
}

/** Create an unsigned 32-bit integer value */
export function U32(value: number): RelishU32 {
  const error = validateUnsignedNumber(value, U32_MAX);
  if (error) {
    throwValidationError("U32", error);
  }
  return { [RELISH_BRAND]: true, type: "u32", value };
}

/** Create an unsigned 64-bit integer value */
export function U64(value: bigint): RelishU64 {
  const error = validateUnsignedBigInt(value, U64_MAX);
  if (error) {
    throwValidationError("U64", error);
  }
  return { [RELISH_BRAND]: true, type: "u64", value };
}

/** Create an unsigned 128-bit integer value */
export function U128(value: bigint): RelishU128 {
  const error = validateUnsignedBigInt(value, U128_MAX);
  if (error) {
    throwValidationError("U128", error);
  }
  return { [RELISH_BRAND]: true, type: "u128", value };
}

/** Create a signed 8-bit integer value */
export function I8(value: number): RelishI8 {
  const error = validateSignedNumber(value, I8_MIN, I8_MAX);
  if (error) {
    throwValidationError("I8", error);
  }
  return { [RELISH_BRAND]: true, type: "i8", value };
}

/** Create a signed 16-bit integer value */
export function I16(value: number): RelishI16 {
  const error = validateSignedNumber(value, I16_MIN, I16_MAX);
  if (error) {
    throwValidationError("I16", error);
  }
  return { [RELISH_BRAND]: true, type: "i16", value };
}

/** Create a signed 32-bit integer value */
export function I32(value: number): RelishI32 {
  const error = validateSignedNumber(value, I32_MIN, I32_MAX);
  if (error) {
    throwValidationError("I32", error);
  }
  return { [RELISH_BRAND]: true, type: "i32", value };
}

/** Create a signed 64-bit integer value */
export function I64(value: bigint): RelishI64 {
  const error = validateSignedBigInt(value, I64_MIN, I64_MAX);
  if (error) {
    throwValidationError("I64", error);
  }
  return { [RELISH_BRAND]: true, type: "i64", value };
}

/** Create a signed 128-bit integer value */
export function I128(value: bigint): RelishI128 {
  const error = validateSignedBigInt(value, I128_MIN, I128_MAX);
  if (error) {
    throwValidationError("I128", error);
  }
  return { [RELISH_BRAND]: true, type: "i128", value };
}

/** Create a 32-bit floating point value */
export function F32(value: number): RelishF32 {
  return { [RELISH_BRAND]: true, type: "f32", value };
}

/** Create a 64-bit floating point value */
export function F64(value: number): RelishF64 {
  return { [RELISH_BRAND]: true, type: "f64", value };
}

/** Create a string value (named String_ to avoid conflict with global String) */
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
 * Create an array value (named Array_ to avoid conflict with global Array).
 * For primitive element types, elements are raw JS values.
 * For composite element types (Array, Map, Struct, Enum), elements are RelishValue.
 *
 * @throws Error if any element does not match the expected type for elementType
 */
export function Array_<T extends TypeCode>(
  elementType: T,
  elements: ReadonlyArray<TypeCodeToJsType<T>>
): RelishArray<T> {
  // Runtime validation: ensure all elements match the expected type
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
 * Create a map value (named Map_ to avoid conflict with global Map).
 * For primitive key/value types, entries hold raw JS values.
 * For composite key/value types (Array, Map, Struct, Enum), entries hold RelishValue.
 *
 * Accepts Record<string, V> for ergonomics when keys are strings,
 * or ReadonlyMap<K, V> for all other key types.
 *
 * @throws Error if any key or value does not match the expected type
 */
export function Map_<K extends TypeCode, V extends TypeCode>(
  keyType: K,
  valueType: V,
  input: MapInput<TypeCodeToJsType<K>, TypeCodeToJsType<V>>
): RelishMap<K, V> {
  // Convert Record to Map if needed
  const entries: ReadonlyMap<TypeCodeToJsType<K>, TypeCodeToJsType<V>> =
    input instanceof Map ? input : new Map(Object.entries(input) as Array<[TypeCodeToJsType<K>, TypeCodeToJsType<V>]>);

  // Runtime validation: ensure all keys and values match expected types
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

/** Create a struct value */
export function Struct(fields: ReadonlyMap<number, RelishValue>): RelishStruct {
  return { [RELISH_BRAND]: true, type: "struct", fields };
}

/** Create an enum value */
export function Enum(variantId: number, value: RelishValue): RelishEnum {
  return { [RELISH_BRAND]: true, type: "enum", variantId, value };
}

/** Create a timestamp value */
export function Timestamp(unixSeconds: bigint): RelishTimestamp {
  return { [RELISH_BRAND]: true, type: "timestamp", unixSeconds };
}
