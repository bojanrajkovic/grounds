// pattern: Functional Core
import { type Result } from "neverthrow";
import { encode, type RelishValue, type EncodeError } from "@grounds/core";

/**
 * Encode values from an async iterable, yielding Result per value.
 *
 * Error handling: Yields error Result and **continues** to next value.
 * Each value encodes independently, so an error on one value doesn't
 * affect others. This differs from decodeIterable which stops on error.
 */
export async function* encodeIterable(
  values: AsyncIterable<RelishValue>
): AsyncGenerator<Result<Uint8Array, EncodeError>> {
  for await (const value of values) {
    const result = encode(value);
    yield result;
    // Continue to next value even if this one failed
  }
}

export async function* encodeIterableBytes(
  values: AsyncIterable<RelishValue>
): AsyncGenerator<Uint8Array> {
  for await (const value of values) {
    const result = encode(value);
    if (result.isErr()) {
      throw result.error;
    }
    yield result.value;
  }
}
