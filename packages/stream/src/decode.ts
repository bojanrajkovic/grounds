// pattern: Functional Core
/**
 * Streaming decoder for binary data using async generators.
 * @module
 */

import { type Result, err } from "neverthrow";
import {
  type DecodedValue,
  type DecodeError,
  DecodeError as DecodeErrorClass,
} from "@grounds/core";
import { StreamBuffer } from "./buffer.js";

/**
 * Decodes values from streaming binary data.
 *
 * Processes chunks incrementally, yielding decoded values as complete frames
 * are available. Stops on first decode error.
 *
 * @param chunks - Async iterable of byte chunks
 * @returns Async generator yielding Result<DecodedValue, DecodeError>
 *
 * @example
 * Streaming network decode:
 * ```typescript
 * import { decodeIterable } from '@grounds/stream';
 *
 * async function* readNetworkStream(socket) {
 *   // Read chunks from network socket
 *   while (true) {
 *     const chunk = await socket.read();
 *     if (!chunk) break;
 *     yield chunk;
 *   }
 * }
 *
 * for await (const result of decodeIterable(readNetworkStream(socket))) {
 *   result.match(
 *     (value) => console.log('Decoded:', value),
 *     (error) => console.error('Decode error:', error.code)
 *   );
 * }
 * ```
 *
 * @example
 * File streaming:
 * ```typescript
 * import { decodeIterable } from '@grounds/stream';
 * import { createReadStream } from 'fs';
 *
 * async function* readFile(path: string) {
 *   const stream = createReadStream(path);
 *   for await (const chunk of stream) {
 *     yield new Uint8Array(chunk);
 *   }
 * }
 *
 * for await (const result of decodeIterable(readFile('data.bin'))) {
 *   // Process decoded values
 * }
 * ```
 *
 * @remarks
 * Maintains internal buffer for incomplete frames. When a complete value
 * is decoded, it yields the Result and continues with remaining buffered data.
 *
 * Unlike {@link encodeIterable}, stops on first error (can't continue decoding
 * after stream corruption).
 *
 * @see {@link encodeIterable} for the inverse operation (streaming encode)
 * @see {@link createDecoderStream} for Web Streams API version
 */
export async function* decodeIterable(
  chunks: AsyncIterable<Uint8Array>
): AsyncGenerator<Result<DecodedValue, DecodeError>> {
  const buffer = new StreamBuffer();

  for await (const chunk of chunks) {
    buffer.append(chunk);

    // Try to decode as many complete values as possible
    while (buffer.length > 0) {
      const result = buffer.tryDecodeOne();

      if (result.status === "needMore") {
        // Wait for more data
        break;
      }

      if (result.status === "error") {
        yield err(result.error);
        // Stop iteration: decode error means stream is corrupted,
        // byte boundaries are lost, remaining data is unreliable
        return;
      }

      if (result.status === "ok") {
        yield result.value;
      }
    }
  }

  // After all chunks consumed, check for trailing incomplete data
  if (buffer.length > 0) {
    const result = buffer.tryDecodeOne();
    if (result.status === "needMore") {
      // Incomplete data at end of stream = TRUNCATED_STREAM (specific error)
      yield err(
        DecodeErrorClass.truncatedStream(
          `${buffer.length} bytes remaining, incomplete value`
        )
      );
    } else if (result.status === "error") {
      yield err(result.error);
    } else if (result.status === "ok") {
      yield result.value;
    }
  }
}
