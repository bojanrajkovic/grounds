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
  id: field(RU64, 0),
  name: field(RString, 1),
  email: field(ROptional(RString), 2),
  active: field(RBool, 3),
  createdAt: field(RTimestamp, 4),
});

// Define a Message enum
const MessageSchema = REnum({
  text: variant(RStruct({
    content: field(RString, 0),
    sender: field(RString, 1),
  }), 0),
  image: variant(RStruct({
    url: field(RString, 0),
    width: field(RU32, 1),
    height: field(RU32, 2),
  }), 1),
});

// Create codecs
const userCodec = createCodec(UserSchema);
const messageCodec = createCodec(MessageSchema);

// Encode a user
console.log("=== Encoding User ===");

const user = {
  id: 12345n,
  name: "Alice",
  email: "alice@example.com",
  active: true,
  createdAt: DateTime.now(),
};

const encodedUser = userCodec.encode(user);
if (encodedUser.isOk()) {
  console.log("Encoded bytes:", encodedUser.value.length, "bytes");
  console.log("Hex:", Buffer.from(encodedUser.value).toString("hex"));

  // Decode it back
  const decodedUser = userCodec.decode(encodedUser.value);
  if (decodedUser.isOk()) {
    console.log("Decoded user:", decodedUser.value);
  }
}

// Encode messages
console.log("\n=== Encoding Messages ===");

const textMessage = { text: { content: "Hello!", sender: "Alice" } };
const imageMessage = { image: { url: "https://example.com/img.png", width: 800, height: 600 } };

const encodedText = messageCodec.encode(textMessage);
const encodedImage = messageCodec.encode(imageMessage);

if (encodedText.isOk()) {
  console.log("Text message:", encodedText.value.length, "bytes");
  const decoded = messageCodec.decode(encodedText.value);
  console.log("Decoded:", decoded.isOk() ? decoded.value : decoded.error);
}

if (encodedImage.isOk()) {
  console.log("Image message:", encodedImage.value.length, "bytes");
  const decoded = messageCodec.decode(encodedImage.value);
  console.log("Decoded:", decoded.isOk() ? decoded.value : decoded.error);
}

// Arrays of structs
console.log("\n=== Array of Users ===");

const UsersSchema = RArray(UserSchema);
const usersCodec = createCodec(UsersSchema);

const users = [
  { id: 1n, name: "Alice", email: null, active: true, createdAt: DateTime.now() },
  { id: 2n, name: "Bob", email: "bob@example.com", active: false, createdAt: DateTime.now() },
];

const encodedUsers = usersCodec.encode(users);
if (encodedUsers.isOk()) {
  console.log("Encoded users array:", encodedUsers.value.length, "bytes");
}
