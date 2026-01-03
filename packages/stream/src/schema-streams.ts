// pattern: Imperative Shell
import type { Static } from "@sinclair/typebox";
import { createCodec, type TRelishSchema } from "@grounds/schema";
import { StreamBuffer } from "./buffer.js";
import { DecodeError as DecodeErrorClass } from "@grounds/core";

export function createSchemaEncoderStream<T extends TRelishSchema>(
  schema: T
): TransformStream<Static<T>, Uint8Array> {
  const codec = createCodec(schema);

  return new TransformStream({
    transform(value, controller) {
      const result = codec.encode(value);
      if (result.isErr()) {
        controller.error(result.error);
        return;
      }
      controller.enqueue(result.value);
    },
  });
}

export function createSchemaDecoderStream<T extends TRelishSchema>(
  schema: T
): TransformStream<Uint8Array, Static<T>> {
  const codec = createCodec(schema);
  const buffer = new StreamBuffer();

  return new TransformStream({
    transform(chunk, controller) {
      buffer.append(chunk);

      while (buffer.length > 0) {
        // Peek at the buffer to get the bytes we're about to decode
        const peekLength = Math.min(buffer.length, 1024); // Reasonable peek limit
        const peekedBytes = buffer.peek(peekLength);

        // Try to decode from the peeked data
        const decodeResult = codec.decode(peekedBytes);

        // If decode succeeded, we need to figure out how many bytes it consumed
        // by re-decoding and measuring
        if (decodeResult.isOk()) {
          // Re-decode to get the bytesConsumed
          const result = buffer.tryDecodeOne();
          if (result.status === "ok") {
            if (result.value.isErr()) {
              controller.error(result.value.error);
              return;
            }
            controller.enqueue(decodeResult.value);
          } else if (result.status === "error") {
            controller.error(result.error);
            return;
          } else {
            // This shouldn't happen if decode succeeded
            break;
          }
        } else if (decodeResult.isErr()) {
          // Check if it's an UNEXPECTED_EOF (need more data) or real error
          if (decodeResult.error.code === "UNEXPECTED_EOF") {
            // Need more data
            break;
          } else {
            // Real decode error
            controller.error(decodeResult.error);
            return;
          }
        }
      }
    },

    flush(controller) {
      if (buffer.length > 0) {
        const result = buffer.tryDecodeOne();
        if (result.status === "needMore") {
          controller.error(
            DecodeErrorClass.truncatedStream(
              `${buffer.length} bytes remaining at end of schema stream`
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

          // For the final value, decode using codec
          const peekedBytes = buffer.peek(buffer.length);
          const decodeResult = codec.decode(peekedBytes);
          if (decodeResult.isErr()) {
            controller.error(decodeResult.error);
            return;
          }
          controller.enqueue(decodeResult.value);
        }
      }
    },
  });
}
