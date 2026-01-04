// examples/core/encode-error.ts
// pattern: Imperative Shell
// Demonstrates: Handling encoding errors with .match() and .mapErr()

import { encode } from "@grounds/core";
import { U8 } from "@grounds/core";

// Attempt to encode an invalid value (300 exceeds u8 max of 255)
const result = encode(U8(300));

// Use .match() to inspect the error
result.match(
  (bytes) => {
    console.log("Unexpected success:", bytes);
  },
  (err) => {
    console.log("Expected error occurred!");
    console.log("Error code:", err.code);
    console.log("Error message:", err.message);
  },
);

// Use .mapErr() to add context to errors
const contextualResult = encode(U8(300))
  .mapErr((err) => ({
    ...err,
    context: "Failed while encoding user age field",
  }));

contextualResult.match(
  () => {},
  (err) => {
    console.log("\nWith added context:");
    console.log("Context:", err.context);
    console.log("Original message:", err.message);
  },
);
