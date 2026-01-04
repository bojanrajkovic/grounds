// examples/core/encode-match.ts
// Demonstrates: Basic encoding with .match() for result handling

import { encode, String_ } from "@grounds/core";

// Encode a string value
const result = encode(String_("hello world"));

// Use .match() to handle success and error cases
result.match(
  (bytes) => {
    console.log("Encoded successfully!");
    console.log("Bytes:", bytes);
    console.log("Length:", bytes.length, "bytes");
  },
  (err) => {
    console.error("Encoding failed:", err.message);
  },
);
