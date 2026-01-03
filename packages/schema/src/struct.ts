// pattern: Functional Core
// TypeBox-based struct support with field tagging

import { Type, type TSchema } from "@sinclair/typebox";
import { TypeCode } from "@grounds/core";
import { RelishKind, RelishTypeCode } from "./symbols.js";
import type { TRelishSchema } from "./types.js";

/**
 * A field in a struct schema, tagged with a field ID for Relish serialization
 */
export type TStructField<T extends TSchema = TSchema> = T & {
  fieldId: number;
};

/**
 * Helper to create a struct field with a specific ID
 */
export function field<T extends TSchema>(
  fieldId: number,
  schema: T,
): TStructField<T> {
  return {
    ...schema,
    fieldId,
  } as TStructField<T>;
}

/**
 * Schema type for a Relish struct
 */
export type TRStruct<
  T extends Record<string, TStructField> = Record<string, TStructField>,
> = TRelishSchema<{
  readonly [K in keyof T]: T[K] extends { static: infer S } ? S : unknown;
}> & { [RelishKind]: "RStruct" };

/**
 * Create a struct schema from field definitions
 */
export function RStruct<T extends Record<string, TStructField>>(
  fields: T,
): TRStruct<T> {
  // Build a TypeBox object schema from field definitions
  const properties: Record<string, TSchema> = {};
  for (const [key, fieldSchema] of Object.entries(fields)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fieldId: _fieldId, ...innerSchema } = fieldSchema as TStructField;
    properties[key] = innerSchema as TSchema;
  }

  return {
    ...Type.Object(properties),
    [RelishKind]: "RStruct",
    [RelishTypeCode]: TypeCode.Struct,
  } as TRStruct<T>;
}
