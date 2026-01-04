// examples/core/encode-collections.ts
// pattern: Imperative Shell
// Demonstrates: Encoding arrays and maps

import { encode, decode, Array_, Map_, TypeCode } from "@grounds/core";

// Encode an array of values (primitive U8 elements use raw numbers)
const arrayResult = encode(
  Array_(TypeCode.U8, [1, 2, 3])
);

arrayResult.match(
  (bytes) => console.log("Array encoded:", bytes.length, "bytes"),
  (err) => console.error("Array encoding failed:", err.message),
);

// Roundtrip to verify
arrayResult
  .andThen((bytes) => decode(bytes))
  .match(
    (decoded) => console.log("Array decoded:", decoded),
    (err) => console.error("Array decode failed:", err.message),
  );

// Encode a map (primitive String elements use raw strings)
const mapResult = encode(
  Map_(
    TypeCode.String,
    TypeCode.String,
    new Map([
      ["name", "Alice"],
      ["age", "30"],
    ])
  )
);

mapResult.match(
  (bytes) => console.log("Map encoded:", bytes.length, "bytes"),
  (err) => console.error("Map encoding failed:", err.message),
);
