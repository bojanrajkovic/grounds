// examples/stream/schema-async-generators.ts
// pattern: Imperative Shell
// Demonstrates: Schema-aware streaming with async generators using toRelish

import { RStruct, RString, field, createCodec, type TRelishSchema } from "@grounds/schema";
import { type Static } from "@sinclair/typebox";

// Define a Message schema using RStruct
const MessageSchema = RStruct({
  sender: field(0, RString()),
  content: field(1, RString()),
});

type Message = Static<typeof MessageSchema>;

// Generate typed message values using an async generator
async function* generateMessages(): AsyncGenerator<Message> {
  yield { sender: "alice", content: "hello" };
  yield { sender: "bob", content: "world" };
  yield { sender: "charlie", content: "how are you?" };
}

// Example: Encode typed messages using codec, then decode back
async function example(): Promise<void> {
  console.log("=== Schema-aware Async Generators ===\n");

  // Create a codec for the Message schema
  // This provides encode/decode with full type safety
  const codec = createCodec(MessageSchema);

  // Step 1: Encode messages using the codec
  console.log("Encoding messages...");
  const chunks: Array<Uint8Array> = [];

  for await (const message of generateMessages()) {
    const encodeResult = codec.encode(message);
    encodeResult.match(
      (bytes) => {
        chunks.push(bytes);
        console.log(`  Encoded message from ${message.sender}: ${bytes.length} bytes`);
      },
      (err) => console.error("  Encode error:", err.message),
    );
  }

  console.log(`\nSuccessfully encoded ${chunks.length} messages\n`);

  // Step 2: Decode bytes back to typed messages
  console.log("Decoding messages...");
  const decodedMessages: Array<Message> = [];

  for (const chunk of chunks) {
    const decodeResult = codec.decode(chunk);
    decodeResult.match(
      (message) => {
        decodedMessages.push(message);
        console.log(`  Decoded message from ${message.sender}: "${message.content}"`);
      },
      (err) => {
        console.error("  Decode error:", err.message);
      },
    );
  }

  console.log(
    `\nSuccessfully decoded ${decodedMessages.length} messages\n`,
  );

  // Step 3: Verify round-trip
  console.log("=== Results ===");
  console.log("Original messages:");
  for await (const msg of generateMessages()) {
    console.log(`  ${msg.sender}: ${msg.content}`);
  }

  console.log("\nDecoded messages:");
  for (const msg of decodedMessages) {
    console.log(`  ${msg.sender}: ${msg.content}`);
  }

  // Verify all match
  let allMatch = true;
  for await (const origMsg of generateMessages()) {
    const found = decodedMessages.find(
      (m) => m.sender === origMsg.sender && m.content === origMsg.content,
    );
    if (!found) {
      allMatch = false;
      break;
    }
  }

  console.log(`\nRound-trip successful: ${allMatch ? "YES" : "NO"}`);
}

await example();
