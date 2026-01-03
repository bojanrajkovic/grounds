// examples/schema-usage.ts
// pattern: Imperative Shell
// Schema-driven Relish serialization with TypeBox

import {
  RStruct, REnum, RArray, ROptional,
  RString, RU32, RU64, RBool, RTimestamp,
  field, variant, createCodec,
} from "@grounds/schema";
import { DateTime } from "luxon";

// Define a User schema
const UserSchema = RStruct({
  id: field(0, RU64()),
  name: field(1, RString()),
  email: field(2, ROptional(RString())),
  active: field(3, RBool()),
  createdAt: field(4, RTimestamp()),
});

// Define a Message enum
const MessageSchema = REnum({
  text: variant(0, RStruct({
    content: field(0, RString()),
    sender: field(1, RString()),
  })),
  image: variant(1, RStruct({
    url: field(0, RString()),
    width: field(1, RU32()),
    height: field(2, RU32()),
  })),
});

// Create codecs
const userCodec = createCodec(UserSchema);
const messageCodec = createCodec(MessageSchema);

// Encode and decode a user using andThen for chaining
console.log("=== User roundtrip ===");

const user = {
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

// Encode messages - just pass the value, variant is inferred
console.log("\n=== Encoding messages ===");

// Pass the struct that matches a variant - encoder infers which variant
const textMessage = { content: "Hello!", sender: "Alice" };
const imageMessage = { url: "https://example.com/img.png", width: 800, height: 600 };

// Roundtrip text message
messageCodec.encode(textMessage)
  .andThen((bytes) => {
    console.log("Text message:", bytes.length, "bytes");
    return messageCodec.decode(bytes);
  })
  .match(
    // Decoded as { text: { content, sender } }
    (decoded) => console.log("Decoded text:", decoded),
    (err) => console.log("Text failed:", err.message),
  );

// Roundtrip image message
messageCodec.encode(imageMessage)
  .andThen((bytes) => {
    console.log("Image message:", bytes.length, "bytes");
    return messageCodec.decode(bytes);
  })
  .match(
    // Decoded as { image: { url, width, height } }
    (decoded) => console.log("Decoded image:", decoded),
    (err) => console.log("Image failed:", err.message),
  );

// Arrays of structs using map and unwrapOr
console.log("\n=== Array of users ===");

const UsersSchema = RArray(UserSchema);
const usersCodec = createCodec(UsersSchema);

const users = [
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
