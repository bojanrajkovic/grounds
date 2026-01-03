// examples/schema-usage.ts
// pattern: Imperative Shell
// Schema-driven Relish serialization with TypeBox

import {
  RStruct, REnum, RArray, ROptional,
  RString, RU32, RU64, RBool, RTimestamp,
  field, variant, createCodec,
} from "@grounds/schema";
import type { Static } from "@sinclair/typebox";
import { DateTime } from "luxon";

// Define a User schema and infer its TypeScript type
const UserSchema = RStruct({
  id: field(0, RU64()),
  name: field(1, RString()),
  email: field(2, ROptional(RString())),
  active: field(3, RBool()),
  createdAt: field(4, RTimestamp()),
});

// Static<typeof Schema> extracts the TypeScript type from a schema
type User = Static<typeof UserSchema>;
// User = { id: bigint; name: string; email: string | null; active: boolean; createdAt: DateTime }

// Define a Message enum with struct variants
// Each variant has a 'type' field for user-defined discrimination
const TextMessageSchema = RStruct({
  type: field(0, RString()),  // "text"
  content: field(1, RString()),
  sender: field(2, RString()),
});

const ImageMessageSchema = RStruct({
  type: field(0, RString()),  // "image"
  url: field(1, RString()),
  width: field(2, RU32()),
  height: field(3, RU32()),
});

const MessageSchema = REnum({
  text: variant(0, TextMessageSchema),
  image: variant(1, ImageMessageSchema),
});

// Extract types for each variant
type TextMessage = Static<typeof TextMessageSchema>;
type ImageMessage = Static<typeof ImageMessageSchema>;

// Type guard: check the discriminator field
function isTextMessage(msg: TextMessage | ImageMessage): msg is TextMessage {
  return msg.type === "text";
}

// Helper function to process messages with user-defined discrimination
function processMessage(message: TextMessage | ImageMessage): string {
  if (isTextMessage(message)) {
    return `Text from ${message.sender}: "${message.content}"`;
  } else {
    return `Image: ${message.url} (${message.width}x${message.height})`;
  }
}

// Create codecs
const userCodec = createCodec(UserSchema);
const messageCodec = createCodec(MessageSchema);

// Encode and decode a user using andThen for chaining
console.log("=== User roundtrip ===");

// The User type ensures our object matches the schema
const user: User = {
  id: 12345n,
  name: "Alice",
  email: "alice@example.com",
  active: true,
  createdAt: DateTime.now(),
};

// Chain encode -> decode, then log the result
userCodec.encode(user)
  .map((bytes) => {
    console.log("Encoded bytes:", bytes.length, "bytes");
    console.log("Hex:", Buffer.from(bytes).toString("hex"));
    return bytes;
  })
  .andThen((bytes) => userCodec.decode(bytes))
  .match(
    (decoded) => console.log("Decoded user:", decoded),
    (err) => console.log("Failed:", err.message),
  );

// Encode messages - just pass the value, variant is inferred from schema matching
console.log("\n=== Encoding messages ===");

// Include discriminator field for user-defined type narrowing
const textMessage: TextMessage = { type: "text", content: "Hello!", sender: "Alice" };
const imageMessage: ImageMessage = { type: "image", url: "https://example.com/img.png", width: 800, height: 600 };

// Roundtrip text message - decode returns unwrapped struct
messageCodec.encode(textMessage)
  .andThen((bytes) => {
    console.log("Text message:", bytes.length, "bytes");
    return messageCodec.decode(bytes);
  })
  .match(
    // Decoded as { type, content, sender } - use type guard for discrimination
    (decoded) => console.log("Processed:", processMessage(decoded as TextMessage | ImageMessage)),
    (err) => console.log("Text failed:", err.message),
  );

// Roundtrip image message
messageCodec.encode(imageMessage)
  .andThen((bytes) => {
    console.log("Image message:", bytes.length, "bytes");
    return messageCodec.decode(bytes);
  })
  .match(
    // Decoded as { type, url, width, height }
    (decoded) => console.log("Processed:", processMessage(decoded as TextMessage | ImageMessage)),
    (err) => console.log("Image failed:", err.message),
  );

// Arrays of structs using map and unwrapOr
console.log("\n=== Array of users ===");

const UsersSchema = RArray(UserSchema);
const usersCodec = createCodec(UsersSchema);

const users: Array<User> = [
  { id: 1n, name: "Alice", email: null, active: true, createdAt: DateTime.now() },
  { id: 2n, name: "Bob", email: "bob@example.com", active: false, createdAt: DateTime.now() },
];

const byteCount = usersCodec.encode(users)
  .map((bytes) => bytes.length)
  .unwrapOr(0);

console.log("Encoded users array:", byteCount, "bytes");

// Demonstrate mapErr for error transformation
console.log("\n=== Error transformation ===");

// This would fail with a type mismatch - demonstrating mapErr
const badUser = { id: "not-a-bigint" as unknown as bigint, name: "Bad", email: null, active: true, createdAt: DateTime.now() };

userCodec.encode(badUser)
  .mapErr((err) => ({
    ...err,
    context: "Failed while encoding user for storage",
  }))
  .match(
    (bytes) => console.log("Encoded:", bytes.length, "bytes"),
    (err) => console.log("Error with context:", err.context, "-", err.message),
  );
