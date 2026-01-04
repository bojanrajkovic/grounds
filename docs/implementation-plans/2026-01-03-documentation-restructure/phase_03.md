# Documentation Restructure Implementation Plan - Phase 3

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-an-implementation-plan to implement this plan task-by-task.

**Goal:** Break existing `examples/schema-usage.ts` into focused single-concept files

**Architecture:** Each example file demonstrates one concept (~10-20 lines), uses idiomatic neverthrow patterns, and is independently runnable.

**Tech Stack:** TypeScript, @grounds/schema, @sinclair/typebox, luxon, tsx

**Scope:** 8 phases from original design (this is phase 3 of 8)

**Codebase verified:** 2026-01-03

---

## Phase 3: Example Restructure - Schema Package

**Goal:** Break existing `examples/schema-usage.ts` into focused files

**Dependencies:** Phase 2 (pattern established for example structure)

---

### Task 1: Create examples/schema directory

**Files:**
- Create: `examples/schema/` directory

**Step 1: Create the directory**

Run: `mkdir -p examples/schema`

**Step 2: Verify directory exists**

Run: `ls -la examples/`
Expected: `schema/` directory listed alongside `core/`

**Step 3: Commit**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
chore: create examples/schema directory structure

Prepare directory for focused schema package example files.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Create defining-structs.ts (RStruct, field())

**Files:**
- Create: `examples/schema/defining-structs.ts`

**Step 1: Create the example file**

```typescript
// examples/schema/defining-structs.ts
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
```

**Step 2: Run the example to verify it works**

Run: `pnpm exec tsx examples/schema/defining-structs.ts`
Expected: Output showing user object and type information

**Step 3: Commit**

```bash
git add examples/schema/defining-structs.ts
git commit -m "$(cat <<'EOF'
docs(examples): add defining-structs example

Demonstrate struct schema definition with RStruct and field().
Single concept: define a schema and extract its TypeScript type.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create defining-enums.ts (REnum, variant())

**Files:**
- Create: `examples/schema/defining-enums.ts`

**Step 1: Create the example file**

```typescript
// examples/schema/defining-enums.ts
// pattern: Imperative Shell
// Demonstrates: Defining enum schemas with REnum and variant()

import { REnum, RStruct, RString, RU32, field, variant } from "@grounds/schema";
import type { Static } from "@sinclair/typebox";

// Define struct schemas for each variant
const TextMessageSchema = RStruct({
  content: field(0, RString()),
  sender: field(1, RString()),
});

const ImageMessageSchema = RStruct({
  url: field(0, RString()),
  width: field(1, RU32()),
  height: field(2, RU32()),
});

// Define an enum with named variants
// Each variant has a numeric ID (for wire format) and a schema
const MessageSchema = REnum({
  text: variant(0, TextMessageSchema),
  image: variant(1, ImageMessageSchema),
});

// Extract types for each variant
type TextMessage = Static<typeof TextMessageSchema>;
type ImageMessage = Static<typeof ImageMessageSchema>;

// Create instances of each variant
const textMsg: TextMessage = { content: "Hello!", sender: "Alice" };
const imageMsg: ImageMessage = { url: "https://example.com/img.png", width: 800, height: 600 };

console.log("Enum schema defined successfully");
console.log("Text message:", textMsg);
console.log("Image message:", imageMsg);
```

**Step 2: Run the example to verify it works**

Run: `pnpm exec tsx examples/schema/defining-enums.ts`
Expected: Output showing both message variants

**Step 3: Commit**

```bash
git add examples/schema/defining-enums.ts
git commit -m "$(cat <<'EOF'
docs(examples): add defining-enums example

Demonstrate enum schema definition with REnum and variant().
Single concept: define tagged union schemas with multiple variants.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Create using-codecs.ts (createCodec, encode/decode)

**Files:**
- Create: `examples/schema/using-codecs.ts`

**Step 1: Create the example file**

```typescript
// examples/schema/using-codecs.ts
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
```

**Step 2: Run the example to verify it works**

Run: `pnpm exec tsx examples/schema/using-codecs.ts`
Expected: Output showing encoded bytes, hex, and successful roundtrip

**Step 3: Commit**

```bash
git add examples/schema/using-codecs.ts
git commit -m "$(cat <<'EOF'
docs(examples): add using-codecs example

Demonstrate creating codecs and encoding/decoding with them.
Single concept: codec creation and roundtrip serialization.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Create optional-fields.ts (ROptional, null handling)

**Files:**
- Create: `examples/schema/optional-fields.ts`

**Step 1: Create the example file**

```typescript
// examples/schema/optional-fields.ts
// pattern: Imperative Shell
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
codec.encode(fullProfile)
  .andThen((bytes) => codec.decode(bytes))
  .match(
    (decoded) => console.log("  Decoded:", decoded),
    (err) => console.error("  Failed:", err.message),
  );

console.log("\nMinimal profile:");
codec.encode(minimalProfile)
  .andThen((bytes) => codec.decode(bytes))
  .match(
    (decoded) => console.log("  Decoded:", decoded),
    (err) => console.error("  Failed:", err.message),
  );
```

**Step 2: Run the example to verify it works**

Run: `pnpm exec tsx examples/schema/optional-fields.ts`
Expected: Output showing both profiles with null values preserved

**Step 3: Commit**

```bash
git add examples/schema/optional-fields.ts
git commit -m "$(cat <<'EOF'
docs(examples): add optional-fields example

Demonstrate optional fields with ROptional and null handling.
Single concept: schema fields that may be absent (null).

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Delete original schema-usage.ts

**Files:**
- Delete: `examples/schema-usage.ts`

**Step 1: Remove the file**

Run: `rm examples/schema-usage.ts`

**Step 2: Verify file is removed**

Run: `ls examples/`
Expected: `schema-usage.ts` no longer listed, `core/` and `schema/` directories present

**Step 3: Commit**

```bash
git add -u examples/schema-usage.ts
git commit -m "$(cat <<'EOF'
docs(examples): remove schema-usage.ts (replaced by focused examples)

The monolithic schema-usage.ts has been replaced by focused
single-concept examples in examples/schema/:
- defining-structs.ts
- defining-enums.ts
- using-codecs.ts
- optional-fields.ts

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 Verification

After completing all tasks:

- [ ] `examples/schema/` directory exists with 4 example files
- [ ] Each example runs successfully with `pnpm exec tsx examples/schema/<file>.ts`
- [ ] `examples/schema-usage.ts` is deleted
- [ ] All examples use idiomatic neverthrow patterns (.match(), .andThen())
