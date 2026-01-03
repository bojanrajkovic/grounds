// pattern: Imperative Shell
import type { Static } from "@sinclair/typebox";
import { createCodec, decodedToTyped, type TRelishSchema } from "@grounds/schema";
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

          // Convert raw DecodedValue to schema-typed value
          const typedResult = decodedToTyped<Static<T>>(result.value.value, schema);
          if (typedResult.isErr()) {
            controller.error(typedResult.error);
            return;
          }
          controller.enqueue(typedResult.value);
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

          // Convert raw DecodedValue to schema-typed value
          const typedResult = decodedToTyped<Static<T>>(result.value.value, schema);
          if (typedResult.isErr()) {
            controller.error(typedResult.error);
            return;
          }
          controller.enqueue(typedResult.value);
        }
      }
    },
  });
}
