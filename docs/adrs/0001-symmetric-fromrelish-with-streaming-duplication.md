# ADR 0001: Symmetric fromRelish with Intentional Streaming Duplication

**Status:** Accepted

**Date:** 2026-01-03

## Context

The `toRelish` function takes JavaScript values and produces Relish binary format:
```typescript
toRelish(value: unknown, schema: TRelishSchema): Result<RelishValue, EncodeError>
```

Previously, `fromRelish` took already-decoded values from the core decoder:
```typescript
fromRelish(decoded: DecodedValue, schema: TRelishSchema): Result<T, DecodeError>
```

This asymmetry creates friction in the API:
- Encoding: `value` → `toRelish` → bytes → ready to use
- Decoding: bytes → decode → `fromRelish` → value (two-step, hidden intermediate)

The streaming layer (`@grounds/stream`) needs to:
1. Accumulate incomplete chunks without throwing
2. Decode exactly one message at a time (with byte tracking)
3. Convert raw decoded values to schema-aware types

The requirement to track consumed bytes during streaming means the streaming layer must:
- Use the core `Decoder` directly to know how many bytes were consumed
- Call `fromRelish` on the decoded result

This creates a tension: making `fromRelish` take raw bytes (for symmetric API) would duplicate the conversion logic between the schema and streaming packages.

## Decision

Make `fromRelish` take `Uint8Array` directly, achieving symmetric API:
```typescript
fromRelish(bytes: Uint8Array, schema: TRelishSchema): Result<T, DecodeError>
```

Accept intentional duplication of conversion logic in `@grounds/stream`:
- `@grounds/schema` provides `_decodeValueToTyped` (internal helper)
- `@grounds/stream` duplicates this logic in `schema-streams.ts`
- Both use the same conversion algorithm, but stream layer needs byte tracking

This gives us:
- **Symmetric API**: `toRelish(value) ↔ fromRelish(bytes)`
- **Self-contained streaming**: No internal imports coupling packages
- **Clean public API**: Users see `toRelish` and `fromRelish` as matching operations
- **Intentional, documented duplication**: Not a hidden implementation detail

## Consequences

### Positive
- Codec is now trivial: `encode(value) = toRelish(value).andThen(encode)` and `decode(bytes) = fromRelish(bytes)`
- API is symmetric and predictable: both take raw values/bytes, not intermediates
- Streaming layer is self-contained: can evolve independently
- Implementation details stay internal: `DecodedValue` type stays in core
- Minimal public API: Users don't see `DecodedValue` or internal conversion steps

### Negative
- Conversion logic appears in two places (schema and stream packages)
- If the conversion algorithm changes, both copies must be updated
- Slightly higher maintenance burden

## Alternatives Considered

### 3A: Internal Imports (Rejected)
Stream package imports conversion helpers from schema package:
```typescript
// schema-streams.ts
import { _decodeValueToTyped } from '@grounds/schema'
```
- Pros: Single copy of conversion logic
- Cons: Couples packages together, creates internal API contract, harder to evolve independently, violates package boundary principle
- Decision: Rejected. Package boundaries matter.

### 3B: Export DecodedValue and Conversion (Rejected)
Export conversion logic from schema package:
```typescript
export { DecodedValue } from '@grounds/core'
export function fromRelish(decoded: DecodedValue, schema): Result<T, DecodeError>
```
- Pros: Streaming uses the real API
- Cons: Leaks implementation details, `DecodedValue` becomes public contract, fromRelish is asymmetric to toRelish
- Decision: Rejected. Doesn't achieve the goal of symmetric API.

### 3C: Export bytesConsumed (Rejected)
Keep fromRelish symmetric but expose bytes tracking in public API:
```typescript
const result = fromRelish(bytes, schema)
// Need to add bytesConsumed to result somehow
```
- Pros: Single code path
- Cons: Leaks streaming implementation detail into public API, asymmetric return type, complicates the contract
- Decision: Rejected. Doesn't match the principle of minimal public API.

### 3D: Keep Original API (Rejected)
Don't change `fromRelish`, keep it taking `DecodedValue`:
- Pros: No duplication
- Cons: API remains asymmetric, users must manually decode then convert, streaming layer has awkward integration point
- Decision: Rejected. Solves the immediate problem but leaves the API awkward.

## Implementation Notes

1. **Schema package** (`convert.ts`):
   - Change `fromRelish(decoded: DecodedValue, schema)` → `fromRelish(bytes: Uint8Array, schema)`
   - Implementation: Create Decoder from bytes, decode, convert result
   - Warning comment about streaming duplication
   - Internal helper: `_decodeValueToTyped(decoded: DecodedValue, schema)` (not exported)

2. **Stream package** (`schema-streams.ts`):
   - Extract `_decodeValueToTyped(decoded: DecodedValue, schema)` helper
   - Use Decoder directly with byte position tracking
   - Call helper for conversion
   - Warning comment about duplication with schema package
   - Conversion logic is identical to schema package's internal helper

3. **Documentation**:
   - CLAUDE.md files in both packages reference this ADR
   - Explain the duplication is intentional and documented
   - Link to this ADR for context

## Validation

After implementation:
- `toRelish(value, schema)` returns `Result<RelishValue>`
- `fromRelish(bytes, schema)` returns `Result<T>`
- Symmetric signatures: one takes value, one takes bytes
- All tests pass (301 tests)
- Stream tests verify streaming conversion works correctly
- No new API surface for `DecodedValue` or intermediate conversion
