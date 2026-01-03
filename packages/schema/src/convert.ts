// pattern: Functional Core
// Conversion between JavaScript values and RelishValue

import { Result, ok, err } from "neverthrow";
import {
  type RelishValue,
  type TypeCode as TypeCodeType,
  isPrimitiveTypeCode,
  Null,
  Bool,
  U8,
  U16,
  U32,
  U64,
  U128,
  I8,
  I16,
  I32,
  I64,
  I128,
  F32,
  F64,
  String_,
  Timestamp,
  Array_,
  Map_,
  Struct,
  Enum,
  EncodeError,
  DecodeError,
  Decoder,
  encode,
} from "@grounds/core";
import { DateTime } from "luxon";
import { RelishKind, RelishTypeCode, RelishElementType, RelishKeyType, RelishValueType } from "./symbols.js";
import type { TRelishSchema, TRArray, TRMap, TROptional } from "./types.js";
import type { TRStruct, TStructField } from "./struct.js";
import type { TREnum, TEnumVariant } from "./enum.js";

/**
 * Extracts the raw value from a RelishValue based on its type code.
 *
 * - Null (0x00): returns null
 * - Primitives (0x01-0x0e, 0x13): extracts the `.value` property
 * - Composites (0x0f-0x12): returns the full RelishValue
 *
 * This is needed because Array_ and Map_ constructors expect raw JS values
 * for primitive elements/keys/values, but full RelishValue for composites.
 *
 * @param relishValue - The converted RelishValue
 * @param typeCode - The type code of the value
 * @returns The raw value suitable for Array_/Map_ constructors
 */
function extractRawValue(
  relishValue: RelishValue,
  typeCode: number,
): string | number | bigint | boolean | RelishValue | null {
  if (typeCode === 0x00) {
    // Null type: raw value is null literal
    return null;
  } else if (isPrimitiveTypeCode(typeCode)) {
    // Primitive type: extract the value property
    // Type assertion needed: TypeScript cannot narrow RelishValue discriminated union
    // based on numeric type code comparison at compile time
    return (relishValue as { value: unknown }).value as string | number | bigint | boolean;
  } else {
    // Composite type: pass RelishValue directly
    return relishValue;
  }
}

// =============================================================================
// Field/Variant Schema Helpers
// =============================================================================
// These helpers use runtime checks to safely access field and variant metadata
// from schemas, avoiding unsafe type assertions where possible.

/**
 * Extract field ID from a struct field schema.
 * Uses runtime check to verify property exists before accessing.
 */
function getFieldId(fieldSchema: TStructField): number {
  if ("fieldId" in fieldSchema && typeof fieldSchema.fieldId === "number") {
    return fieldSchema.fieldId;
  }
  throw new Error("fieldSchema missing fieldId - was field() helper used?");
}

/**
 * Type guard: Check if a field schema is optional.
 * Narrows the type to TROptional for safe .inner access.
 */
function isOptionalField(fieldSchema: TStructField): fieldSchema is TStructField & TROptional<TRelishSchema> {
  return RelishKind in fieldSchema && fieldSchema[RelishKind] === "ROptional";
}

/**
 * Get the inner schema from a field, unwrapping ROptional if present.
 * Uses isOptionalField type guard for safe narrowing.
 */
function getInnerSchema(fieldSchema: TStructField): TRelishSchema {
  if (isOptionalField(fieldSchema)) {
    return fieldSchema.inner;
  }
  return fieldSchema as unknown as TRelishSchema;
}

/**
 * Extract variant ID from an enum variant schema.
 * Uses runtime check to verify property exists before accessing.
 */
function getVariantId(variantSchema: TEnumVariant): number {
  if ("variantId" in variantSchema && typeof variantSchema.variantId === "number") {
    return variantSchema.variantId;
  }
  throw new Error("variantSchema missing variantId - was variant() helper used?");
}

/**
 * Internal helper: Convert JavaScript value to RelishValue.
 *
 * WARNING: This is an internal helper. Do not export or use in public APIs.
 * Use the public toRelish function instead, which returns encoded bytes.
 *
 * This helper is used by:
 * - toRelish: Converts to RelishValue, then encodes to bytes
 * - Possibly other internal operations
 *
 * @param value - JavaScript value to convert
 * @param schema - The Relish schema
 * @returns RelishValue suitable for encoding
 */
function _toRelishValue(value: unknown, schema: TRelishSchema): Result<RelishValue, EncodeError> {
  const kind = schema[RelishKind];

  switch (kind) {
    case "RNull":
      return ok(Null);

    case "RBool":
      return ok(Bool(value as boolean));

    case "RU8":
      return ok(U8(value as number));

    case "RU16":
      return ok(U16(value as number));

    case "RU32":
      return ok(U32(value as number));

    case "RU64":
      return ok(U64(value as bigint));

    case "RU128":
      return ok(U128(value as bigint));

    case "RI8":
      return ok(I8(value as number));

    case "RI16":
      return ok(I16(value as number));

    case "RI32":
      return ok(I32(value as number));

    case "RI64":
      return ok(I64(value as bigint));

    case "RI128":
      return ok(I128(value as bigint));

    case "RF32":
      return ok(F32(value as number));

    case "RF64":
      return ok(F64(value as number));

    case "RString":
      return ok(String_(value as string));

    case "RTimestamp": {
      const dt = value as DateTime;
      return ok(Timestamp(BigInt(dt.toUnixInteger())));
    }

    case "RArray": {
      const arraySchema = schema as TRArray<TRelishSchema>;
      const elementSchema = arraySchema[RelishElementType];
      const jsArray = value as Array<unknown>;
      const elementTypeCode = elementSchema[RelishTypeCode];
      const elements: Array<string | number | bigint | boolean | RelishValue | null> = [];

      for (const item of jsArray) {
        const elementResult = _toRelishValue(item, elementSchema);
        if (elementResult.isErr()) {
          return err(elementResult.error);
        }
        elements.push(extractRawValue(elementResult.value, elementTypeCode));
      }

      return ok(Array_(elementTypeCode, elements));
    }

    case "RMap": {
      const mapSchema = schema as TRMap<TRelishSchema, TRelishSchema>;
      const keySchema = mapSchema[RelishKeyType];
      const valueSchema = mapSchema[RelishValueType];
      const jsMap = value as Map<unknown, unknown>;
      // Type assertions needed: RelishTypeCode symbol property returns TypeCode at runtime,
      // but TypeScript cannot infer the specific TypeCode value from the symbol lookup
      const keyTypeCode = keySchema[RelishTypeCode] as TypeCodeType;
      const valueTypeCode = valueSchema[RelishTypeCode] as TypeCodeType;
      // Map entries hold values matching the runtime type codes.
      // Using Map<unknown, unknown> since TypeScript cannot express that the types
      // depend on the runtime type code values.
      const entries = new Map<unknown, unknown>();

      for (const [k, v] of jsMap) {
        const keyResult = _toRelishValue(k, keySchema);
        if (keyResult.isErr()) {
          return err(keyResult.error);
        }
        const valueResult = _toRelishValue(v, valueSchema);
        if (valueResult.isErr()) {
          return err(valueResult.error);
        }

        entries.set(
          extractRawValue(keyResult.value, keyTypeCode),
          extractRawValue(valueResult.value, valueTypeCode),
        );
      }

      // Type assertion to any needed: Map_ is generic over TypeCode with MapInput<K,V> entries,
      // but we have runtime type codes and dynamically typed entries. TypeScript's static
      // type system cannot express "entries types depend on runtime type code values".
      // Runtime validation in Map_ will catch any type mismatches.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ok(Map_(keyTypeCode, valueTypeCode, entries as any) as RelishValue);
    }

    case "RStruct": {
      const structSchema = schema as TRStruct<Record<string, TStructField>>;
      const jsObj = value as Record<string, unknown>;
      const fields = new Map<number, RelishValue>();

      // Collect field entries with their IDs for sorting
      const fieldEntries: Array<{ name: string; fieldId: number; fieldSchema: TStructField; innerSchema: TRelishSchema }> = [];
      for (const [name, fieldSchema] of Object.entries(structSchema.fields)) {
        fieldEntries.push({
          name,
          fieldId: getFieldId(fieldSchema),
          fieldSchema,
          innerSchema: getInnerSchema(fieldSchema),
        });
      }

      // Sort by field ID (ascending)
      fieldEntries.sort((a, b) => a.fieldId - b.fieldId);

      for (const { name, fieldId, fieldSchema, innerSchema } of fieldEntries) {
        const fieldValue = jsObj[name];

        // Skip null values for optional fields
        if (fieldValue === null && isOptionalField(fieldSchema)) {
          continue;
        }

        const valueResult = _toRelishValue(fieldValue, innerSchema);
        if (valueResult.isErr()) {
          return err(valueResult.error);
        }
        fields.set(fieldId, valueResult.value);
      }

      return ok(Struct(fields));
    }

    case "REnum": {
      const enumSchema = schema as TREnum<Record<string, TEnumVariant>>;
      const jsEnum = value as { variant: string; value: unknown };
      const variantSchema = (enumSchema.variants as Record<string, TEnumVariant | undefined>)[jsEnum.variant];

      if (variantSchema === undefined) {
        return err(EncodeError.unknownVariant(jsEnum.variant));
      }

      const valueResult = _toRelishValue(jsEnum.value, variantSchema as unknown as TRelishSchema);
      if (valueResult.isErr()) {
        return err(valueResult.error);
      }

      return ok(Enum(getVariantId(variantSchema), valueResult.value));
    }

    default:
      return err(EncodeError.unsupportedType(kind as string));
  }
}

/**
 * Convert JavaScript value to Relish binary format.
 *
 * This makes the API symmetric with fromRelish:
 * - toRelish: JavaScript value → Relish bytes
 * - fromRelish: Relish bytes → JavaScript value
 *
 * Implementation: Converts the value to RelishValue, then encodes it to bytes.
 *
 * @param value - JavaScript value matching the schema
 * @param schema - The Relish schema
 * @returns Encoded binary data suitable for transmission or storage
 */
export function toRelish(value: unknown, schema: TRelishSchema): Result<Uint8Array, EncodeError> {
  return _toRelishValue(value, schema).andThen(relishValue => encode(relishValue));
}

/**
 * Convert bytes to schema-aware typed values.
 *
 * This function makes the API symmetric with toRelish:
 * - toRelish: JavaScript value → Relish bytes
 * - fromRelish: Relish bytes → JavaScript value
 *
 * Implementation: Decodes bytes using the core Decoder, then converts
 * the raw DecodedValue to schema-aware types using internal conversion logic.
 *
 * WARNING: Conversion logic is duplicated in @grounds/stream for byte tracking.
 * If you change the conversion algorithm here, update _decodeValueToTyped in
 * schema-streams.ts with the same changes. This duplication is intentional
 * to keep packages self-contained (see ADR 0001).
 *
 * @param bytes - Raw Relish binary data
 * @param schema - The Relish schema
 * @returns Schema-aware typed value
 */
export function fromRelish<T>(bytes: Uint8Array, schema: TRelishSchema): Result<T, DecodeError> {
  // Decode raw bytes to get the core DecodedValue
  const decoder = new Decoder(bytes);
  const decodeResult = decoder.decodeValue();
  if (decodeResult.isErr()) {
    return err(decodeResult.error);
  }

  // Convert raw DecodedValue to schema-aware typed value
  return _decodeValueToTyped(decodeResult.value, schema);
}

/**
 * Internal helper: Convert decoded values (from core decoder) to schema-aware typed values.
 *
 * This is the conversion algorithm used by both:
 * - fromRelish in this package (takes bytes and decodes them)
 * - schema-streams.ts in @grounds/stream (has byte tracking via Decoder)
 *
 * The decoder returns raw JavaScript types (number, bigint, string, etc.).
 * This function transforms them to schema-aware types:
 * - Struct field IDs → property names
 * - Enum variant IDs → variant names
 * - Primitives → passed through (decoder already returns raw JS)
 * - Missing optional struct fields → null
 *
 * WARNING: This function must keep the same conversion logic as
 * _decodeValueToTyped in schema-streams.ts. Keep them in sync.
 *
 * @param value - Decoded value from core decoder
 * @param schema - The Relish schema
 * @returns Schema-aware typed value
 */
function _decodeValueToTyped<T>(value: unknown, schema: TRelishSchema): Result<T, DecodeError> {
  const kind = schema[RelishKind];

  switch (kind) {
    case "RNull":
      return ok(null as T);

    case "RBool":
    case "RU8":
    case "RU16":
    case "RU32":
    case "RU64":
    case "RU128":
    case "RI8":
    case "RI16":
    case "RI32":
    case "RI64":
    case "RI128":
    case "RF32":
    case "RF64":
    case "RString":
      // Decoder already returns raw primitives - pass through
      return ok(value as T);

    case "RTimestamp":
      // Decoder already returns Luxon DateTime - pass through
      return ok(value as T);

    case "RArray": {
      const arraySchema = schema as TRArray<TRelishSchema>;
      const elementSchema = arraySchema[RelishElementType];
      const decodedArr = value as ReadonlyArray<unknown>;
      const jsArray: Array<unknown> = [];

      for (const elem of decodedArr) {
        const elemResult = _decodeValueToTyped(elem, elementSchema);
        if (elemResult.isErr()) {
          return err(elemResult.error);
        }
        jsArray.push(elemResult.value);
      }

      return ok(jsArray as T);
    }

    case "RMap": {
      const mapSchema = schema as TRMap<TRelishSchema, TRelishSchema>;
      const valueSchema = mapSchema[RelishValueType];
      const decodedMap = value as ReadonlyMap<unknown, unknown>;
      const jsMap = new Map<unknown, unknown>();

      for (const [k, v] of decodedMap) {
        const valueResult = _decodeValueToTyped(v, valueSchema);
        if (valueResult.isErr()) {
          return err(valueResult.error);
        }
        jsMap.set(k, valueResult.value);
      }

      return ok(jsMap as T);
    }

    case "RStruct": {
      const structSchema = schema as TRStruct<Record<string, TStructField>>;
      const decodedStruct = value as Readonly<{ [fieldId: number]: unknown }>;
      const jsObj: Record<string, unknown> = {};

      for (const [name, fieldSchema] of Object.entries(structSchema.fields)) {
        const fieldId = getFieldId(fieldSchema);
        const fieldValue = decodedStruct[fieldId];

        if (fieldValue === undefined) {
          // Missing field - set to null for optional, error for required
          if (isOptionalField(fieldSchema)) {
            jsObj[name] = null;
          } else {
            return err(DecodeError.missingRequiredField(fieldId));
          }
        } else {
          const valueResult = _decodeValueToTyped(fieldValue, getInnerSchema(fieldSchema));
          if (valueResult.isErr()) {
            return err(valueResult.error);
          }
          jsObj[name] = valueResult.value;
        }
      }

      return ok(jsObj as T);
    }

    case "REnum": {
      const enumSchema = schema as TREnum<Record<string, TEnumVariant>>;
      const decodedEnum = value as Readonly<{ variantId: number; value: unknown }>;
      const variantId = decodedEnum.variantId;

      // Find variant by ID and convert to named variant
      for (const [variantName, variantSchema] of Object.entries(enumSchema.variants)) {
        if (getVariantId(variantSchema) === variantId) {
          const valueResult = _decodeValueToTyped(decodedEnum.value, variantSchema as unknown as TRelishSchema);
          if (valueResult.isErr()) {
            return err(valueResult.error);
          }
          return ok({ variant: variantName, value: valueResult.value } as T);
        }
      }

      return err(DecodeError.unknownVariantId(variantId));
    }

    case "ROptional": {
      const optionalSchema = schema as TROptional<TRelishSchema>;
      if (value === null) {
        return ok(null as T);
      }
      return _decodeValueToTyped(value, optionalSchema.inner);
    }

    default:
      return err(DecodeError.unsupportedType(kind as string));
  }
}
