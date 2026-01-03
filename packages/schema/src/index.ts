// pattern: Functional Core
// @grounds/schema - TypeBox integration for schema-driven serialization

// Primitive types
export {
  RNull,
  RBool,
  RU8,
  RU16,
  RU32,
  RU64,
  RU128,
  RI8,
  RI16,
  RI32,
  RI64,
  RI128,
  RF32,
  RF64,
  RString,
  RArray,
  RMap,
  ROptional,
  RTimestamp,
} from "./types.js";
export type {
  TRNull,
  TRBool,
  TRU8,
  TRU16,
  TRU32,
  TRU64,
  TRU128,
  TRI8,
  TRI16,
  TRI32,
  TRI64,
  TRI128,
  TRF32,
  TRF64,
  TRString,
  TRArray,
  TRMap,
  TROptional,
  TRTimestamp,
  TRelishSchema,
} from "./types.js";

// Struct support
export { field, RStruct } from "./struct.js";
export type { TStructField, TRStruct } from "./struct.js";

// Enum support
export { variant, REnum } from "./enum.js";
export type { TEnumVariant, TREnum } from "./enum.js";

// Codec (type-safe encode/decode)
export { createCodec, type Codec } from "./codec.js";

// Conversion utilities (symmetric API for encoding/decoding)
export { toRelish, fromRelish } from "./convert.js";
