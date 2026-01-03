// pattern: Functional Core
import { DateTime } from "luxon";

/**
 * Relish type codes as defined in the specification.
 * Each type has a unique 1-byte identifier (0x00-0x13).
 * Bit 7 is reserved and must not be set.
 */
export const TypeCode = {
  Null: 0x00,
  Bool: 0x01,
  U8: 0x02,
  U16: 0x03,
  U32: 0x04,
  U64: 0x05,
  U128: 0x06,
  I8: 0x07,
  I16: 0x08,
  I32: 0x09,
  I64: 0x0a,
  I128: 0x0b,
  F32: 0x0c,
  F64: 0x0d,
  String: 0x0e,
  Array: 0x0f,
  Map: 0x10,
  Struct: 0x11,
  Enum: 0x12,
  Timestamp: 0x13,
} as const;

export type TypeCode = (typeof TypeCode)[keyof typeof TypeCode];

/**
 * Determines if a type code represents a primitive type.
 *
 * Primitive types (0x00-0x0e, 0x13) have a `.value` property and map to raw JS values.
 * Composite types (0x0f-0x12) are complex structures (Array, Map, Struct, Enum).
 *
 * @param typeCode - The type code to check
 * @returns true if the type is primitive, false if composite
 */
export function isPrimitiveTypeCode(typeCode: number): boolean {
  // Primitives: 0x00-0x0e (Null through String) and 0x13 (Timestamp)
  // Composites: 0x0f-0x12 (Array, Map, Struct, Enum)
  return typeCode <= TypeCode.String || typeCode === TypeCode.Timestamp;
}

/**
 * Discriminated union representing all possible Relish values.
 * Each variant corresponds to a Relish type code.
 */
export type RelishValue =
  | RelishNull
  | RelishBool
  | RelishU8
  | RelishU16
  | RelishU32
  | RelishU64
  | RelishU128
  | RelishI8
  | RelishI16
  | RelishI32
  | RelishI64
  | RelishI128
  | RelishF32
  | RelishF64
  | RelishString
  | RelishArray
  | RelishMap
  | RelishStruct
  | RelishEnum
  | RelishTimestamp;

export type RelishNull = {
  readonly type: "null";
};

export type RelishBool = {
  readonly type: "bool";
  readonly value: boolean;
};

export type RelishU8 = {
  readonly type: "u8";
  readonly value: number;
};

export type RelishU16 = {
  readonly type: "u16";
  readonly value: number;
};

export type RelishU32 = {
  readonly type: "u32";
  readonly value: number;
};

export type RelishU64 = {
  readonly type: "u64";
  readonly value: bigint;
};

export type RelishU128 = {
  readonly type: "u128";
  readonly value: bigint;
};

export type RelishI8 = {
  readonly type: "i8";
  readonly value: number;
};

export type RelishI16 = {
  readonly type: "i16";
  readonly value: number;
};

export type RelishI32 = {
  readonly type: "i32";
  readonly value: number;
};

export type RelishI64 = {
  readonly type: "i64";
  readonly value: bigint;
};

export type RelishI128 = {
  readonly type: "i128";
  readonly value: bigint;
};

export type RelishF32 = {
  readonly type: "f32";
  readonly value: number;
};

export type RelishF64 = {
  readonly type: "f64";
  readonly value: number;
};

export type RelishString = {
  readonly type: "string";
  readonly value: string;
};

/**
 * Type codes for primitive types that map directly to JS values.
 * Arrays/Maps of these types hold raw JS values, not RelishValue.
 */
export type PrimitiveTypeCode =
  | typeof TypeCode.Null
  | typeof TypeCode.Bool
  | typeof TypeCode.U8
  | typeof TypeCode.U16
  | typeof TypeCode.U32
  | typeof TypeCode.U64
  | typeof TypeCode.U128
  | typeof TypeCode.I8
  | typeof TypeCode.I16
  | typeof TypeCode.I32
  | typeof TypeCode.I64
  | typeof TypeCode.I128
  | typeof TypeCode.F32
  | typeof TypeCode.F64
  | typeof TypeCode.String
  | typeof TypeCode.Timestamp;

/**
 * Type codes for composite types that require full RelishValue structure.
 * Arrays/Maps of these types hold RelishValue elements.
 */
export type CompositeTypeCode =
  | typeof TypeCode.Array
  | typeof TypeCode.Map
  | typeof TypeCode.Struct
  | typeof TypeCode.Enum;

/**
 * Map a TypeCode to its corresponding JavaScript type.
 * Primitive types map to raw JS values, composite types map to RelishValue.
 */
export type TypeCodeToJsType<T extends TypeCode> =
  T extends typeof TypeCode.Null ? null :
  T extends typeof TypeCode.Bool ? boolean :
  T extends typeof TypeCode.U8 | typeof TypeCode.U16 | typeof TypeCode.U32 |
           typeof TypeCode.I8 | typeof TypeCode.I16 | typeof TypeCode.I32 |
           typeof TypeCode.F32 | typeof TypeCode.F64 ? number :
  T extends typeof TypeCode.U64 | typeof TypeCode.U128 |
           typeof TypeCode.I64 | typeof TypeCode.I128 |
           typeof TypeCode.Timestamp ? bigint :
  T extends typeof TypeCode.String ? string :
  T extends CompositeTypeCode ? RelishValue :
  never;

/**
 * Homogeneous array with element type specified by TypeCode.
 * For primitive element types, elements are raw JS values.
 * For composite element types, elements are RelishValue.
 */
export type RelishArray<T extends TypeCode = TypeCode> = {
  readonly type: "array";
  readonly elementType: T;
  readonly elements: ReadonlyArray<TypeCodeToJsType<T>>;
};

/**
 * Homogeneous map with key and value types specified by TypeCode.
 * For primitive key/value types, entries hold raw JS values.
 * For composite key/value types, entries hold RelishValue.
 */
export type RelishMap<K extends TypeCode = TypeCode, V extends TypeCode = TypeCode> = {
  readonly type: "map";
  readonly keyType: K;
  readonly valueType: V;
  readonly entries: ReadonlyMap<TypeCodeToJsType<K>, TypeCodeToJsType<V>>;
};

/**
 * Ergonomic input type for Map_ constructor.
 * Accepts Record<string, V> for string keys (ergonomic),
 * or ReadonlyMap<K, V> for all other key types.
 */
export type MapInput<K, V> = K extends string
  ? Record<string, V> | ReadonlyMap<K, V>
  : ReadonlyMap<K, V>;

/**
 * Decoded value type - raw JS values without RelishValue wrapper.
 * Used by decoder to return ergonomic JS types.
 *
 * Note: Requires Luxon DateTime import when using timestamps.
 */
export type DecodedValue =
  | null
  | boolean
  | number
  | bigint
  | string
  | DateTime  // Luxon DateTime for timestamps
  | ReadonlyArray<DecodedValue>
  | ReadonlyMap<DecodedValue, DecodedValue>
  | Readonly<{ readonly [fieldId: number]: DecodedValue }>
  | Readonly<{ readonly variantId: number; readonly value: DecodedValue }>;

// Re-export Luxon DateTime for convenience
export { DateTime } from "luxon";

export type RelishStruct = {
  readonly type: "struct";
  readonly fields: ReadonlyMap<number, RelishValue>;
};

export type RelishEnum = {
  readonly type: "enum";
  readonly variantId: number;
  readonly value: RelishValue;
};

export type RelishTimestamp = {
  readonly type: "timestamp";
  readonly unixSeconds: bigint;
};
