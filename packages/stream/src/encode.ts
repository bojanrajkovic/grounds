// pattern: Functional Core
import { type Result } from "neverthrow";
import { encode, type RelishValue, type EncodeError } from "@grounds/core";

export async function* encodeIterable(
  values: AsyncIterable<RelishValue>
): AsyncGenerator<Result<Uint8Array, EncodeError>> {
  for await (const value of values) {
    const result = encode(value);
    yield result;
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
