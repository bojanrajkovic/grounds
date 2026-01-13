// examples/core/encode-roundtrip.ts
// Demonstrates: Chaining encode and decode with .andThen()

import { encode, decode, String_ } from "@grounds/core";

// Chain encode -> decode using .andThen()
// If encode fails, decode is skipped and the error propagates
const roundtrip = encode(String_("hello world")).andThen((bytes) => decode(bytes));

// Handle the final result
roundtrip.match(
  (value) => {
    console.log("Roundtrip successful!");
    console.log("Original: hello world");
    console.log("Decoded:", value);
  },
  (err) => {
    console.error("Roundtrip failed:", err.message);
  },
);
