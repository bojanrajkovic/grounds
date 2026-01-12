// pattern: Functional Core

/**
 * Type-safe codec for schema-driven encoding and decoding.
 *
 * @module
 */

import { Result } from "neverthrow";
import { EncodeError, DecodeError } from "@grounds/core";
import type { Static } from "@sinclair/typebox";
import { toRelish, fromRelish } from "./convert.js";
import type { TRelishSchema } from "./types.js";

/**
 * Type-safe codec for schema-driven encoding and decoding.
 *
 * Combines a schema with encode/decode operations, ensuring type safety
 * through TypeScript's Static type inference.
 */
export type Codec<T> = {
  /** Encodes a typed value to bytes. */
  encode(value: T): Result<Uint8Array, EncodeError>;
  /** Decodes bytes to a typed value. */
  decode(bytes: Uint8Array): Result<T, DecodeError>;
  /** The schema this codec is based on. */
  schema: TRelishSchema;
};

/**
 * Creates a type-safe codec from a Relish schema.
 *
 * The codec provides encode/decode methods with full type inference,
 * automatically validating values against the schema during encoding.
 *
 * @param schema - Relish schema (RNull, RStruct, REnum, etc.)
 * @returns Codec with typed encode/decode methods
 * @group Codec API
 *
 * @example
 * Basic usage:
 * ```typescript
 * import { createCodec, RStruct, field, RString, RU8 } from '@grounds/schema';
 * import type { Static } from '@grounds/schema';
 *
 * const UserSchema = RStruct({
 *   name: field(0, RString()),
 *   age: field(1, RU8())
 * });
 *
 * type User = Static<typeof UserSchema>;
 *
 * const codec = createCodec(UserSchema);
 *
 * const user: User = { name: 'Alice', age: 25 };
 *
 * codec.encode(user).match(
 *   (bytes) => {
 *     // bytes: Uint8Array ready for transmission
 *     codec.decode(bytes).match(
 *       (decoded) => console.log(decoded.name, decoded.age),
 *       (error) => console.error('Decode error:', error.code)
 *     );
 *   },
 *   (error) => console.error('Encode error:', error.message)
 * );
 * ```
 *
 * @example
 * Type safety with Static:
 * ```typescript
 * import { createCodec, RArray, RU32, type Static } from '@grounds/schema';
 *
 * const schema = RArray(RU32());
 * const codec = createCodec(schema);
 *
 * type Numbers = Static<typeof schema>; // Array<number>
 *
 * const valid: Numbers = [1, 2, 3];
 * codec.encode(valid); // OK
 *
 * // TypeScript compile error:
 * // const invalid: Numbers = [1, 'two', 3];
 * ```
 *
 * @remarks
 * Codec uses {@link toRelish} for encoding (JS value → bytes) and {@link fromRelish}
 * for decoding (bytes → JS value). Both operations are truly symmetric per ADR 0001:
 * encode produces bytes directly, decode consumes bytes directly.
 *
 * Type inference via Static<T> extracts the JavaScript type from the schema,
 * ensuring compile-time type safety for encode input and decode output.
 *
 * @see {@link toRelish} for direct encoding without codec wrapper
 * @see {@link fromRelish} for direct decoding without codec wrapper
 */
export function createCodec<T extends TRelishSchema>(schema: T): Codec<Static<T>> {
  return {
    schema,

    encode(value: Static<T>): Result<Uint8Array, EncodeError> {
      // toRelish now returns bytes directly (truly symmetric with fromRelish)
      return toRelish(value, schema);
    },

    decode(bytes: Uint8Array): Result<Static<T>, DecodeError> {
      // fromRelish handles both decoding and conversion
      return fromRelish<Static<T>>(bytes, schema);
    },
  };
}
