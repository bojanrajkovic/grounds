// pattern: Functional Core
// TypeBox-based schema type constructors for Relish types

import { Type, type TSchema, type Static } from "@sinclair/typebox";
import { DateTime } from "luxon";
import { TypeCode } from "@grounds/core";
import {
  RelishKind,
  RelishTypeCode,
  RelishElementType,
  RelishKeyType,
  RelishValueType,
} from "./symbols.js";

// Base Relish schema type with metadata
export type TRelishSchema<T = unknown> = TSchema & {
  [RelishKind]: string;
  [RelishTypeCode]: TypeCode;
  static: T;
};

/**
 * Null schema type.
 */
export type TRNull = TRelishSchema<null> & { [RelishKind]: "RNull" };

/**
 * Creates a schema for null values.
 *
 * The null type represents the absence of a value. Encoding produces a single
 * type byte with no additional content.
 *
 * @returns A Relish schema for null values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RNull, createCodec } from '@grounds/schema';
 *
 * const codec = createCodec(RNull());
 * codec.encode(null).match(
 *   (bytes) => console.log('Null encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link RBool} for boolean schema
 * @see {@link createCodec} for full encoding/decoding
 */
export function RNull(): TRNull {
  return {
    ...Type.Null(),
    [RelishKind]: "RNull",
    [RelishTypeCode]: TypeCode.Null,
  } as TRNull;
}

/**
 * Boolean schema type.
 */
export type TRBool = TRelishSchema<boolean> & { [RelishKind]: "RBool" };

/**
 * Creates a schema for boolean values (true or false).
 *
 * Booleans encode as a type byte followed by 0x00 for false or 0xFF for true.
 *
 * @group Schema Constructors: Primitives
 * 
 * @returns A Relish schema for boolean values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RBool, createCodec } from '@grounds/schema';
 *
 * const codec = createCodec(RBool());
 * codec.encode(true).match(
 *   (bytes) => console.log('Boolean encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link RNull} for null schema
 * @see {@link RU8} for unsigned integer schemas
 */
export function RBool(): TRBool {
  return {
    ...Type.Boolean(),
    [RelishKind]: "RBool",
    [RelishTypeCode]: TypeCode.Bool,
  } as TRBool;
}

/**
 * Unsigned 8-bit integer schema type (0-255).
 */
export type TRU8 = TRelishSchema<number> & { [RelishKind]: "RU8" };

/**
 * Unsigned 16-bit integer schema type (0-65535).
 */
export type TRU16 = TRelishSchema<number> & { [RelishKind]: "RU16" };

/**
 * Unsigned 32-bit integer schema type (0-4294967295).
 */
export type TRU32 = TRelishSchema<number> & { [RelishKind]: "RU32" };

/**
 * Unsigned 64-bit integer schema type (uses JavaScript BigInt).
 */
export type TRU64 = TRelishSchema<bigint> & { [RelishKind]: "RU64" };

/**
 * Unsigned 128-bit integer schema type (uses JavaScript BigInt).
 */
export type TRU128 = TRelishSchema<bigint> & { [RelishKind]: "RU128" };

/**
 * Creates a schema for unsigned 8-bit integers (0-255).
 *
 * @group Schema Constructors: Primitives
 * 
 * @returns A Relish schema for u8 values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RU8, createCodec } from '@grounds/schema';
 *
 * const codec = createCodec(RU8());
 * codec.encode(42).match(
 *   (bytes) => console.log('U8 encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link RU16} for 16-bit unsigned
 * @see {@link RI8} for signed 8-bit
 */
export function RU8(): TRU8 {
  return {
    ...Type.Integer({ minimum: 0, maximum: 255 }),
    [RelishKind]: "RU8",
    [RelishTypeCode]: TypeCode.U8,
  } as TRU8;
}

/**
 * Creates a schema for unsigned 16-bit integers (0-65535).
 *
 * @group Schema Constructors: Primitives
 * 
 * @returns A Relish schema for u16 values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RU16, createCodec } from '@grounds/schema';
 *
 * const codec = createCodec(RU16());
 * codec.encode(1000).match(
 *   (bytes) => console.log('U16 encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link RU8} for 8-bit unsigned
 * @see {@link RU32} for 32-bit unsigned
 */
export function RU16(): TRU16 {
  return {
    ...Type.Integer({ minimum: 0, maximum: 65535 }),
    [RelishKind]: "RU16",
    [RelishTypeCode]: TypeCode.U16,
  } as TRU16;
}

/**
 * Creates a schema for unsigned 32-bit integers (0-4294967295).
 *
 * @group Schema Constructors: Primitives
 * 
 * @returns A Relish schema for u32 values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RU32, createCodec } from '@grounds/schema';
 *
 * const codec = createCodec(RU32());
 * codec.encode(1000000).match(
 *   (bytes) => console.log('U32 encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link RU16} for 16-bit unsigned
 * @see {@link RU64} for 64-bit unsigned
 */
export function RU32(): TRU32 {
  return {
    ...Type.Integer({ minimum: 0, maximum: 0xFFFFFFFF }),
    [RelishKind]: "RU32",
    [RelishTypeCode]: TypeCode.U32,
  } as TRU32;
}

/**
 * Creates a schema for unsigned 64-bit integers using JavaScript BigInt.
 *
 * Use this for large integers that exceed JavaScript's safe integer range (2^53-1).
 *
 * @group Schema Constructors: Primitives
 * 
 * @returns A Relish schema for u64 values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RU64, createCodec } from '@grounds/schema';
 *
 * const codec = createCodec(RU64());
 * codec.encode(BigInt('9007199254740992')).match(
 *   (bytes) => console.log('U64 encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link RU32} for 32-bit unsigned
 * @see {@link RU128} for 128-bit unsigned
 */
export function RU64(): TRU64 {
  return {
    ...Type.BigInt(),
    [RelishKind]: "RU64",
    [RelishTypeCode]: TypeCode.U64,
  } as TRU64;
}

/**
 * Creates a schema for unsigned 128-bit integers using JavaScript BigInt.
 *
 * Use for extremely large unsigned integers not representable in 64 bits.
 *
 * @group Schema Constructors: Primitives
 * 
 * @returns A Relish schema for u128 values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RU128, createCodec } from '@grounds/schema';
 *
 * const codec = createCodec(RU128());
 * codec.encode(BigInt('340282366920938463463374607431768211455')).match(
 *   (bytes) => console.log('U128 encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link RU64} for 64-bit unsigned
 */
export function RU128(): TRU128 {
  return {
    ...Type.BigInt(),
    [RelishKind]: "RU128",
    [RelishTypeCode]: TypeCode.U128,
  } as TRU128;
}

/**
 * Signed 8-bit integer schema type (-128 to 127).
 */
export type TRI8 = TRelishSchema<number> & { [RelishKind]: "RI8" };

/**
 * Signed 16-bit integer schema type (-32768 to 32767).
 */
export type TRI16 = TRelishSchema<number> & { [RelishKind]: "RI16" };

/**
 * Signed 32-bit integer schema type (-2147483648 to 2147483647).
 */
export type TRI32 = TRelishSchema<number> & { [RelishKind]: "RI32" };

/**
 * Signed 64-bit integer schema type (uses JavaScript BigInt).
 */
export type TRI64 = TRelishSchema<bigint> & { [RelishKind]: "RI64" };

/**
 * Signed 128-bit integer schema type (uses JavaScript BigInt).
 */
export type TRI128 = TRelishSchema<bigint> & { [RelishKind]: "RI128" };

/**
 * Creates a schema for signed 8-bit integers (-128 to 127).
 *
 * @group Schema Constructors: Primitives
 * 
 * @returns A Relish schema for i8 values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RI8, createCodec } from '@grounds/schema';
 *
 * const codec = createCodec(RI8());
 * codec.encode(-42).match(
 *   (bytes) => console.log('I8 encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link RI16} for 16-bit signed
 * @see {@link RU8} for unsigned 8-bit
 */
export function RI8(): TRI8 {
  return {
    ...Type.Integer({ minimum: -128, maximum: 127 }),
    [RelishKind]: "RI8",
    [RelishTypeCode]: TypeCode.I8,
  } as TRI8;
}

/**
 * Creates a schema for signed 16-bit integers (-32768 to 32767).
 *
 * @group Schema Constructors: Primitives
 * 
 * @returns A Relish schema for i16 values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RI16, createCodec } from '@grounds/schema';
 *
 * const codec = createCodec(RI16());
 * codec.encode(-1000).match(
 *   (bytes) => console.log('I16 encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link RI8} for 8-bit signed
 * @see {@link RI32} for 32-bit signed
 */
export function RI16(): TRI16 {
  return {
    ...Type.Integer({ minimum: -32768, maximum: 32767 }),
    [RelishKind]: "RI16",
    [RelishTypeCode]: TypeCode.I16,
  } as TRI16;
}

/**
 * Creates a schema for signed 32-bit integers (-2147483648 to 2147483647).
 *
 * @group Schema Constructors: Primitives
 * 
 * @returns A Relish schema for i32 values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RI32, createCodec } from '@grounds/schema';
 *
 * const codec = createCodec(RI32());
 * codec.encode(-1000000).match(
 *   (bytes) => console.log('I32 encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link RI16} for 16-bit signed
 * @see {@link RI64} for 64-bit signed
 */
export function RI32(): TRI32 {
  return {
    ...Type.Integer({ minimum: -0x80000000, maximum: 0x7FFFFFFF }),
    [RelishKind]: "RI32",
    [RelishTypeCode]: TypeCode.I32,
  } as TRI32;
}

/**
 * Creates a schema for signed 64-bit integers using JavaScript BigInt.
 *
 * Use for large signed integers that exceed JavaScript's safe integer range (±2^53-1).
 *
 * @group Schema Constructors: Primitives
 * 
 * @returns A Relish schema for i64 values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RI64, createCodec } from '@grounds/schema';
 *
 * const codec = createCodec(RI64());
 * codec.encode(BigInt('-9007199254740992')).match(
 *   (bytes) => console.log('I64 encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link RI32} for 32-bit signed
 * @see {@link RI128} for 128-bit signed
 */
export function RI64(): TRI64 {
  return {
    ...Type.BigInt(),
    [RelishKind]: "RI64",
    [RelishTypeCode]: TypeCode.I64,
  } as TRI64;
}

/**
 * Creates a schema for signed 128-bit integers using JavaScript BigInt.
 *
 * Use for extremely large signed integers not representable in 64 bits.
 *
 * @group Schema Constructors: Primitives
 * 
 * @returns A Relish schema for i128 values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RI128, createCodec } from '@grounds/schema';
 *
 * const codec = createCodec(RI128());
 * codec.encode(BigInt('-170141183460469231731687303715884105728')).match(
 *   (bytes) => console.log('I128 encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link RI64} for 64-bit signed
 */
export function RI128(): TRI128 {
  return {
    ...Type.BigInt(),
    [RelishKind]: "RI128",
    [RelishTypeCode]: TypeCode.I128,
  } as TRI128;
}

/**
 * 32-bit floating point schema type.
 */
export type TRF32 = TRelishSchema<number> & { [RelishKind]: "RF32" };

/**
 * 64-bit floating point schema type.
 */
export type TRF64 = TRelishSchema<number> & { [RelishKind]: "RF64" };

/**
 * Creates a schema for 32-bit floating point values.
 *
 * Represents single-precision IEEE 754 floating point numbers.
 * Note: JavaScript loses precision when encoding/decoding f32 values since all
 * numbers are 64-bit internally. Decode may lose significant digits.
 *
 * @group Schema Constructors: Primitives
 * 
 * @returns A Relish schema for f32 values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RF32, createCodec } from '@grounds/schema';
 *
 * const codec = createCodec(RF32());
 * codec.encode(3.14).match(
 *   (bytes) => console.log('F32 encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @remarks
 * Precision loss occurs due to JavaScript's single number type (always 64-bit).
 * For high-precision requirements, use RF64.
 *
 * @see {@link RF64} for 64-bit floating point
 */
export function RF32(): TRF32 {
  return {
    ...Type.Number(),
    [RelishKind]: "RF32",
    [RelishTypeCode]: TypeCode.F32,
  } as TRF32;
}

/**
 * Creates a schema for 64-bit floating point values.
 *
 * Represents double-precision IEEE 754 floating point numbers. This matches
 * JavaScript's native number type and preserves full precision for the range
 * of representable values.
 *
 * @group Schema Constructors: Primitives
 * 
 * @returns A Relish schema for f64 values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RF64, createCodec } from '@grounds/schema';
 *
 * const codec = createCodec(RF64());
 * codec.encode(Math.PI).match(
 *   (bytes) => console.log('F64 encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link RF32} for 32-bit floating point
 */
export function RF64(): TRF64 {
  return {
    ...Type.Number(),
    [RelishKind]: "RF64",
    [RelishTypeCode]: TypeCode.F64,
  } as TRF64;
}

/**
 * String schema type.
 */
export type TRString = TRelishSchema<string> & { [RelishKind]: "RString" };

/**
 * Creates a schema for string values.
 *
 * Strings are encoded as UTF-8 with a variable-length size prefix. The wire
 * format encodes character count in bytes using a tagged varint: 7 bits for
 * lengths 0-127, or 4 bytes little-endian for larger strings.
 *
 * @returns A Relish schema for string values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RString, createCodec } from '@grounds/schema';
 *
 * const codec = createCodec(RString());
 * codec.encode('hello').match(
 *   (bytes) => console.log('String encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link RArray} for arrays of strings
 * @see {@link RMap} for maps with string keys/values
 */
export function RString(): TRString {
  return {
    ...Type.String(),
    [RelishKind]: "RString",
    [RelishTypeCode]: TypeCode.String,
  } as TRString;
}

/**
 * Array schema type with homogeneous element type.
 */
export type TRArray<T extends TSchema = TSchema> = TRelishSchema<Array<Static<T>>> & {
  [RelishKind]: "RArray";
  [RelishElementType]: T;
};

/**
 * Creates a schema for homogeneous arrays with elements of type T.
 *
 * All array elements must be the same type. The wire format encodes element
 * type (1 byte), then all elements in sequence with a length prefix.
 *
 * @param elementSchema - Schema defining the type of all array elements
 * @returns A Relish schema for arrays of type T
 * @group Schema Constructors: Containers
 *
 * @example
 * ```typescript
 * import { RArray, RU32, createCodec, type Static } from '@grounds/schema';
 *
 * const schema = RArray(RU32());
 * type Numbers = Static<typeof schema>;
 * const codec = createCodec(schema);
 *
 * codec.encode([1, 2, 3]).match(
 *   (bytes) => console.log('Array encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @see {@link RMap} for heterogeneous key-value pairs
 * @see {@link RStruct} for fixed fields with different types
 */
export function RArray<T extends TSchema>(elementSchema: T): TRArray<T> {
  return {
    ...Type.Array(elementSchema),
    [RelishKind]: "RArray",
    [RelishTypeCode]: TypeCode.Array,
    [RelishElementType]: elementSchema,
  } as TRArray<T>;
}

/**
 * Map schema type with homogeneous key and value types.
 */
export type TRMap<K extends TSchema = TSchema, V extends TSchema = TSchema> =
  TRelishSchema<Map<Static<K>, Static<V>>> & {
    [RelishKind]: "RMap";
    [RelishKeyType]: K;
    [RelishValueType]: V;
  };

/**
 * Creates a schema for homogeneous maps with key type K and value type V.
 *
 * All keys and values must match their respective types. The wire format
 * encodes key type (1 byte), value type (1 byte), then key-value pairs in
 * sequence with a length prefix. Keys must be unique.
 *
 * @param keySchema - Schema defining the type of all keys
 * @param keySchema - Schema defining the type of all keys
 * @param valueSchema - Schema defining the type of all values
 * @returns A Relish schema for maps with keys of type K and values of type V
 * @group Schema Constructors: Containers
 *
 * @example
 * ```typescript
 * import { RMap, RString, RU32, createCodec, type Static } from '@grounds/schema';
 *
 * const schema = RMap(RString(), RU32());
 * type StringToNumber = Static<typeof schema>;
 * const codec = createCodec(schema);
 *
 * codec.encode(new Map([['count', 42]])).match(
 *   (bytes) => console.log('Map encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @remarks
 * TypeBox doesn't have native Map support, so Relish uses custom schema handling.
 * Keys and value schemas are attached via symbol properties for codec use.
 *
 * @see {@link RArray} for homogeneous collections without keys
 * @see {@link RStruct} for heterogeneous collections with string field names
 */
export function RMap<K extends TSchema, V extends TSchema>(
  keySchema: K,
  valueSchema: V,
): TRMap<K, V> {
  return {
    type: "object",
    [RelishKind]: "RMap",
    [RelishTypeCode]: TypeCode.Map,
    [RelishKeyType]: keySchema,
    [RelishValueType]: valueSchema,
  } as unknown as TRMap<K, V>;
}

/**
 * Optional schema type that wraps any schema to make it nullable.
 */
export type TROptional<T extends TSchema = TSchema> = TRelishSchema<Static<T> | null> & {
  [RelishKind]: "ROptional";
  inner: T;
};

/**
 * Creates a schema for optional values (value or null).
 *
 * Wraps any schema to allow null in addition to the normal type. The codec
 * uses the wrapped schema's type code and handles null encoding/decoding.
 *
 * @param schema - The schema to make optional
 * @returns A Relish schema accepting T or null
 * @group Schema Constructors: Containers
 *
 * @example
 * ```typescript
 * import { ROptional, RString, createCodec } from '@grounds/schema';
 *
 * const schema = ROptional(RString());
 * const codec = createCodec(schema);
 *
 * codec.encode('hello').match(
 *   (bytes) => console.log('Encoded string:', bytes),
 *   (error) => console.error(error)
 * );
 *
 * codec.encode(null).match(
 *   (bytes) => console.log('Encoded null:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @remarks
 * Preserves the wrapped schema's type code for efficient encoding.
 *
 * @see {@link RNull} for null-only values
 * @see {@link field} for optional struct fields
 */
export function ROptional<T extends TSchema>(schema: T): TROptional<T> {
  const typeCode = (schema as Record<symbol | string, unknown>)[RelishTypeCode];
  return {
    ...schema,
    [RelishKind]: "ROptional",
    [RelishTypeCode]: typeCode,
    inner: schema,
  } as TROptional<T>;
}

/**
 * Timestamp schema type representing Unix timestamps as Luxon DateTime.
 */
export type TRTimestamp = TRelishSchema<DateTime> & {
  [RelishKind]: "RTimestamp";
};

/**
 * Creates a schema for Unix timestamps as Luxon DateTime objects.
 *
 * Timestamps encode as seconds since Unix epoch (1970-01-01 00:00:00 UTC) in
 * 64-bit little-endian format. Decoding produces a Luxon DateTime object for
 * convenient timezone and formatting operations.
 *
 * @group Schema Constructors: Containers
 * 
 * @returns A Relish schema for timestamp values
 * @group Schema Constructors: Primitives
 *
 * @example
 * ```typescript
 * import { RTimestamp, createCodec } from '@grounds/schema';
 * import { DateTime } from 'luxon';
 *
 * const codec = createCodec(RTimestamp());
 * const now = DateTime.now().toUTC();
 *
 * codec.encode(now).match(
 *   (bytes) => console.log('Timestamp encoded:', bytes),
 *   (error) => console.error(error)
 * );
 * ```
 *
 * @remarks
 * Requires Luxon library. Returned DateTime values are always in UTC.
 * Precision is seconds (no milliseconds or microseconds).
 *
 * @see {@link RU64} for raw 64-bit Unix seconds
 */
export function RTimestamp(): TRTimestamp {
  return {
    type: "object",
    [RelishKind]: "RTimestamp",
    [RelishTypeCode]: TypeCode.Timestamp,
  } as unknown as TRTimestamp;
}
