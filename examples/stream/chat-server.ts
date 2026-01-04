// examples/stream/chat-server.ts
// Demonstrates: WebSocket chat server using schemas and streaming with Web Streams

import { RStruct, RString, RTimestamp, field } from "@grounds/schema";
import { createSchemaEncoderStream, createSchemaDecoderStream } from "@grounds/stream";
import { type Static } from "@sinclair/typebox";
import { WebSocketServer, WebSocket } from "ws";

// Define ChatMessage schema using RStruct
const ChatMessageSchema = RStruct({
  name: field(0, RString()),
  timestamp: field(1, RTimestamp()),
  message: field(2, RString()),
});

type ChatMessage = Static<typeof ChatMessageSchema>;

// Store connected WebSocket clients
const clients = new Set<WebSocket>();

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.add(ws);

  // Create a readable stream from WebSocket messages
  let decoderWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;
  const { readable: decoderInput, writable } = new TransformStream<Uint8Array, Uint8Array>();
  decoderWriter = writable.getWriter();

  // Pipe through decoder and start reading messages
  const decoderStream = decoderInput.pipeThrough(createSchemaDecoderStream(ChatMessageSchema));
  const decoderReader = decoderStream.getReader();

  // Start async message reading loop
  (async () => {
    try {
      while (true) {
        const { done, value } = await decoderReader.read();
        if (done) break;

        const chatMessage: ChatMessage = value;
        // Print the message to console
        const timestamp = chatMessage.timestamp.toISO();
        console.log(`[${timestamp}] ${chatMessage.name}: ${chatMessage.message}`);

        // Broadcast to ALL OTHER clients (not back to sender)
        for (const client of clients) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            // Create an encoder stream and encode this message
            const { readable: encoderOutput, writable: encoderInput } = new TransformStream<ChatMessage, ChatMessage>();
            const encodedStream = encoderOutput.pipeThrough(createSchemaEncoderStream(ChatMessageSchema));

            // Write message to encoder
            const encoderInputWriter = encoderInput.getWriter();
            encoderInputWriter.write(chatMessage);
            encoderInputWriter.close();

            // Read the encoded bytes and send to client
            const encodedReader = encodedStream.getReader();
            const { done: encodeDone, value: encodedBytes } = await encodedReader.read();
            if (!encodeDone && encodedBytes) {
              client.send(encodedBytes);
            }
            encodedReader.cancel();
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Failed to decode message:", error.message);
      }
    }
  })();

  // When WebSocket receives data, write it to the decoder stream
  ws.on("message", (data) => {
    // Ensure data is a Uint8Array
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer);

    // Write to decoder stream
    if (decoderWriter) {
      decoderWriter.write(bytes).catch((error) => {
        console.error("Failed to write to decoder stream:", error instanceof Error ? error.message : String(error));
      });
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
    // Close the decoder stream
    if (decoderWriter) {
      decoderWriter.close().catch(() => {
        // Stream already closed, ignore error
      });
    }
    decoderReader.cancel();
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error.message);
    clients.delete(ws);
  });
});

console.log(`Chat server listening on ws://localhost:${PORT}`);
