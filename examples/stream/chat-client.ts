// examples/stream/chat-client.ts
// pattern: Imperative Shell
// Demonstrates: WebSocket chat client using schemas and streaming with readline

import { RStruct, RString, RTimestamp, field, createCodec } from "@grounds/schema";
import { type Static } from "@sinclair/typebox";
import { DateTime } from "luxon";
import { createInterface } from "readline";

// Define ChatMessage schema using RStruct
const ChatMessageSchema = RStruct({
  name: field(0, RString()),
  timestamp: field(1, RTimestamp()),
  message: field(2, RString()),
});

type ChatMessage = Static<typeof ChatMessageSchema>;

// Create codec for encoding/decoding messages
const codec = createCodec(ChatMessageSchema);

async function main(): Promise<void> {
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
  let isConnected = false;

  ws.onopen = () => {
    console.log("Connected to chat server");
    isConnected = true;
    startReadingInput(userName, ws);
  };

  ws.onmessage = (event) => {
    // Decode received message
    const bytes = new Uint8Array(event.data);

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
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  ws.onclose = () => {
    console.log("Disconnected from chat server");
    process.exit(0);
  };

  // Keep the process alive
  await new Promise(() => {
    /* never resolves */
  });
}

function startReadingInput(userName: string, ws: WebSocket): void {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
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
