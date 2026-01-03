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
  EncodeError,
} from "@grounds/core";
import { DateTime } from "luxon";
import { RelishKind } from "./symbols.js";
import type { TRelishSchema } from "./types.js";

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

    default:
      return err(new EncodeError(`unsupported schema type: ${kind as string}`));
  }
}
