// pattern: Functional Core
// TypeBox-based enum support with variant tagging

import { Type, type TSchema, type Static } from "@sinclair/typebox";
import { TypeCode } from "@grounds/core";
import { RelishKind, RelishTypeCode } from "./symbols.js";
import type { TRelishSchema } from "./types.js";

/**
 * A variant in an enum schema, tagged with a variant ID for Relish serialization
 */
export type TEnumVariant<T extends TSchema = TSchema> = T & {
  variantId: number;
};

/**
 * Helper to create an enum variant with a specific ID
 */
export function variant<T extends TSchema>(
  variantId: number,
  schema: T,
): TEnumVariant<T> {
  return {
    ...schema,
    variantId,
  } as TEnumVariant<T>;
}

/**
 * Schema type for a Relish enum (discriminated union)
 * The inferred type is a union of the variant inner types (unwrapped)
 */
export type TREnum<
  T extends Record<string, TEnumVariant> = Record<string, TEnumVariant>,
> = TRelishSchema<Static<T[keyof T]>> & {
  [RelishKind]: "REnum";
  variants: T;
};

/**
 * Create an enum schema from variant definitions
 */
export function REnum<T extends Record<string, TEnumVariant>>(
  variants: T,
): TREnum<T> {
  // Build a union of the variant inner schemas (unwrapped)
  const innerSchemas: Array<TSchema> = [];
  for (const variantSchema of Object.values(variants)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { variantId: _variantId, ...innerSchema } = variantSchema as TEnumVariant;
    innerSchemas.push(innerSchema as TSchema);
  }

  // Use TypeBox Union of the inner schemas directly
  return {
    ...Type.Union(innerSchemas),
    [RelishKind]: "REnum",
    [RelishTypeCode]: TypeCode.Enum,
    variants,
  } as unknown as TREnum<T>;
}
