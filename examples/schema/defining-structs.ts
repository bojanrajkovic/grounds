// pattern: Imperative Shell
// Demonstrates: Defining struct schemas with RStruct and field()

import { RStruct, RString, RU32, RBool, field } from "@grounds/schema";
import type { Static } from "@sinclair/typebox";

// Define a User schema
// Each field has a numeric ID (for wire format) and a type
const UserSchema = RStruct({
  id: field(0, RU32()),
  name: field(1, RString()),
  active: field(2, RBool()),
});

// Static<typeof Schema> extracts the TypeScript type
type User = Static<typeof UserSchema>;

// TypeScript now knows the exact shape
const user: User = {
  id: 12345,
  name: "Alice",
  active: true,
};

console.log("User schema defined successfully");
console.log("User object:", user);
console.log("TypeScript infers: { id: number, name: string, active: boolean }");
