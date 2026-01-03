# ADR 0001: Symmetric fromRelish with Intentional Streaming Duplication

**Status:** Accepted

**Date:** 2026-01-03

## Context

Previously, the conversion functions were asymmetric:

**Old encoding flow:**
```typescript
value → toRelish → RelishValue → encode → bytes
// toRelish returned intermediate RelishValue form, not final bytes
```

**Old decoding flow:**
```typescript
bytes → Decoder → DecodedValue → fromRelish → value
// fromRelish took decoded values, not raw bytes
```

This created API friction:
- Encoding: `value` → `toRelish` → RelishValue (intermediate!) → codec wraps it
- Decoding: bytes → decode → `fromRelish` → value (two operations, hidden intermediate)
- Not symmetric: encode path has intermediate RelishValue, decode path hides the decoder

The streaming layer (`@grounds/stream`) needs to:
1. Accumulate incomplete chunks without throwing
2. Decode exactly one message at a time (with byte tracking)
3. Convert raw decoded values to schema-aware types

The requirement to track consumed bytes during streaming means the streaming layer must:
- Use the core `Decoder` directly to know how many bytes were consumed
- Call `fromRelish` on the decoded result

This creates a tension: making `fromRelish` take raw bytes (for symmetric API) would duplicate the conversion logic between the schema and streaming packages.

## Decision

Achieve true API symmetry by changing BOTH functions:

**New encoding:**
```typescript
toRelish(value: unknown, schema): Result<Uint8Array, EncodeError>
// Returns bytes directly (no intermediate RelishValue)
```

**New decoding:**
```typescript
fromRelish(bytes: Uint8Array, schema): Result<T, DecodeError>
// Takes bytes directly (no need for pre-decoded DecodedValue)
```

Accept intentional duplication of conversion logic in `@grounds/stream`:
- `@grounds/schema` provides internal `_toRelishValue` and `_decodeValueToTyped` helpers
- `@grounds/stream` duplicates this logic in `schema-streams.ts` for byte tracking
- Both use identical conversion algorithms

This gives us:
- **True symmetric API**: `toRelish(value) → bytes` ↔ `fromRelish(bytes) → value`
- **Self-contained streaming**: No internal imports coupling packages
- **Clean public API**: Users never see RelishValue or DecodedValue intermediates
- **Simplified codec**: `encode` just calls `toRelish` directly (no more `.andThen`)
- **Intentional, documented duplication**: Not a hidden implementation detail

## Consequences

### Positive
- **Codec is now trivial**: `encode(value) = toRelish(value)` and `decode(bytes) = fromRelish(bytes)` (both one-liners!)
- **API is truly symmetric**: `toRelish(value) → bytes` ↔ `fromRelish(bytes) → value` - matching operations
- **Users never see intermediates**: No `RelishValue` or `DecodedValue` in public API
- **Streaming layer is self-contained**: Can evolve independently, no cross-package imports
- **Implementation details stay internal**: Users work with values and bytes only
- **Minimal public API**: Simple mental model - encode value to bytes, decode bytes to value

### Negative
- Conversion logic appears in two places (schema and stream packages)
- If the conversion algorithm changes, both internal `_decodeValueToTyped` copies must be updated
- Slightly higher maintenance burden (but documented and intentional)
- RelishValue construction now hidden as internal implementation detail

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
- `toRelish(value, schema)` returns `Result<Uint8Array, EncodeError>` - takes values, returns bytes
- `fromRelish(bytes, schema)` returns `Result<T, DecodeError>` - takes bytes, returns values
- **Truly symmetric signatures**: One takes value→bytes, other takes bytes→value
- All tests pass (301+ tests)
- Tests verify round-tripping: `toRelish → fromRelish` produces original value
- Codec simplified: `encode(v)` = `toRelish(v)` directly (one line!)
- Stream tests verify streaming conversion works correctly
- No intermediate types exposed in public API (RelishValue and DecodedValue stay internal)
