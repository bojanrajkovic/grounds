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
import { TypeCode } from "./types.js";

/** Singleton null value */
export const Null: RelishNull = { type: "null" };

/** Create a boolean value */
export function Bool(value: boolean): RelishBool {
  return { type: "bool", value };
}

/** Create an unsigned 8-bit integer value */
export function U8(value: number): RelishU8 {
  return { type: "u8", value };
}

/** Create an unsigned 16-bit integer value */
export function U16(value: number): RelishU16 {
  return { type: "u16", value };
}

/** Create an unsigned 32-bit integer value */
export function U32(value: number): RelishU32 {
  return { type: "u32", value };
}

/** Create an unsigned 64-bit integer value */
export function U64(value: bigint): RelishU64 {
  return { type: "u64", value };
}

/** Create an unsigned 128-bit integer value */
export function U128(value: bigint): RelishU128 {
  return { type: "u128", value };
}

/** Create a signed 8-bit integer value */
export function I8(value: number): RelishI8 {
  return { type: "i8", value };
}

/** Create a signed 16-bit integer value */
export function I16(value: number): RelishI16 {
  return { type: "i16", value };
}

/** Create a signed 32-bit integer value */
export function I32(value: number): RelishI32 {
  return { type: "i32", value };
}

/** Create a signed 64-bit integer value */
export function I64(value: bigint): RelishI64 {
  return { type: "i64", value };
}

/** Create a signed 128-bit integer value */
export function I128(value: bigint): RelishI128 {
  return { type: "i128", value };
}

/** Create a 32-bit floating point value */
export function F32(value: number): RelishF32 {
  return { type: "f32", value };
}

/** Create a 64-bit floating point value */
export function F64(value: number): RelishF64 {
  return { type: "f64", value };
}

/** Create a string value (named String_ to avoid conflict with global String) */
export function String_(value: string): RelishString {
  return { type: "string", value };
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
  return { type: "array", elementType, elements };
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
  return { type: "map", keyType, valueType, entries };
}

/** Create a struct value */
export function Struct(fields: ReadonlyMap<number, RelishValue>): RelishStruct {
  return { type: "struct", fields };
}

/** Create an enum value */
export function Enum(variantId: number, value: RelishValue): RelishEnum {
  return { type: "enum", variantId, value };
}

/** Create a timestamp value */
export function Timestamp(unixSeconds: bigint): RelishTimestamp {
  return { type: "timestamp", unixSeconds };
}
