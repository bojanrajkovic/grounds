// pattern: Functional Core
// Type-safe codec for schema-driven encoding/decoding

import { Result } from "neverthrow";
import { encode, decode, EncodeError, DecodeError } from "@grounds/core";
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
      return toRelish(value, schema).andThen(relishValue => encode(relishValue));
    },

    decode(bytes: Uint8Array): Result<Static<T>, DecodeError> {
      // Core decoder returns DecodedValue (raw JS types)
      // Convert DecodedValue to schema-aware typed JS
      return decode(bytes).andThen(decodedValue => fromRelish<Static<T>>(decodedValue, schema));
    },
  };
}
