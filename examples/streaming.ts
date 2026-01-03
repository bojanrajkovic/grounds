// examples/streaming.ts
// pattern: Imperative Shell
// Streaming encode/decode with Web Streams API

import { createEncoderStream, createDecoderStream, encodeIterable, decodeIterable } from "@grounds/stream";
import { TypeCode, type RelishValue } from "@grounds/core";

// AsyncGenerator example using match for each result
console.log("=== AsyncGenerator streaming ===");

async function asyncGeneratorExample(): Promise<void> {
  // Generate values
  async function* generateValues(): AsyncGenerator<RelishValue> {
    for (let i = 0; i < 5; i++) {
      yield { type: TypeCode.U32, value: i * 10 };
      yield { type: TypeCode.String, value: `Item ${i}` };
    }
  }

  // Encode to chunks, using match to handle each result
  const chunks: Array<Uint8Array> = [];
  let encodeErrors = 0;

  for await (const result of encodeIterable(generateValues())) {
    result.match(
      (bytes) => chunks.push(bytes),
      (err) => {
        console.log("Encode error:", err.message);
        encodeErrors++;
      },
    );
  }
  console.log("Encoded", chunks.length, "chunks with", encodeErrors, "errors");

  // Decode from chunks
  async function* yieldChunks(): AsyncGenerator<Uint8Array> {
    for (const chunk of chunks) {
      yield chunk;
    }
  }

  const values: Array<RelishValue> = [];
  let decodeErrors = 0;

  for await (const result of decodeIterable(yieldChunks())) {
    result.match(
      (value) => values.push(value),
      (err) => {
        console.log("Decode error:", err.message);
        decodeErrors++;
      },
    );
  }
  console.log("Decoded", values.length, "values with", decodeErrors, "errors");
}

// Web Streams example - streams handle errors internally
console.log("\n=== Web Streams API ===");

async function webStreamsExample(): Promise<void> {
  const values: Array<RelishValue> = [
    { type: TypeCode.Null, value: null },
    { type: TypeCode.Bool, value: true },
    { type: TypeCode.String, value: "streaming!" },
  ];

  // Create readable stream of values
  const valueStream = new ReadableStream<RelishValue>({
    start(controller) {
      for (const v of values) {
        controller.enqueue(v);
      }
      controller.close();
    },
  });

  // Pipe through encoder
  const encodedStream = valueStream.pipeThrough(createEncoderStream());

  // Collect encoded chunks
  const chunks: Array<Uint8Array> = [];
  const reader = encodedStream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  console.log("Encoded to", chunks.length, "chunks");

  // Create readable stream of chunks
  const chunkStream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) {
        controller.enqueue(c);
      }
      controller.close();
    },
  });

  // Pipe through decoder
  const decodedStream = chunkStream.pipeThrough(createDecoderStream());

  // Collect decoded values
  const decoded: Array<RelishValue> = [];
  const decodedReader = decodedStream.getReader();
  while (true) {
    const { done, value } = await decodedReader.read();
    if (done) break;
    decoded.push(value);
  }
  console.log("Decoded", decoded.length, "values");
  console.log("Values:", decoded);
}

// Run examples
await asyncGeneratorExample();
await webStreamsExample();
