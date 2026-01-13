# @grounds/stream

## 1.0.0

### Major Changes

- 3f301e7: Initial stable release (1.0.0)

  This marks the first stable release of the Grounds library, a TypeScript implementation of the Relish binary serialization format.

  **@grounds/core**
  - Type-safe value constructors with branded types
  - Binary encoding and decoding for all Relish types
  - Defense-in-depth validation for integer values

  **@grounds/schema**
  - TypeBox-based schema definitions
  - Type-safe codec for schema-driven serialization
  - Struct and enum support with field/variant IDs

  **@grounds/stream**
  - Async generator streaming for encode/decode
  - Web Streams API integration
  - Schema-aware streaming with type conversion

### Patch Changes

- add branded types and encoder validation for input safety (#27)

  ## Summary
  - **Branded types**: All `RelishValue` types now include a
    `RELISH_BRAND` symbol that prevents direct object literal construction -
    values must be created through constructor functions (`U8()`,
    `String_()`, etc.)
  - **Encoder validation**: Defense-in-depth validation catches invalid
    integer values at encoding time, returning `EncodeError` for
    out-of-range or non-integer values
  - **Consolidated validation**: Extracted shared integer bounds and
    validation functions to `integer-bounds.ts`, eliminating duplication
    between `values.ts` and `encoder.ts`

  ## Test plan
  - [x] All 382 existing tests pass
  - [x] 26 new encoder validation tests verify defense-in-depth catches
        invalid values
  - [x] TypeScript compilation succeeds with no errors
  - [x] Pre-push hook runs full test suite

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-authored-by: Claude Opus 4.5 <noreply@anthropic.com>

- Updated dependencies
- Updated dependencies
- Updated dependencies [3f301e7]
  - @grounds/core@1.0.0
  - @grounds/schema@1.0.0
