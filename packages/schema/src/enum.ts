// pattern: Functional Core
// TypeBox-based enum support with variant tagging

import { Type, type TSchema } from "@sinclair/typebox";
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
 */
export type TREnum<
  _T extends Record<string, TEnumVariant> = Record<string, TEnumVariant>,
> = TRelishSchema & { [RelishKind]: "REnum" };

/**
 * Create an enum schema from variant definitions
 */
export function REnum<T extends Record<string, TEnumVariant>>(
  variants: T,
): TREnum<T> {
  // Build a discriminated union schema from variant definitions
  const properties: Record<string, TSchema> = {};
  for (const [key, variantSchema] of Object.entries(variants)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { variantId: _variantId, ...innerSchema } = variantSchema as TEnumVariant;
    properties[key] = innerSchema as TSchema;
  }

  // Use TypeBox Union to create discriminated union
  const unionSchemas = Object.entries(properties).map(([key, schema]) =>
    Type.Object({
      [key]: schema,
    }),
  );

  return {
    ...Type.Union(unionSchemas),
    [RelishKind]: "REnum",
    [RelishTypeCode]: TypeCode.Enum,
  } as unknown as TREnum<T>;
}
