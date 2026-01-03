// pattern: Functional Core
// Type-safe codec for schema-driven encoding/decoding

import { Result } from "neverthrow";
import { EncodeError, DecodeError } from "@grounds/core";
import type { Static } from "@sinclair/typebox";
import { toRelish, fromRelish } from "./convert.js";
import type { TRelishSchema } from "./types.js";

export type Codec<T> = {
  encode(value: T): Result<Uint8Array, EncodeError>;
  decode(bytes: Uint8Array): Result<T, DecodeError>;
  schema: TRelishSchema;
};

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
