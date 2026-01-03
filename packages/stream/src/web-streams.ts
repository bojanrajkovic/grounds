// pattern: Imperative Shell
import {
  encode,
  type RelishValue,
  type DecodedValue,
  DecodeError as DecodeErrorClass,
} from "@grounds/core";
import { StreamBuffer } from "./buffer.js";

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
