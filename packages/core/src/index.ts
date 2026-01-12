// pattern: Functional Core

/**
 * Low-level Relish wire format implementation for encoding and decoding binary data.
 *
 * This package provides type-safe value construction, encoding to bytes, and decoding
 * back to JavaScript values following the Relish binary serialization specification.
 *
 * @module @grounds/core
 * @packageDocumentation
 *
 * @example
 * Quick start - encoding:
 * ```typescript
 * import { encode, U32, String_, Struct } from '@grounds/core';
 *
 * const user = Struct(new Map([
 *   [0, String_('Alice')],
 *   [1, U32(25)]
 * ]));
 *
 * encode(user).match(
 *   (bytes) => {
 *     console.log('Encoded:', bytes.length, 'bytes');
 *   },
 *   (error) => console.error('Encoding failed:', error.message)
 * );
 * ```
 *
 * @example
 * Quick start - decoding:
 * ```typescript
 * import { decode } from '@grounds/core';
 *
 * const bytes = new Uint8Array([...]); // from network or storage
 *
 * decode(bytes).match(
 *   (value) => {
 *     console.log('Decoded:', value);
 *   },
 *   (error) => {
 *     if (error.code === 'UNEXPECTED_EOF') {
 *       console.error('Incomplete data');
 *     }
 *   }
 * );
 * ```
 *
 * @remarks
 * This package implements the low-level wire format only. For type-safe schema
 * validation and TypeBox integration, use `@grounds/schema`. For streaming encoding
 * and decoding, use `@grounds/stream`.
 *
 * Key characteristics:
 * - Encoding uses wrapped {@link RelishValue} types for type safety
 * - Decoding returns raw JavaScript {@link DecodedValue} for convenience
 * - All operations return neverthrow {@link Result} types for functional error handling
 * - Wire format matches Rust reference implementation
 *
 * @see {@link https://github.com/alex/relish/blob/main/SPEC.md | Relish Specification}
 * @see {@link encode} for encoding values to bytes
 * @see {@link decode} for decoding bytes to values
 */

// Types and type codes
export { TypeCode, DateTime, isPrimitiveTypeCode } from "./types.js";
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
export { EncodeError, DecodeError, type DecodeErrorCode } from "./errors.js";

// Encoder
export { encode, Encoder } from "./encoder.js";

// Decoder
export { decode, Decoder } from "./decoder.js";

