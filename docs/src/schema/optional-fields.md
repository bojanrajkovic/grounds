# Optional Fields

Handle nullable values with `ROptional`.

## Defining Optional Fields

Use `ROptional` to wrap any schema type:

```typescript validator=typescript
{{#include ../../../examples/schema/optional-fields.ts}}
```

## Null Semantics

Grounds uses `null` for absent values (not `undefined`):

```typescript
type Profile = {
  name: string;      // required
  bio: string | null; // optional
};

// Valid
const profile: Profile = { name: "Alice", bio: null };

// TypeScript error: undefined is not assignable
const profile: Profile = { name: "Alice", bio: undefined };
```

## Wire Format

Optional fields are encoded as:

- **Present**: Normal encoding of the inner value
- **Absent**: Encoded as Null type (1 byte)

## Nested Optionals

You can nest optionals for complex scenarios:

```typescript
const Schema = RStruct({
  // Optional array
  tags: field(0, ROptional(RArray(RString()))),

  // Array of optional strings
  notes: field(1, RArray(ROptional(RString()))),
});
```

## Next Steps

Continue to [Streaming](../streaming/async-generators.md) for incremental encoding.
