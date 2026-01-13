// pattern: Functional Core

/**
 * Struct schema support with field tagging for Relish serialization.
 *
 * Provides helpers to create structs with field IDs that control wire format
 * order and enable type-safe roundtrip encoding/decoding.
 *
 * @module
 */

import { Type, type TSchema } from "@sinclair/typebox";
import { TypeCode } from "@grounds/core";
import { RelishKind, RelishTypeCode } from "./symbols.js";
import type { TRelishSchema } from "./types.js";

/**
 * A field in a struct schema, tagged with a field ID for Relish serialization.
 */
export type TStructField<T extends TSchema = TSchema> = T & {
  fieldId: number;
};

/**
 * Tags a schema with a field ID for struct serialization.
 *
 * Field IDs must be unique within a struct and in range 0-127 (bit 7 clear).
 * Encoder sorts fields by ascending ID; decoder validates this order.
 *
 * @param fieldId - Field identifier (0-127)
 * @param schema - TypeBox or Relish schema for this field
 * @returns Tagged field schema
 * @group Schema Constructors: Structs
 *
 * @example
 * ```typescript
 * import { field, RString, RU8 } from '@grounds/schema';
 *
 * const nameField = field(0, RString());
 * const ageField = field(1, RU8());
 * ```
 *
 * @see {@link RStruct} for combining fields into a struct schema
 */
export function field<T extends TSchema>(fieldId: number, schema: T): TStructField<T> {
  return {
    ...schema,
    fieldId,
  } as TStructField<T>;
}

/**
 * Schema type for a Relish struct.
 */
export type TRStruct<T extends Record<string, TStructField> = Record<string, TStructField>> =
  TRelishSchema<{
    readonly [K in keyof T]: T[K] extends { static: infer S } ? S : unknown;
  }> & {
    [RelishKind]: "RStruct";
    fields: T;
  };

/**
 * Creates a struct schema from tagged field definitions.
 *
 * Structs map string property names to typed fields with numeric IDs.
 * Encoding uses field IDs (sorted); decoding reconstructs the object.
 *
 * @param fields - Object mapping property names to field() schemas
 * @returns TypeBox schema for struct type
 * @group Schema Constructors: Structs
 *
 * @example
 * Basic struct:
 * ```typescript
 * import { RStruct, field, RString, RU8 } from '@grounds/schema';
 * import { createCodec, type Static } from '@grounds/schema';
 *
 * const UserSchema = RStruct({
 *   name: field(0, RString()),
 *   age: field(1, RU8())
 * });
 *
 * type User = Static<typeof UserSchema>; // { name: string, age: number }
 *
 * const codec = createCodec(UserSchema);
 * codec.encode({ name: 'Alice', age: 25 });
 * ```
 *
 * @example
 * Nested structs:
 * ```typescript
 * import { RStruct, RArray, field, RString, RU32 } from '@grounds/schema';
 *
 * const AddressSchema = RStruct({
 *   street: field(0, RString()),
 *   city: field(1, RString())
 * });
 *
 * const PersonSchema = RStruct({
 *   name: field(0, RString()),
 *   addresses: field(1, RArray(AddressSchema))
 * });
 * ```
 *
 * @remarks
 * Field IDs determine wire format order, not property names. IDs must be
 * in range 0-127 and unique within the struct. Encoder automatically sorts
 * by field ID; decoder validates sorted order.
 *
 * TypeScript infers the correct type via Static<typeof schema>, extracting
 * property names and types from the field definitions.
 *
 * @see {@link field} for creating individual field schemas
 */
export function RStruct<T extends Record<string, TStructField>>(fields: T): TRStruct<T> {
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
    fields,
  } as TRStruct<T>;
}
