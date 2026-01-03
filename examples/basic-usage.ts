// examples/basic-usage.ts
// pattern: Imperative Shell
// Basic low-level Relish encoding/decoding

import { encode, decode, TypeCode } from "@grounds/core";

// Encode primitive values
console.log("=== Encoding primitives ===");

const nullResult = encode({ type: TypeCode.Null, value: null });
console.log("Null:", nullResult.match(
  (bytes) => bytes,
  (err) => err.message,
));

const boolResult = encode({ type: TypeCode.Bool, value: true });
console.log("Bool:", boolResult.match(
  (bytes) => bytes,
  (err) => err.message,
));

const u32Result = encode({ type: TypeCode.U32, value: 12345 });
console.log("U32:", u32Result.match(
  (bytes) => bytes,
  (err) => err.message,
));

const stringResult = encode({ type: TypeCode.String, value: "hello world" });
console.log("String:", stringResult.match(
  (bytes) => bytes,
  (err) => err.message,
));

// Encode an array
console.log("\n=== Encoding array ===");

const arrayResult = encode({
  type: TypeCode.Array,
  value: [
    { type: TypeCode.U8, value: 1 },
    { type: TypeCode.U8, value: 2 },
    { type: TypeCode.U8, value: 3 },
  ],
});
console.log("Array:", arrayResult.match(
  (bytes) => bytes,
  (err) => err.message,
));

// Decode values using andThen for chaining
console.log("\n=== Decoding ===");

// Chain encode -> decode using andThen
const stringRoundtrip = encode({ type: TypeCode.String, value: "hello world" })
  .andThen((bytes) => decode(bytes));

console.log("String roundtrip:", stringRoundtrip.match(
  (value) => value,
  (err) => `Failed: ${err.message}`,
));

const arrayRoundtrip = encode({
  type: TypeCode.Array,
  value: [
    { type: TypeCode.U8, value: 1 },
    { type: TypeCode.U8, value: 2 },
    { type: TypeCode.U8, value: 3 },
  ],
}).andThen((bytes) => decode(bytes));

console.log("Array roundtrip:", arrayRoundtrip.match(
  (value) => value,
  (err) => `Failed: ${err.message}`,
));

// Error handling with match
console.log("\n=== Error handling ===");

const overflowResult = encode({ type: TypeCode.U8, value: 300 });
overflowResult.match(
  (bytes) => console.log("Unexpected success:", bytes),
  (err) => {
    console.log("Error code:", err.code);
    console.log("Error message:", err.message);
  },
);

// Using map to transform successful results
console.log("\n=== Transforming results ===");

const hexString = encode({ type: TypeCode.U32, value: 42 })
  .map((bytes) => Buffer.from(bytes).toString("hex"))
  .unwrapOr("encoding failed");

console.log("Hex encoding of 42:", hexString);
