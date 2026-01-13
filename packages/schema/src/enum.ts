// pattern: Functional Core

/**
 * Enum schema support with variant tagging for Relish serialization.
 *
 * Provides helpers to create enums (discriminated unions) with variant IDs
 * that control wire format and enable automatic variant inference during encoding.
 *
 * @module
 */

import { Type, type TSchema, type Static } from "@sinclair/typebox";
import { TypeCode } from "@grounds/core";
import { RelishKind, RelishTypeCode } from "./symbols.js";
import type { TRelishSchema } from "./types.js";

/**
 * A variant in an enum schema, tagged with a variant ID for Relish serialization.
 */
export type TEnumVariant<T extends TSchema = TSchema> = T & {
  variantId: number;
};

/**
 * Tags a schema with a variant ID for enum serialization.
 *
 * Variant IDs must be unique within an enum and in range 0-127 (bit 7 clear).
 *
 * @param variantId - Variant identifier (0-127)
 * @param schema - TypeBox or Relish schema for this variant's value
 * @returns Tagged variant schema
 * @group Schema Constructors: Enums
 *
 * @example
 * ```typescript
 * import { variant, RNull, RString, RU32 } from '@grounds/schema';
 *
 * const noneVariant = variant(0, RNull());
 * const textVariant = variant(1, RString());
 * const countVariant = variant(2, RU32());
 * ```
 *
 * @see {@link REnum} for combining variants into an enum schema
 */
export function variant<T extends TSchema>(variantId: number, schema: T): TEnumVariant<T> {
  return {
    ...schema,
    variantId,
  } as TEnumVariant<T>;
}

/**
 * Schema type for a Relish enum (discriminated union).
 * The inferred type is a union of the variant inner types (unwrapped).
 */
export type TREnum<T extends Record<string, TEnumVariant> = Record<string, TEnumVariant>> =
  TRelishSchema<Static<T[keyof T]>> & {
    [RelishKind]: "REnum";
    variants: T;
  };

/**
 * Creates an enum schema from tagged variant definitions.
 *
 * Enums represent sum types (tagged unions) with multiple possible variants.
 * Encoding infers the variant automatically via schema matching; decoding
 * returns the unwrapped value directly.
 *
 * @param variants - Object mapping variant names to variant() schemas
 * @returns TypeBox schema for enum type (union of all variants)
 * @group Schema Constructors: Enums
 *
 * @example
 * Simple enum:
 * ```typescript
 * import { REnum, variant, RNull, RString } from '@grounds/schema';
 * import { createCodec, type Static } from '@grounds/schema';
 *
 * const StatusSchema = REnum({
 *   idle: variant(0, RNull()),
 *   loading: variant(1, RNull()),
 *   success: variant(2, RString()),
 *   error: variant(3, RString())
 * });
 *
 * type Status = Static<typeof StatusSchema>;
 * // "idle" | "loading" | { success: string } | { error: string }
 *
 * const codec = createCodec(StatusSchema);
 * codec.encode({ success: 'Data loaded' });
 * codec.encode({ error: 'Network failed' });
 * ```
 *
 * @example
 * Discriminated enum with structs:
 * ```typescript
 * import { REnum, RStruct, variant, field, RString, RU32 } from '@grounds/schema';
 *
 * const MessageSchema = REnum({
 *   text: variant(0, RStruct({
 *     content: field(0, RString())
 *   })),
 *   reaction: variant(1, RStruct({
 *     emoji: field(0, RString())
 *   }))
 * });
 *
 * type Message = Static<typeof MessageSchema>;
 * // { text: { content: string } } | { reaction: { emoji: string } }
 * ```
 *
 * @remarks
 * **Encoding:** Variant is inferred automatically by checking each variant schema
 * against the input value using TypeBox's Value.Check. The first matching variant
 * is encoded. Encoding fails if value matches zero or multiple variants.
 *
 * **Decoding:** Returns the unwrapped value directly (not `{ variant, value }`).
 * Users handle variant discrimination via discriminator fields they define in
 * struct variants or via TypeScript type guards.
 *
 * This API differs from typical enum implementations by removing the variant
 * wrapper, simplifying consumption. See ADR 0002 for full rationale.
 *
 * @see {@link variant} for creating individual variant schemas
 * @see {@link https://github.com/grounds/docs/adrs/0002-unwrapped-enum-encode-decode.md | ADR 0002}
 */
export function REnum<T extends Record<string, TEnumVariant>>(variants: T): TREnum<T> {
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
