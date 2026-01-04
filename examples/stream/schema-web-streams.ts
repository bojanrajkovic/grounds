// examples/stream/schema-web-streams.ts
// pattern: Imperative Shell
// Demonstrates: Schema-aware Web Streams with automatic type conversion

import {
  createSchemaEncoderStream,
  createSchemaDecoderStream,
} from "@grounds/stream";
import { RStruct, RString, field } from "@grounds/schema";
import { type Static } from "@sinclair/typebox";

// Define a Message schema using RStruct
const MessageSchema = RStruct({
  sender: field(0, RString()),
  content: field(1, RString()),
});

type Message = Static<typeof MessageSchema>;

async function example(): Promise<void> {
  console.log("=== Schema-aware Web Streams ===\n");

  // Create typed Message values
  const messages: Array<Message> = [
    { sender: "alice", content: "hello" },
    { sender: "bob", content: "world" },
    { sender: "charlie", content: "how are you?" },
  ];

  console.log("Original messages:");
  for (const msg of messages) {
    console.log(`  ${msg.sender}: ${msg.content}`);
  }
  console.log();

  // Step 1: Create a readable stream of typed Message values
  const messageStream = new ReadableStream<Message>({
    start(controller) {
      for (const msg of messages) {
        controller.enqueue(msg);
      }
      controller.close();
    },
  });

  // Step 2: Pipe through schema encoder (accepts Message, outputs Uint8Array)
  console.log("Encoding messages through schema encoder stream...");
  const encodedStream = messageStream.pipeThrough(
    createSchemaEncoderStream(MessageSchema),
  );

  // Collect encoded chunks
  const chunks: Array<Uint8Array> = [];
  const encodedReader = encodedStream.getReader();

  while (true) {
    const { done, value } = await encodedReader.read();
    if (done) break;
    chunks.push(value);
    console.log(`  Encoded chunk: ${value.length} bytes`);
  }

  console.log(`Total encoded: ${chunks.length} chunks\n`);

  // Step 3: Create readable stream from encoded chunks
  const chunkStream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });

  // Step 4: Pipe through schema decoder (accepts Uint8Array, outputs typed Message)
  console.log("Decoding messages through schema decoder stream...");
  const decodedStream = chunkStream.pipeThrough(
    createSchemaDecoderStream(MessageSchema),
  );

  // Collect decoded typed values
  const decodedMessages: Array<Message> = [];
  const decodedReader = decodedStream.getReader();

  while (true) {
    const { done, value } = await decodedReader.read();
    if (done) break;
    decodedMessages.push(value);
    console.log(`  Decoded message from ${value.sender}: "${value.content}"`);
  }

  console.log(`\nSuccessfully decoded ${decodedMessages.length} messages\n`);

  // Step 5: Verify round-trip
  console.log("=== Verification ===");
  console.log("Decoded messages:");
  for (const msg of decodedMessages) {
    console.log(`  ${msg.sender}: ${msg.content}`);
  }

  // Check if all messages match
  let allMatch = true;
  for (let i = 0; i < messages.length; i++) {
    if (
      messages[i].sender !== decodedMessages[i].sender ||
      messages[i].content !== decodedMessages[i].content
    ) {
      allMatch = false;
      break;
    }
  }

  console.log(`\nRound-trip successful: ${allMatch ? "YES" : "NO"}`);
}

await example();
