// pattern: Functional Core
import { TypeCode, type RelishValue } from "./types.js";

/**
 * Encode a length using Relish's tagged varint format.
 * - Short form (length < 128): single byte = length << 1 (LSB = 0)
 * - Long form (length >= 128): 4 bytes LE = (length << 1) | 1 (LSB = 1)
 */
export function encodeTaggedVarint(length: number): Uint8Array {
  if (length < 128) {
    return new Uint8Array([length << 1]);
  } else {
    const encoded = (length << 1) | 1;
    const result = new Uint8Array(4);
    result[0] = encoded & 0xff;
    result[1] = (encoded >> 8) & 0xff;
    result[2] = (encoded >> 16) & 0xff;
    result[3] = (encoded >> 24) & 0xff;
    return result;
  }
}

const TYPE_MAP: Record<RelishValue["type"], TypeCode> = {
  null: TypeCode.Null,
  bool: TypeCode.Bool,
  u8: TypeCode.U8,
  u16: TypeCode.U16,
  u32: TypeCode.U32,
  u64: TypeCode.U64,
  u128: TypeCode.U128,
  i8: TypeCode.I8,
  i16: TypeCode.I16,
  i32: TypeCode.I32,
  i64: TypeCode.I64,
  i128: TypeCode.I128,
  f32: TypeCode.F32,
  f64: TypeCode.F64,
  string: TypeCode.String,
  array: TypeCode.Array,
  map: TypeCode.Map,
  struct: TypeCode.Struct,
  enum: TypeCode.Enum,
  timestamp: TypeCode.Timestamp,
};

/**
 * Get the TypeCode for a RelishValue.
 */
export function getTypeCodeForValue(value: RelishValue): TypeCode {
  return TYPE_MAP[value.type];
}
