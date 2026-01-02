// pattern: Functional Core
// @grounds/core - Low-level Relish wire format implementation

// Types and type codes
export { TypeCode, DateTime } from "./types.js";
export type {
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
  PrimitiveTypeCode,
  CompositeTypeCode,
  TypeCodeToJsType,
  MapInput,
  DecodedValue,
} from "./types.js";

// Value constructors
export {
  Null,
  Bool,
  U8,
  U16,
  U32,
  U64,
  U128,
  I8,
  I16,
  I32,
  I64,
  I128,
  F32,
  F64,
  String_,
  Array_,
  Map_,
  Struct,
  Enum,
  Timestamp,
} from "./values.js";

// Error types
export { EncodeError, DecodeError } from "./errors.js";

// Encoder
export { encode, Encoder } from "./encoder.js";

// Decoder
export { decode, Decoder } from "./decoder.js";

