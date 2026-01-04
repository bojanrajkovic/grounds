// examples/stream/chat-server.ts
// pattern: Imperative Shell
// Demonstrates: WebSocket chat server using schemas and streaming

import { RStruct, RString, RTimestamp, field, createCodec } from "@grounds/schema";
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

// Create codec for encoding/decoding messages
const codec = createCodec(ChatMessageSchema);

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.add(ws);

  ws.on("message", (data) => {
    // Ensure data is a Uint8Array
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer);

    // Decode the message from binary
    const decodeResult = codec.decode(bytes);

    decodeResult.match(
      (chatMessage: ChatMessage) => {
        // Print the message to console
        const timestamp = chatMessage.timestamp.toISO();
        console.log(`[${timestamp}] ${chatMessage.name}: ${chatMessage.message}`);

        // Broadcast to ALL OTHER clients (not back to sender)
        for (const client of clients) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            // Re-encode and send to other clients
            const encodeResult = codec.encode(chatMessage);
            encodeResult.match(
              (encoded) => {
                client.send(encoded);
              },
              (error) => {
                console.error("Failed to encode message:", error.message);
              }
            );
          }
        }
      },
      (error) => {
        console.error("Failed to decode message:", error.message);
      }
    );
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error.message);
    clients.delete(ws);
  });
});

console.log(`Chat server listening on ws://localhost:${PORT}`);
