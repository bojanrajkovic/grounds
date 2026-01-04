# Documentation Restructure Implementation Plan - Phase 2

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-an-implementation-plan to implement this plan task-by-task.

**Goal:** Break existing `examples/basic-usage.ts` into focused single-concept files

**Architecture:** Each example file demonstrates one concept (~10-20 lines), uses idiomatic neverthrow patterns (.match(), .andThen(), .map()), and is independently runnable.

**Tech Stack:** TypeScript, @grounds/core, tsx

**Scope:** 8 phases from original design (this is phase 2 of 8)

**Codebase verified:** 2026-01-03

---

## Phase 2: Example Restructure - Core Package

**Goal:** Break existing `examples/basic-usage.ts` into focused files

**Dependencies:** Phase 1 (tsx available for running examples)

---

### Task 1: Create examples/core directory

**Files:**
- Create: `examples/core/` directory

**Step 1: Create the directory**

Run: `mkdir -p examples/core`

**Step 2: Verify directory exists**

Run: `ls -la examples/`
Expected: `core/` directory listed

**Step 3: Commit**

```bash
git add examples/core/.gitkeep 2>/dev/null || true
git commit --allow-empty -m "$(cat <<'EOF'
chore: create examples/core directory structure

Prepare directory for focused core package example files.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Create encode-match.ts (basic encode + .match())

**Files:**
- Create: `examples/core/encode-match.ts`

**Step 1: Create the example file**

```typescript
// examples/core/encode-match.ts
// pattern: Imperative Shell
// Demonstrates: Basic encoding with .match() for result handling

import { encode, TypeCode } from "@grounds/core";

// Encode a string value
const result = encode({ type: TypeCode.String, value: "hello world" });

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
```

**Step 2: Run the example to verify it works**

Run: `pnpm exec tsx examples/core/encode-match.ts`
Expected: Output showing "Encoded successfully!" with byte array and length

**Step 3: Commit**

```bash
git add examples/core/encode-match.ts
git commit -m "$(cat <<'EOF'
docs(examples): add encode-match example

Demonstrate basic encoding with .match() for result handling.
Single concept: encode a value and handle the Result.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create encode-roundtrip.ts (.andThen() chaining)

**Files:**
- Create: `examples/core/encode-roundtrip.ts`

**Step 1: Create the example file**

```typescript
// examples/core/encode-roundtrip.ts
// pattern: Imperative Shell
// Demonstrates: Chaining encode and decode with .andThen()

import { encode, decode, TypeCode } from "@grounds/core";

// Chain encode -> decode using .andThen()
// If encode fails, decode is skipped and the error propagates
const roundtrip = encode({ type: TypeCode.String, value: "hello world" })
  .andThen((bytes) => decode(bytes));

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
```

**Step 2: Run the example to verify it works**

Run: `pnpm exec tsx examples/core/encode-roundtrip.ts`
Expected: Output showing "Roundtrip successful!" with original and decoded values

**Step 3: Commit**

```bash
git add examples/core/encode-roundtrip.ts
git commit -m "$(cat <<'EOF'
docs(examples): add encode-roundtrip example

Demonstrate chaining encode and decode with .andThen().
Single concept: chain fallible operations, propagating errors.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Create encode-transform.ts (.map() transformation)

**Files:**
- Create: `examples/core/encode-transform.ts`

**Step 1: Create the example file**

```typescript
// examples/core/encode-transform.ts
// pattern: Imperative Shell
// Demonstrates: Transforming successful results with .map()

import { encode, TypeCode } from "@grounds/core";

// Encode a value and transform the result to hex string
const hexResult = encode({ type: TypeCode.U32, value: 42 })
  .map((bytes) => Buffer.from(bytes).toString("hex"));

// Use .unwrapOr() to get value with fallback
const hex = hexResult.unwrapOr("encoding failed");

console.log("Encoding 42 as U32:");
console.log("Hex:", hex);

// Can also use .match() on the transformed result
hexResult.match(
  (hexString) => console.log("Success! Hex bytes:", hexString),
  (err) => console.error("Failed:", err.message),
);
```

**Step 2: Run the example to verify it works**

Run: `pnpm exec tsx examples/core/encode-transform.ts`
Expected: Output showing hex encoding of 42 (should be something like "04 2a000000" - type code + little-endian value)

**Step 3: Commit**

```bash
git add examples/core/encode-transform.ts
git commit -m "$(cat <<'EOF'
docs(examples): add encode-transform example

Demonstrate transforming results with .map() and .unwrapOr().
Single concept: transform success values without unwrapping.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Create encode-error.ts (error handling)

**Files:**
- Create: `examples/core/encode-error.ts`

**Step 1: Create the example file**

```typescript
// examples/core/encode-error.ts
// pattern: Imperative Shell
// Demonstrates: Handling encoding errors with .match() and .mapErr()

import { encode, TypeCode } from "@grounds/core";

// Attempt to encode an invalid value (300 exceeds u8 max of 255)
const result = encode({ type: TypeCode.U8, value: 300 });

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
const contextualResult = encode({ type: TypeCode.U8, value: 300 })
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
```

**Step 2: Run the example to verify it works**

Run: `pnpm exec tsx examples/core/encode-error.ts`
Expected: Output showing error handling with code, message, and added context

**Step 3: Commit**

```bash
git add examples/core/encode-error.ts
git commit -m "$(cat <<'EOF'
docs(examples): add encode-error example

Demonstrate error handling with .match() and .mapErr().
Single concept: inspect and enrich encoding errors.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Create encode-collections.ts (arrays)

**Files:**
- Create: `examples/core/encode-collections.ts`

**Step 1: Create the example file**

```typescript
// examples/core/encode-collections.ts
// pattern: Imperative Shell
// Demonstrates: Encoding arrays and maps

import { encode, decode, TypeCode } from "@grounds/core";

// Encode an array of values
const arrayResult = encode({
  type: TypeCode.Array,
  value: [
    { type: TypeCode.U8, value: 1 },
    { type: TypeCode.U8, value: 2 },
    { type: TypeCode.U8, value: 3 },
  ],
});

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

// Encode a map
const mapResult = encode({
  type: TypeCode.Map,
  value: new Map([
    [{ type: TypeCode.String, value: "name" }, { type: TypeCode.String, value: "Alice" }],
    [{ type: TypeCode.String, value: "age" }, { type: TypeCode.U8, value: 30 }],
  ]),
});

mapResult.match(
  (bytes) => console.log("Map encoded:", bytes.length, "bytes"),
  (err) => console.error("Map encoding failed:", err.message),
);
```

**Step 2: Run the example to verify it works**

Run: `pnpm exec tsx examples/core/encode-collections.ts`
Expected: Output showing successful encoding and decoding of array and map

**Step 3: Commit**

```bash
git add examples/core/encode-collections.ts
git commit -m "$(cat <<'EOF'
docs(examples): add encode-collections example

Demonstrate encoding arrays and maps.
Single concept: composite type encoding and roundtrip.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Delete original basic-usage.ts

**Files:**
- Delete: `examples/basic-usage.ts`

**Step 1: Remove the file**

Run: `rm examples/basic-usage.ts`

**Step 2: Verify file is removed**

Run: `ls examples/`
Expected: `basic-usage.ts` no longer listed, `core/` directory present

**Step 3: Commit**

```bash
git add -u examples/basic-usage.ts
git commit -m "$(cat <<'EOF'
docs(examples): remove basic-usage.ts (replaced by focused examples)

The monolithic basic-usage.ts has been replaced by focused
single-concept examples in examples/core/:
- encode-match.ts
- encode-roundtrip.ts
- encode-transform.ts
- encode-error.ts
- encode-collections.ts

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 Verification

After completing all tasks:

- [ ] `examples/core/` directory exists with 5 example files
- [ ] Each example runs successfully with `pnpm exec tsx examples/core/<file>.ts`
- [ ] `examples/basic-usage.ts` is deleted
- [ ] All examples use idiomatic neverthrow patterns (.match(), .andThen(), .map(), .mapErr())
