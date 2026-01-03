// pattern: Functional Core
// Conversion between JavaScript values and RelishValue

import { Result, ok, err } from "neverthrow";
import {
  type RelishValue,
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
} from "@grounds/core";
import { DateTime } from "luxon";
import { RelishKind, RelishTypeCode, RelishElementType, RelishKeyType, RelishValueType } from "./symbols.js";
import type { TRelishSchema, TRArray, TRMap, TROptional } from "./types.js";
import type { TRStruct, TStructField } from "./struct.js";
import type { TREnum, TEnumVariant } from "./enum.js";

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
        const relishValue = elementResult.value;

        // Extract raw value for primitives, keep RelishValue for composites
        if (elementTypeCode === 0x00) {
          // Null: raw value is null
          elements.push(null);
        } else if (elementTypeCode < 0x0f) {
          // Primitive: extract the value property
          const extractedValue = (relishValue as { value: unknown }).value as string | number | bigint | boolean;
          elements.push(extractedValue);
        } else {
          // Composite: pass RelishValue directly
          elements.push(relishValue as RelishValue);
        }
      }

      return ok(Array_(elementTypeCode, elements));
    }

    case "RMap": {
      const mapSchema = schema as TRMap<TRelishSchema, TRelishSchema>;
      const keySchema = mapSchema[RelishKeyType];
      const valueSchema = mapSchema[RelishValueType];
      const jsMap = value as Map<unknown, unknown>;
      const keyTypeCode = keySchema[RelishTypeCode] as any;
      const valueTypeCode = valueSchema[RelishTypeCode] as any;
      const entries = new Map<any, any>();

      for (const [k, v] of jsMap) {
        const keyResult = jsToRelish(k, keySchema);
        if (keyResult.isErr()) {
          return err(keyResult.error);
        }
        const valueResult = jsToRelish(v, valueSchema);
        if (valueResult.isErr()) {
          return err(valueResult.error);
        }

        // Extract raw values for primitives
        let mapKey: any = k;
        let mapValue: any = valueResult.value;

        if (keyTypeCode === 0x00) {
          mapKey = null;
        } else if (keyTypeCode < 0x0f) {
          mapKey = (keyResult.value as { value: unknown }).value;
        }

        if (valueTypeCode === 0x00) {
          mapValue = null;
        } else if (valueTypeCode < 0x0f) {
          mapValue = (valueResult.value as { value: unknown }).value;
        }

        entries.set(mapKey, mapValue);
      }

      return ok(Map_(keyTypeCode, valueTypeCode, entries) as RelishValue);
    }

    case "RStruct": {
      const structSchema = schema as TRStruct<Record<string, TStructField>>;
      const jsObj = value as Record<string, unknown>;
      const fields = new Map<number, RelishValue>();

      // Collect field entries with their IDs for sorting
      const fieldEntries: Array<{ name: string; fieldId: number; schema: TRelishSchema }> = [];
      for (const [name, fieldSchema] of Object.entries(structSchema.fields)) {
        const fieldId = (fieldSchema as any).fieldId as number;
        let actualSchema = fieldSchema as unknown as TRelishSchema;

        // Unwrap ROptional to get the actual schema
        if ((fieldSchema as any)[RelishKind] === "ROptional") {
          actualSchema = ((fieldSchema as unknown) as TROptional<TRelishSchema>).inner;
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
        const isOptional = (fieldSchemaObj as any)[RelishKind] === "ROptional";

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
      const variantSchema = (enumSchema.variants as any)[jsEnum.variant];

      if (variantSchema === undefined) {
        return err(new EncodeError(`unknown enum variant: ${jsEnum.variant}`));
      }

      const variantId = (variantSchema as any).variantId as number;
      const valueResult = jsToRelish(jsEnum.value, variantSchema as TRelishSchema);
      if (valueResult.isErr()) {
        return err(valueResult.error);
      }

      return ok(Enum(variantId, valueResult.value));
    }

    default:
      return err(new EncodeError(`unsupported schema type: ${kind as string}`));
  }
}
