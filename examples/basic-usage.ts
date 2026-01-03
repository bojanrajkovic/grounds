// examples/basic-usage.ts
// pattern: Imperative Shell
// Basic low-level Relish encoding/decoding

import { encode, decode, TypeCode } from "@grounds/core";

// Encode primitive values
console.log("=== Encoding Primitives ===");

const nullResult = encode({ type: TypeCode.Null, value: null });
console.log("Null:", nullResult.isOk() ? nullResult.value : nullResult.error);

const boolResult = encode({ type: TypeCode.Bool, value: true });
console.log("Bool:", boolResult.isOk() ? boolResult.value : boolResult.error);

const u32Result = encode({ type: TypeCode.U32, value: 12345 });
console.log("U32:", u32Result.isOk() ? u32Result.value : u32Result.error);

const stringResult = encode({ type: TypeCode.String, value: "hello world" });
console.log("String:", stringResult.isOk() ? stringResult.value : stringResult.error);

// Encode an array
console.log("\n=== Encoding Array ===");

const arrayResult = encode({
  type: TypeCode.Array,
  value: [
    { type: TypeCode.U8, value: 1 },
    { type: TypeCode.U8, value: 2 },
    { type: TypeCode.U8, value: 3 },
  ],
});
console.log("Array:", arrayResult.isOk() ? arrayResult.value : arrayResult.error);

// Decode values
console.log("\n=== Decoding ===");

if (stringResult.isOk()) {
  const decoded = decode(stringResult.value);
  if (decoded.isOk()) {
    console.log("Decoded string:", decoded.value);
  }
}

if (arrayResult.isOk()) {
  const decoded = decode(arrayResult.value);
  if (decoded.isOk()) {
    console.log("Decoded array:", decoded.value);
  }
}

// Error handling
console.log("\n=== Error Handling ===");

const overflowResult = encode({ type: TypeCode.U8, value: 300 });
if (overflowResult.isErr()) {
  console.log("Error code:", overflowResult.error.code);
  console.log("Error message:", overflowResult.error.message);
}
