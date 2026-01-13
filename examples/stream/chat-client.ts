// examples/stream/chat-client.ts
// Demonstrates: WebSocket chat client using schemas and streaming with readline and Web Streams

import { RStruct, RString, RTimestamp, field } from "@grounds/schema";
import { createSchemaEncoderStream, createSchemaDecoderStream } from "@grounds/stream";
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

  // Create a readable stream from WebSocket messages
  let decoderWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;
  const { readable: decoderInput, writable } = new TransformStream<Uint8Array, Uint8Array>();
  decoderWriter = writable.getWriter();

  // Pipe through decoder and start reading messages
  const decoderStream = decoderInput.pipeThrough(createSchemaDecoderStream(ChatMessageSchema));
  const decoderReader = decoderStream.getReader();

  ws.on("open", () => {
    console.log("Connected to chat server");
    startReadingInput(userName, ws);
  });

  // Handle incoming messages through the decoder stream
  ws.on("message", (data) => {
    // Ensure data is a Uint8Array
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer);

    // Write to decoder stream
    if (decoderWriter) {
      decoderWriter.write(bytes).catch((error) => {
        console.error(
          "Failed to write to decoder stream:",
          error instanceof Error ? error.message : String(error),
        );
      });
    }
  });

  // Start async message reading loop
  (async () => {
    try {
      while (true) {
        const { done, value } = await decoderReader.read();
        if (done) break;

        const chatMessage: ChatMessage = value;
        const timestamp = chatMessage.timestamp.toISO();
        console.log(`\n[${timestamp}] ${chatMessage.name}: ${chatMessage.message}`);
        process.stdout.write("> ");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Failed to decode message:", error.message);
      }
    }
  })();

  ws.on("error", (error) => {
    console.error("WebSocket error:", error.message);
  });

  ws.on("close", () => {
    console.log("Disconnected from chat server");
    // Close the decoder stream
    if (decoderWriter) {
      decoderWriter.close().catch(() => {
        // Stream already closed, ignore error
      });
    }
    decoderReader.cancel();
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

      // Encode and send the message using encoder stream
      (async () => {
        try {
          const { readable: encoderOutput, writable: encoderInput } = new TransformStream<
            ChatMessage,
            ChatMessage
          >();
          const encodedStream = encoderOutput.pipeThrough(
            createSchemaEncoderStream(ChatMessageSchema),
          );

          // Write message to encoder
          const encoderInputWriter = encoderInput.getWriter();
          encoderInputWriter.write(chatMessage);
          encoderInputWriter.close();

          // Read the encoded bytes and send to server
          const encodedReader = encodedStream.getReader();
          const { done: encodeDone, value: encodedBytes } = await encodedReader.read();
          if (!encodeDone && encodedBytes) {
            ws.send(encodedBytes);
          }
          encodedReader.cancel();
        } catch (error) {
          console.error(
            "Failed to encode message:",
            error instanceof Error ? error.message : String(error),
          );
        }
      })();

      prompt();
    });
  };

  prompt();
}

await main();
