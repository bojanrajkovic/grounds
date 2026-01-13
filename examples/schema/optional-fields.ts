// Demonstrates: Optional fields with ROptional and null handling

import { RStruct, RString, ROptional, field, createCodec } from "@grounds/schema";
import type { Static } from "@sinclair/typebox";

// Define a schema with optional fields
// Optional fields use null for absent values (not undefined)
const ProfileSchema = RStruct({
  name: field(0, RString()),
  bio: field(1, ROptional(RString())),
  website: field(2, ROptional(RString())),
});

type Profile = Static<typeof ProfileSchema>;

const codec = createCodec(ProfileSchema);

// Profile with all fields
const fullProfile: Profile = {
  name: "Alice",
  bio: "Software developer",
  website: "https://alice.dev",
};

// Profile with some fields null
const minimalProfile: Profile = {
  name: "Bob",
  bio: null,
  website: null,
};

// Encode and decode both
console.log("Full profile:");
codec
  .encode(fullProfile)
  .andThen((bytes) => codec.decode(bytes))
  .match(
    (decoded) => console.log("  Decoded:", decoded),
    (err) => console.error("  Failed:", err.message),
  );

console.log("\nMinimal profile:");
codec
  .encode(minimalProfile)
  .andThen((bytes) => codec.decode(bytes))
  .match(
    (decoded) => console.log("  Decoded:", decoded),
    (err) => console.error("  Failed:", err.message),
  );
