// pattern: Functional Core
/**
 * Streaming encoder for Relish values using async generators.
 * @module
 */

import { type Result } from "neverthrow";
import { encode, type RelishValue, type EncodeError } from "@grounds/core";

/**
 * Encodes values from an async iterable, yielding Result per value.
 *
 * Processes values one at a time, continuing on errors (yields Err Result).
 * Each value encodes independently - errors don't stop the stream.
 *
 * @param values - Async iterable of Relish values
 * @returns Async generator yielding Result<Uint8Array, EncodeError>
 *
 * @example
 * Streaming array encoding:
 * ```typescript
 * import { encodeIterable } from '@grounds/stream';
 * import { U32, String_ } from '@grounds/core';
 *
 * async function* generateValues() {
 *   yield U32(1);
 *   yield U32(2);
 *   yield String_('hello');
 * }
 *
 * for await (const result of encodeIterable(generateValues())) {
 *   result.match(
 *     (bytes) => console.log('Encoded:', bytes.length, 'bytes'),
 *     (error) => console.error('Error:', error.message)
 *   );
 * }
 * ```
 *
 * @example
 * Error handling:
 * ```typescript
 * import { encodeIterable } from '@grounds/stream';
 * import { Struct, U8 } from '@grounds/core';
 *
 * async function* generateValues() {
 *   yield Struct(new Map([[5, U8(1)], [2, U8(2)]])); // Unsorted! Will error
 *   yield U8(42); // Still processes this despite previous error
 * }
 *
 * for await (const result of encodeIterable(generateValues())) {
 *   if (result.isErr()) {
 *     console.error('Encoding failed, continuing...', result.error.message);
 *   }
 * }
 * ```
 *
 * @remarks
 * Unlike {@link decodeIterable}, this function continues on errors rather than
 * stopping. Each value encodes independently, so an error encoding one value
 * doesn't affect subsequent values.
 *
 * @see {@link decodeIterable} for the inverse operation (streaming decode)
 * @see {@link createEncoderStream} for Web Streams API version
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
