// pattern: Imperative Shell
// Demonstrates: Creating and using codecs for encode/decode

import { RStruct, RString, RU32, field, createCodec } from "@grounds/schema";
import type { Static } from "@sinclair/typebox";

// Define a schema
const UserSchema = RStruct({
  id: field(0, RU32()),
  name: field(1, RString()),
});

type User = Static<typeof UserSchema>;

// Create a codec from the schema
const userCodec = createCodec(UserSchema);

// Create a user object
const user: User = { id: 42, name: "Bob" };

// Encode and decode using .andThen() chaining
userCodec.encode(user)
  .andThen((bytes) => {
    console.log("Encoded:", bytes.length, "bytes");
    console.log("Hex:", Buffer.from(bytes).toString("hex"));
    return userCodec.decode(bytes);
  })
  .match(
    (decoded) => {
      console.log("Decoded:", decoded);
      console.log("Roundtrip successful!");
    },
    (err) => {
      console.error("Failed:", err.message);
    },
  );
