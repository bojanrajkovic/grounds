# Enums

Define tagged unions with `REnum` and `variant()`.

## Defining an Enum

Use `REnum` to define a schema with named variants:

```typescript validator=typescript
{{#include ../../../examples/schema/defining-enums.ts}}
```

## Variant IDs

Each variant has a numeric ID used in the wire format:

- Must be unique within an enum
- Determines which variant is encoded
- Allows schema evolution (add new variants)

## Variant Types

Variants can contain any schema type:

```typescript
const ResultSchema = REnum({
  success: variant(0, RStruct({
    data: field(0, RString()),
  })),
  error: variant(1, RStruct({
    code: field(0, RU32()),
    message: field(1, RString()),
  })),
});
```

## Discrimination

After decoding, use type guards or discriminator fields to narrow the type:

```typescript
function isTextMessage(msg: unknown): msg is TextMessage {
  return typeof msg === "object" && msg !== null && "content" in msg;
}
```

## Next Steps

Learn about [Codecs](./codecs.md) for encoding and decoding.
