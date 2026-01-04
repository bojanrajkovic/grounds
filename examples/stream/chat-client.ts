// examples/stream/chat-client.ts
// pattern: Imperative Shell
// Demonstrates: WebSocket chat client using schemas and streaming with readline

import { RStruct, RString, RTimestamp, field, createCodec } from "@grounds/schema";
import { type Static } from "@sinclair/typebox";
import { DateTime } from "luxon";
import { createInterface } from "readline";
import { WebSocket } from "ws";

// Define ChatMessage schema using RStruct
const ChatMessageSchema = RStruct({
  name: field(0, RString()),
  timestamp: field(1, RTimestamp()),
  message: field(2, RString()),
});

type ChatMessage = Static<typeof ChatMessageSchema>;

// Create codec for encoding/decoding messages
const codec = createCodec(ChatMessageSchema);

async function main(): Promise<never> {
  // Prompt user for their name
  const userNamePromise = new Promise<string>((resolve) => {
    const readline = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question("Enter your name: ", (name) => {
      readline.close();
      resolve(name);
    });
  });

  const userName = await userNamePromise;

  // Connect to the WebSocket server
  const ws = new WebSocket("ws://localhost:8080");

  ws.on("open", () => {
    console.log("Connected to chat server");
    startReadingInput(userName, ws);
  });

  ws.on("message", (data) => {
    // Decode received message
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer);

    const decodeResult = codec.decode(bytes);

    decodeResult.match(
      (chatMessage: ChatMessage) => {
        const timestamp = chatMessage.timestamp.toISO();
        console.log(`\n[${timestamp}] ${chatMessage.name}: ${chatMessage.message}`);
        process.stdout.write("> ");
      },
      (error) => {
        console.error("Failed to decode message:", error.message);
      }
    );
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error.message);
  });

  ws.on("close", () => {
    console.log("Disconnected from chat server");
    process.exit(0);
  });

  // Keep the process alive - this promise never resolves
  return new Promise(() => {
    /* intentionally never resolves */
  });
}

function startReadingInput(userName: string, ws: WebSocket): void {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (): void => {
    readline.question("> ", (input) => {
      if (input.toLowerCase() === "exit") {
        readline.close();
        ws.close();
        return;
      }

      // Create a chat message with current timestamp
      const chatMessage: ChatMessage = {
        name: userName,
        timestamp: DateTime.now(),
        message: input,
      };

      // Encode and send the message
      const encodeResult = codec.encode(chatMessage);

      encodeResult.match(
        (encoded) => {
          ws.send(encoded);
        },
        (error) => {
          console.error("Failed to encode message:", error.message);
        }
      );

      prompt();
    });
  };

  prompt();
}

await main();
