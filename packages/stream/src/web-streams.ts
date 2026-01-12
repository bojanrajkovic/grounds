// pattern: Imperative Shell
/**
 * Web Streams API wrappers for Relish encoding and decoding.
 * @module
 */

import {
  encode,
  type RelishValue,
  type DecodedValue,
  DecodeError as DecodeErrorClass,
} from "@grounds/core";
import { StreamBuffer } from "./buffer.js";

/**
 * Creates a TransformStream for encoding Relish values to bytes.
 *
 * Implements the Web Streams API for use with ReadableStream/WritableStream.
 * Compatible with browser and Node.js 18+ environments.
 *
 * @returns TransformStream<RelishValue, Uint8Array>
 *
 * @example
 * Piping with Web Streams:
 * ```typescript
 * import { createEncoderStream } from '@grounds/stream';
 * import { U32 } from '@grounds/core';
 *
 * const encoder = createEncoderStream();
 *
 * const readable = new ReadableStream({
 *   async start(controller) {
 *     controller.enqueue(U32(1));
 *     controller.enqueue(U32(2));
 *     controller.close();
 *   }
 * });
 *
 * const bytesStream = readable.pipeThrough(encoder);
 *
 * for await (const bytes of bytesStream) {
 *   console.log('Encoded chunk:', bytes.length, 'bytes');
 * }
 * ```
 *
 * @remarks
 * Encoding errors are not thrown - check the stream output for Error Results.
 * For error handling, use the async generator API ({@link encodeIterable})
 * which yields Result types.
 *
 * @see {@link createDecoderStream} for decoding TransformStream
 * @see {@link encodeIterable} for async generator version with Result types
 */
export function createEncoderStream(): TransformStream<RelishValue, Uint8Array> {
  return new TransformStream({
    transform(value, controller) {
      const result = encode(value);
      if (result.isErr()) {
        controller.error(result.error);
        return;
      }
      controller.enqueue(result.value);
    },
  });
}

/**
 * Creates a TransformStream for decoding bytes to Relish values.
 *
 * Implements the Web Streams API for use with ReadableStream/WritableStream.
 * Buffers incomplete frames across chunks.
 *
 * @returns TransformStream<Uint8Array, DecodedValue>
 *
 * @example
 * Web Streams pipeline:
 * ```typescript
 * import { createDecoderStream } from '@grounds/stream';
 *
 * const decoder = createDecoderStream();
 *
 * const bytesStream = new ReadableStream({
 *   async start(controller) {
 *     controller.enqueue(new Uint8Array([0x02, 0x2a])); // U8(42)
 *     controller.close();
 *   }
 * });
 *
 * const valuesStream = bytesStream.pipeThrough(decoder);
 *
 * for await (const value of valuesStream) {
 *   console.log('Decoded:', value);
 * }
 * ```
 *
 * @remarks
 * Maintains internal buffer for frame boundaries. Decoding errors terminate
 * the stream. For Result-based error handling, use {@link decodeIterable}.
 *
 * @see {@link createEncoderStream} for encoding TransformStream
 * @see {@link decodeIterable} for async generator version with Result types
 */
export function createDecoderStream(): TransformStream<Uint8Array, DecodedValue> {
  const buffer = new StreamBuffer();

  return new TransformStream({
    transform(chunk, controller) {
      buffer.append(chunk);

      while (buffer.length > 0) {
        const result = buffer.tryDecodeOne();

        if (result.status === "needMore") {
          break;
        }

        if (result.status === "error") {
          controller.error(result.error);
          return;
        }

        if (result.status === "ok") {
          if (result.value.isErr()) {
            controller.error(result.value.error);
            return;
          }
          controller.enqueue(result.value.value);
        }
      }
    },

    flush(controller) {
      // Check for incomplete trailing data
      if (buffer.length > 0) {
        const result = buffer.tryDecodeOne();
        if (result.status === "needMore") {
          // TRUNCATED_STREAM: specific error for incomplete data at end
          controller.error(
            DecodeErrorClass.truncatedStream(
              `${buffer.length} bytes remaining at end of stream`
            )
          );
          return;
        }

        if (result.status === "error") {
          controller.error(result.error);
          return;
        }

        if (result.status === "ok") {
          if (result.value.isErr()) {
            controller.error(result.value.error);
            return;
          }
          controller.enqueue(result.value.value);
        }
      }
    },
  });
}
