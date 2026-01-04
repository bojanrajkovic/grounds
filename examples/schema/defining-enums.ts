// pattern: Imperative Shell
// Demonstrates: Defining enum schemas with REnum and variant()

import { REnum, RStruct, RString, RU32, field, variant } from "@grounds/schema";
import type { Static } from "@sinclair/typebox";

// Define struct schemas for each variant
const TextMessageSchema = RStruct({
  content: field(0, RString()),
  sender: field(1, RString()),
});

const ImageMessageSchema = RStruct({
  url: field(0, RString()),
  width: field(1, RU32()),
  height: field(2, RU32()),
});

// Define an enum with named variants
// Each variant has a numeric ID (for wire format) and a schema
const MessageSchema = REnum({
  text: variant(0, TextMessageSchema),
  image: variant(1, ImageMessageSchema),
});

// Extract types for each variant
type TextMessage = Static<typeof TextMessageSchema>;
type ImageMessage = Static<typeof ImageMessageSchema>;

// Create instances of each variant
const textMsg: TextMessage = { content: "Hello!", sender: "Alice" };
const imageMsg: ImageMessage = { url: "https://example.com/img.png", width: 800, height: 600 };

console.log("Enum schema defined successfully");
console.log("Text message:", textMsg);
console.log("Image message:", imageMsg);
