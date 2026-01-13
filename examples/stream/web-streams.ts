// examples/stream/web-streams.ts
// Demonstrates: Web Streams API for encode/decode pipelines

import { createEncoderStream, createDecoderStream } from "@grounds/stream";
import { Null, Bool, String_, type RelishValue, type DecodedValue } from "@grounds/core";

async function example(): Promise<void> {
  // Create values to stream
  const values: Array<RelishValue> = [Null, Bool(true), String_("streaming!")];

  // Create a readable stream of values
  const valueStream = new ReadableStream<RelishValue>({
    start(controller) {
      for (const v of values) {
        controller.enqueue(v);
      }
      controller.close();
    },
  });

  // Pipe through encoder to get byte chunks
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

  // Create readable stream from chunks
  const chunkStream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) {
        controller.enqueue(c);
      }
      controller.close();
    },
  });

  // Pipe through decoder to get values back
  const decodedStream = chunkStream.pipeThrough(createDecoderStream());

  // Collect decoded values
  const decoded: Array<DecodedValue> = [];
  const decodedReader = decodedStream.getReader();

  while (true) {
    const { done, value } = await decodedReader.read();
    if (done) break;
    decoded.push(value);
  }

  console.log("Decoded", decoded.length, "values");
  console.log("Values:", decoded);
}

await example();
