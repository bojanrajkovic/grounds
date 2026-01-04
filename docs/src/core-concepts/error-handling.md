# Error Handling

Grounds uses [neverthrow](https://github.com/supermacro/neverthrow) for type-safe error handling.

## Handling Errors with .match()

The `.match()` method provides exhaustive handling of success and error cases:

```typescript
{{#include ../../../examples/core/encode-error.ts}}
```

## Error Types

### EncodeError

Thrown when encoding fails:

- `code` - Error code string (e.g., "OVERFLOW", "INVALID_TYPE")
- `message` - Human-readable error description

### DecodeError

Thrown when decoding fails:

- `code` - Error code string (e.g., "UNEXPECTED_EOF", "INVALID_TYPE_CODE")
- `message` - Human-readable error description

## Adding Context with .mapErr()

Use `.mapErr()` to add context to errors without changing the error type:

```typescript
encode(value)
  .mapErr((err) => ({
    ...err,
    context: "Failed while encoding user profile",
  }))
  .match(
    (bytes) => { /* success */ },
    (err) => console.error(err.context, "-", err.message),
  );
```

## Chaining with .andThen()

When chaining operations, errors propagate automatically:

```typescript
encode(value)
  .andThen((bytes) => decode(bytes))  // skipped if encode fails
  .match(
    (decoded) => console.log("Success:", decoded),
    (err) => console.error("Failed:", err.message),
  );
```

## Next Steps

Ready for type-safe schemas? Continue to [Schema Structs](../schema/structs.md).
