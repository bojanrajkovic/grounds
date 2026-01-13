# Installation

Install Grounds packages using npm or pnpm.

## Core Package Only

For low-level encoding without schema support:

```bash
npm install @grounds/core
# or
pnpm add @grounds/core
```

## With Schema Support (Recommended)

For type-safe schema-driven serialization:

```bash
npm install @grounds/schema @sinclair/typebox luxon
# or
pnpm add @grounds/schema @sinclair/typebox luxon
```

The schema package includes `@grounds/core` as a dependency.

**Peer dependencies:**

- `@sinclair/typebox` - TypeBox for schema definitions
- `luxon` - DateTime handling for timestamps

## With Streaming

For streaming encode/decode:

```bash
npm install @grounds/stream
# or
pnpm add @grounds/stream
```

## TypeScript Configuration

Grounds is written in TypeScript and provides full type definitions. For best results, use strict TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Next Steps

Continue to [First Encode](./first-encode.md) to write your first serialization code.
