# ADR 0002: Unwrapped Enum Encode/Decode API

**Status:** Accepted

**Date:** 2026-01-03

## Context

The original enum encode/decode API required explicit variant specification:

**Old encoding:**
```typescript
codec.encode({ variant: "text", value: { content: "Hello", sender: "Alice" } })
// User must specify which variant they're encoding
```

**Old decoding:**
```typescript
codec.decode(bytes) // Returns { variant: "text", value: { content, sender } }
// Or alternative: { text: { content, sender } }
```

This created friction:
- **Encoding**: Verbose - users must name the variant even though the value's shape uniquely identifies it
- **Decoding**: Extra wrapper level - users must unwrap `{ text: {...} }` or `{ variant, value }` to get the actual data
- **Type guards**: Library-provided discrimination via `"text" in message` couples user code to library's wrapper format

The question arose: why not infer the variant from the value's shape on encode, and return the raw value on decode?

## Decision

### Encoding: Infer variant via schema matching

Use TypeBox's `Value.Check` to determine which variant schema the input value satisfies:

```typescript
// New encoding - variant inferred automatically
codec.encode({ content: "Hello", sender: "Alice" })
// Library checks: Does this match variant 0's schema? Variant 1's? etc.
```

Implementation iterates through variant schemas and uses `Value.Check(variantSchema, value)` to find a match. If exactly one variant matches, encode with that variant's ID. If none or multiple match, return an error.

### Decoding: Return unwrapped value

Return the raw decoded value without any wrapper:

```typescript
// New decoding - raw value returned
codec.decode(bytes) // Returns { content: "Hello", sender: "Alice" }
// Not { text: {...} } or { variant: "text", value: {...} }
```

Users who need to discriminate between variants add their own discriminator field:

```typescript
const MessageSchema = REnum({
  text: variant(0, RStruct({
    type: field(0, RString()),  // "text" - user-defined discriminator
    content: field(1, RString()),
    sender: field(2, RString()),
  })),
  image: variant(1, RStruct({
    type: field(0, RString()),  // "image" - user-defined discriminator
    url: field(1, RString()),
    width: field(2, RU32()),
    height: field(3, RU32()),
  })),
});

// User writes their own type guard
function isTextMessage(msg: TextMessage | ImageMessage): msg is TextMessage {
  return msg.type === "text";
}
```

## Consequences

### Positive

- **Simpler encode API**: Pass the value directly, no need to specify variant name
- **Flatter decode output**: Get the actual data without unwrapping
- **User controls discrimination**: Discriminator field design is user's choice (string enum, numeric code, etc.)
- **Better data modeling**: Users think about their domain model, not library internals
- **Symmetric encode/decode**: Encode takes `{ content, sender }`, decode returns `{ content, sender }`
- **Correct type inference**: `Static<typeof EnumSchema>` infers unwrapped union (e.g., `string | number`)

### Negative

- **Users must handle discrimination**: No automatic `"variantName" in message` check
- **Ambiguous schemas fail**: If two variants have identical shapes, encode fails (can't infer which variant)
- **Runtime validation overhead**: `Value.Check` called for each variant until match found

### Neutral

- **Breaking change**: Users of the old API must update their code
- **Different tradeoff**: Library convenience vs user control - we chose user control

## Alternatives Considered

### Keep Wrapped Output (Rejected)

Continue returning `{ text: { content, sender } }` from decode:

- Pros: Automatic discrimination via `"text" in message`
- Cons: Extra nesting, couples user code to library format, users must always unwrap
- Decision: Rejected. The wrapping is library convenience that users pay for even when they don't need it.

### Wrapped with Option (Rejected)

Provide `decodeUnwrapped()` method or `createCodec(schema, { unwrapEnums: true })`:

- Pros: Backward compatible, user choice
- Cons: Two APIs to maintain, confusing which to use, code that uses both is inconsistent
- Decision: Rejected. Pick one approach and commit to it.

### Require Explicit Variant on Encode (Rejected)

Keep requiring `{ variant: "text", value: {...} }` for encoding:

- Pros: Unambiguous, no inference needed
- Cons: Verbose, user must repeat information already implicit in the data shape
- Decision: Rejected. The value's shape already identifies the variant.

## Implementation Notes

1. **Encoding** (`convert.ts`, `_toRelishValue` REnum case):
   - Iterate through `enumSchema.variants`
   - Use `Value.Check(variantSchema, value)` to find matching variant
   - If match found: encode with that variant's ID
   - If no match: return `EncodeError.unknownVariant` with helpful message listing variant names

2. **Decoding** (`convert.ts`, `_decodeValueToTyped` REnum case):
   - Find variant by ID (unchanged)
   - Return `valueResult.value` directly (not `{ [variantName]: valueResult.value }`)

3. **Streaming** (`@grounds/stream` `schema-streams.ts`):
   - Same change to `_decodeValueToTyped` - return unwrapped value

4. **Tests**:
   - Update all enum decode assertions from `{ variantName: value }` to just `value`

## Validation

After implementation:
- `codec.encode({ content, sender })` infers text variant automatically
- `codec.decode(bytes)` returns `{ content, sender }` directly
- Users add discriminator fields to struct variants for type narrowing
- All 302 tests pass
- Example demonstrates user-defined discrimination pattern
