// examples/stream/async-generators.ts
// Demonstrates: Streaming encode/decode with async generators

import { encodeIterable, decodeIterable } from "@grounds/stream";
import { String_, U32, Bool, type RelishValue, type DecodedValue } from "@grounds/core";

// Generate values using an async generator
async function* generateValues(): AsyncGenerator<RelishValue> {
  yield String_("hello");
  yield U32(42);
  yield Bool(true);
}

// Encode values to byte chunks
async function example(): Promise<void> {
  const chunks: Array<Uint8Array> = [];

  // encodeIterable yields Result<Uint8Array, EncodeError> for each value
  for await (const result of encodeIterable(generateValues())) {
    result.match(
      (bytes) => chunks.push(bytes),
      (err) => console.error("Encode error:", err.message),
    );
  }

  console.log("Encoded", chunks.length, "chunks");

  // Decode chunks back to values
  async function* yieldChunks(): AsyncGenerator<Uint8Array> {
    for (const chunk of chunks) {
      yield chunk;
    }
  }

  const values: Array<DecodedValue> = [];

  // decodeIterable yields Result<DecodedValue, DecodeError> for each value
  for await (const result of decodeIterable(yieldChunks())) {
    result.match(
      (value) => values.push(value),
      (err) => console.error("Decode error:", err.message),
    );
  }

  console.log("Decoded", values.length, "values");
  console.log("Values:", values);
}

await example();
