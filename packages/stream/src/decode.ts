// pattern: Functional Core
import { type Result, err } from "neverthrow";
import {
  type DecodedValue,
  type DecodeError,
  DecodeError as DecodeErrorClass,
} from "@grounds/core";
import { StreamBuffer } from "./buffer.js";

/**
 * Decode values from chunked binary data, yielding Result per value.
 *
 * Error handling: Yields error Result and **stops** iteration.
 * Unlike encodeIterable which continues on error, decode errors indicate
 * stream corruption - byte boundaries are lost and remaining data is
 * unreliable. This matches Web Streams behavior (stop on first error).
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
