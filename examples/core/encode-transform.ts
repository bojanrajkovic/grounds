// examples/core/encode-transform.ts
// Demonstrates: Transforming successful results with .map()

import { encode, U32 } from "@grounds/core";

// Encode a value and transform the result to hex string
const hexResult = encode(U32(42)).map((bytes) => Buffer.from(bytes).toString("hex"));

// Use .unwrapOr() to get value with fallback
const hex = hexResult.unwrapOr("encoding failed");

console.log("Encoding 42 as U32:");
console.log("Hex:", hex);

// Can also use .match() on the transformed result
hexResult.match(
  (hexString) => console.log("Success! Hex bytes:", hexString),
  (err) => console.error("Failed:", err.message),
);
