// pattern: Functional Core

/**
 * TypeBox-integrated schema system for type-safe Relish encoding and decoding.
 *
 * Provides schema constructors that combine TypeBox's runtime validation with
 * Relish's binary wire format, enabling full type safety from schema definition
 * through encoding and decoding.
 *
 * @module @grounds/schema
 * @packageDocumentation
 *
 * @example
 * Defining and using a schema:
 * ```typescript
 * import {
 *   RStruct,
 *   field,
 *   RString,
 *   RU32,
 *   createCodec,
 *   type Static
 * } from '@grounds/schema';
 *
 * // Define schema
 * const UserSchema = RStruct({
 *   name: field(0, RString()),
 *   age: field(1, RU32()),
 *   email: field(2, RString())
 * });
 *
 * // Infer TypeScript type
 * type User = Static<typeof UserSchema>;
 * // { name: string, age: number, email: string }
 *
 * // Create codec
 * const codec = createCodec(UserSchema);
 *
 * // Type-safe encoding
 * const user: User = {
 *   name: 'Alice',
 *   age: 25,
 *   email: 'alice@example.com'
 * };
 *
 * codec.encode(user).match(
 *   (bytes) => {
 *     // Roundtrip
 *     codec.decode(bytes).match(
 *       (decoded) => console.log(decoded.name), // Alice
 *       (error) => console.error(error.code)
 *     );
 *   },
 *   (error) => console.error(error.message)
 * );
 * ```
 *
 * @example
 * Working with enums:
 * ```typescript
 * import { REnum, RStruct, variant, field, RString, RNull } from '@grounds/schema';
 *
 * const ResultSchema = REnum({
 *   success: variant(0, RStruct({
 *     data: field(0, RString())
 *   })),
 *   error: variant(1, RStruct({
 *     message: field(0, RString())
 *   }))
 * });
 *
 * const codec = createCodec(ResultSchema);
 *
 * // Variant inferred automatically
 * codec.encode({ success: { data: 'OK' } });
 * codec.encode({ error: { message: 'Failed' } });
 * ```
 *
 * @remarks
 * This package bridges TypeBox's JSON Schema ecosystem with Relish's binary
 * serialization. Key features:
 *
 * - **Full type inference**: Static<T> extracts TypeScript types from schemas
 * - **Runtime validation**: TypeBox validates values during encoding
 * - **Symbol metadata**: Schemas carry Relish type codes without property conflicts
 * - **API symmetry**: toRelish and fromRelish both work with bytes (ADR 0001)
 *
 * For streaming encoding/decoding, use `@grounds/stream`. For low-level wire
 * format operations without schemas, use `@grounds/core`.
 *
 * @see {@link createCodec} for creating type-safe codecs
 * @see {@link toRelish} for schema-based encoding
 * @see {@link fromRelish} for schema-based decoding
 * @see {@link RStruct} for struct schemas
 * @see {@link REnum} for enum schemas
 */

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
