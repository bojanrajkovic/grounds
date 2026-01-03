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

export function jsToRelish(value: unknown, schema: TRelishSchema): Result<RelishValue, EncodeError> {
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
        const elementResult = jsToRelish(item, elementSchema);
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
        const keyResult = jsToRelish(k, keySchema);
        if (keyResult.isErr()) {
          return err(keyResult.error);
        }
        const valueResult = jsToRelish(v, valueSchema);
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
      const fieldEntries: Array<{ name: string; fieldId: number; schema: TRelishSchema }> = [];
      for (const [name, fieldSchema] of Object.entries(structSchema.fields)) {
        // Type assertion needed: TStructField has fieldId property added by the field() helper,
        // but TypeScript's Record<string, TStructField> doesn't preserve this augmentation
        const fieldId = (fieldSchema as { fieldId: number }).fieldId;
        let actualSchema = fieldSchema as unknown as TRelishSchema;

        // Type assertion needed: checking RelishKind symbol property requires accessing
        // the schema as a dynamic object since TStructField doesn't directly expose the symbol
        if ((fieldSchema as { [RelishKind]?: string })[RelishKind] === "ROptional") {
          actualSchema = (fieldSchema as unknown as TROptional<TRelishSchema>).inner;
        }

        fieldEntries.push({
          name,
          fieldId,
          schema: actualSchema,
        });
      }

      // Sort by field ID (ascending)
      fieldEntries.sort((a, b) => a.fieldId - b.fieldId);

      for (const { name, fieldId, schema: fieldSchema } of fieldEntries) {
        const fieldValue = jsObj[name];
        const fieldSchemaObj = structSchema.fields[name];
        // Type assertion needed: same reason as above - RelishKind symbol access
        const isOptional = (fieldSchemaObj as { [RelishKind]?: string })[RelishKind] === "ROptional";

        // Skip null values for optional fields
        if (fieldValue === null && isOptional) {
          continue;
        }

        const valueResult = jsToRelish(fieldValue, fieldSchema);
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
      // Type assertion needed: variants is typed as Record<string, TEnumVariant>,
      // but we need to access it dynamically by the variant name from runtime value
      const variantSchema = (enumSchema.variants as Record<string, TEnumVariant | undefined>)[jsEnum.variant];

      if (variantSchema === undefined) {
        return err(new EncodeError(`unknown enum variant: ${jsEnum.variant}`));
      }

      // Type assertion needed: TEnumVariant has variantId property added by variant() helper,
      // but TypeScript's type doesn't preserve this augmentation through the dynamic access
      const variantId = (variantSchema as { variantId: number }).variantId;
      // Type assertion through unknown needed: TEnumVariant extends TSchema but TypeScript
      // doesn't see it as compatible with TRelishSchema which has symbol properties
      const valueResult = jsToRelish(jsEnum.value, variantSchema as unknown as TRelishSchema);
      if (valueResult.isErr()) {
        return err(valueResult.error);
      }

      return ok(Enum(variantId, valueResult.value));
    }

    default:
      return err(new EncodeError(`unsupported schema type: ${kind as string}`));
  }
}

/**
 * Convert decoded values (from core decoder) to schema-aware typed values.
 *
 * The decoder returns raw JavaScript types (number, bigint, string, etc.).
 * This function transforms them to schema-aware types:
 * - Struct field IDs → property names
 * - Enum variant IDs → variant names
 * - Primitives → passed through (decoder already returns raw JS)
 * - Missing optional struct fields → null
 *
 * @param value - Decoded value from core decoder
 * @param schema - The Relish schema
 * @returns Schema-aware typed value
 */
export function decodedToTyped<T>(value: unknown, schema: TRelishSchema): Result<T, DecodeError> {
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
        const elemResult = decodedToTyped(elem, elementSchema);
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
        const valueResult = decodedToTyped(v, valueSchema);
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
        const fieldId = (fieldSchema as { fieldId: number }).fieldId;
        const fieldValue = decodedStruct[fieldId];

        if (fieldValue === undefined) {
          // Missing field - set to null for optional, error for required
          const fieldKind = (fieldSchema as { [RelishKind]?: string })[RelishKind];
          if (fieldKind === "ROptional") {
            jsObj[name] = null;
          } else {
            return err(DecodeError.missingRequiredField(fieldId));
          }
        } else {
          let actualSchema = fieldSchema as unknown as TRelishSchema;
          const fieldKind = (fieldSchema as { [RelishKind]?: string })[RelishKind];
          if (fieldKind === "ROptional") {
            actualSchema = (fieldSchema as unknown as TROptional<TRelishSchema>).inner;
          }
          const valueResult = decodedToTyped(fieldValue, actualSchema);
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
      const enumValue = decodedEnum.value;

      // Find variant by ID and convert to named variant
      for (const [variantName, variantSchema] of Object.entries(enumSchema.variants)) {
        const vid = (variantSchema as { variantId: number }).variantId;
        if (vid === variantId) {
          const valueResult = decodedToTyped(enumValue, variantSchema as unknown as TRelishSchema);
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
      return decodedToTyped(value, optionalSchema.inner);
    }

    default:
      return err(DecodeError.unsupportedType(kind as string));
  }
}
