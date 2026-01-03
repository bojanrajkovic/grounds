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
  EncodeError,
} from "@grounds/core";
import { DateTime } from "luxon";
import { RelishKind, RelishTypeCode, RelishElementType } from "./symbols.js";
import type { TRelishSchema, TRArray } from "./types.js";

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

    default:
      return err(new EncodeError(`unsupported schema type: ${kind as string}`));
  }
}
