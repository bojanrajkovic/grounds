// examples/core/encode-error.ts
// Demonstrates: Handling encoding errors with .match() and .mapErr()

import { encode, Struct, String_ } from "@grounds/core";

// Attempt to encode a struct with an invalid field ID (>= 128)
// The Relish wire format requires field IDs to have bit 7 clear (0-127)
const invalidStruct = Struct(new Map([[128, String_("This field ID is invalid")]]));

const result = encode(invalidStruct);

// Use .match() to inspect the error
result.match(
  (bytes) => {
    console.log("Unexpected success:", bytes);
  },
  (err) => {
    console.log("Expected error occurred!");
    console.log("Error message:", err.message);
  },
);

// Use .mapErr() to add context to errors
const contextualResult = encode(invalidStruct).mapErr((err) => ({
  originalMessage: err.message,
  context: "Failed while encoding user profile struct",
}));

contextualResult.match(
  () => {},
  (err) => {
    console.log("\nWith added context:");
    console.log("Context:", err.context);
    console.log("Original message:", err.originalMessage);
  },
);
