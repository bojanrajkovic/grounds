// pattern: Imperative Shell
import type { Static } from "@sinclair/typebox";
import { createCodec, type TRelishSchema as PublicRelishSchema } from "@grounds/schema";
import { StreamBuffer } from "./buffer.js";
import { DecodeError as DecodeErrorClass, type DecodeError } from "@grounds/core";
import { Result, ok, err } from "neverthrow";

// Internal schema symbols for _decodeValueToTyped helper
// These are internal implementation details of @grounds/schema
// We access them directly to avoid cross-package coupling and to enable
// byte-tracking during streaming (see ADR 0001)
// Symbol keys must match those in @grounds/schema/src/symbols.ts
const RelishKind = Symbol.for("@grounds/schema/Kind");
const RelishElementType = Symbol.for("@grounds/schema/ElementType");
const RelishValueType = Symbol.for("@grounds/schema/ValueType");

// Type aliases for schema introspection
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SchemaValue = any;

/**
 * Internal helper: Convert decoded values to schema-aware typed values.
 *
 * This duplicates conversion logic from @grounds/schema/src/convert.ts.
 * Both functions implement the same conversion algorithm:
 * - Struct field IDs → property names
 * - Enum variant IDs → variant names
 * - Primitives → pass through
 * - Missing optional fields → null
 *
 * The duplication is intentional. The streaming layer needs byte tracking via Decoder.position,
 * which requires using Decoder directly. See ADR 0001 for architectural context.
 *
 * WARNING: If the conversion algorithm changes in @grounds/schema, update this function too.
 * Keep both implementations in sync.
 *
 * @param decoded - Raw decoded value from core decoder
 * @param schema - The Relish schema
 * @returns Schema-aware typed value
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _decodeValueToTyped<T>(decoded: unknown, schema: SchemaValue): Result<T, DecodeError> {
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
      return ok(decoded as T);

    case "RTimestamp":
      // Decoder already returns Luxon DateTime - pass through
      return ok(decoded as T);

    case "RArray": {
      const elementSchema = schema[RelishElementType] as SchemaValue;
      const decodedArr = decoded as ReadonlyArray<unknown>;
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
      const valueSchema = schema[RelishValueType] as SchemaValue;
      const decodedMap = decoded as ReadonlyMap<unknown, unknown>;
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
      const decodedStruct = decoded as Readonly<{ [fieldId: number]: unknown }>;
      const jsObj: Record<string, unknown> = {};
      const fields = (schema as SchemaValue).fields as Record<string, SchemaValue>;

      for (const [name, fieldSchema] of Object.entries(fields)) {
        const fieldId = (fieldSchema as SchemaValue).fieldId as number;
        const fieldValue = decodedStruct[fieldId];

        if (fieldValue === undefined) {
          // Missing field - set to null for optional, error for required
          const fieldKind = (fieldSchema as SchemaValue)[RelishKind];
          if (fieldKind === "ROptional") {
            jsObj[name] = null;
          } else {
            return err(DecodeErrorClass.missingRequiredField(fieldId));
          }
        } else {
          let actualSchema = fieldSchema;
          const fieldKind = (fieldSchema as SchemaValue)[RelishKind];
          if (fieldKind === "ROptional") {
            actualSchema = (fieldSchema as SchemaValue).inner;
          }
          const valueResult = _decodeValueToTyped(fieldValue, actualSchema);
          if (valueResult.isErr()) {
            return err(valueResult.error);
          }
          jsObj[name] = valueResult.value;
        }
      }

      return ok(jsObj as T);
    }

    case "REnum": {
      const decodedEnum = decoded as Readonly<{ variantId: number; value: unknown }>;
      const variantId = decodedEnum.variantId;
      const enumValue = decodedEnum.value;
      const variants = (schema as SchemaValue).variants as Record<string, SchemaValue>;

      // Find variant by ID and convert to named variant
      for (const [variantName, variantSchema] of Object.entries(variants)) {
        const vid = (variantSchema as SchemaValue).variantId as number;
        if (vid === variantId) {
          const valueResult = _decodeValueToTyped(enumValue, variantSchema);
          if (valueResult.isErr()) {
            return err(valueResult.error);
          }
          return ok({ variant: variantName, value: valueResult.value } as T);
        }
      }

      return err(DecodeErrorClass.unknownVariantId(variantId));
    }

    case "ROptional": {
      const innerSchema = (schema as SchemaValue).inner as SchemaValue;
      if (decoded === null) {
        return ok(null as T);
      }
      return _decodeValueToTyped(decoded, innerSchema);
    }

    default:
      return err(DecodeErrorClass.unsupportedType(kind as string));
  }
}

export function createSchemaEncoderStream<T extends PublicRelishSchema>(
  schema: T
): TransformStream<Static<T>, Uint8Array> {
  const codec = createCodec(schema);

  return new TransformStream({
    transform(value, controller) {
      const result = codec.encode(value);
      if (result.isErr()) {
        controller.error(result.error);
        return;
      }
      controller.enqueue(result.value);
    },
  });
}

export function createSchemaDecoderStream<T extends PublicRelishSchema>(
  schema: T
): TransformStream<Uint8Array, Static<T>> {
  const buffer = new StreamBuffer();

  return new TransformStream({
    transform(chunk, controller) {
      buffer.append(chunk);

      while (buffer.length > 0) {
        const result = buffer.tryDecodeOne();

        if (result.status === "needMore") {
          break;
        }

        if (result.status === "error") {
          controller.error(result.error);
          return;
        }

        if (result.status === "ok") {
          if (result.value.isErr()) {
            controller.error(result.value.error);
            return;
          }

          // Convert raw DecodedValue to schema-typed value using internal helper
          // This uses the same conversion logic as @grounds/schema/convert.ts:fromRelish
          // (see ADR 0001 for duplication rationale)
          const typedResult = _decodeValueToTyped<Static<T>>(result.value.value, schema as SchemaValue);
          if (typedResult.isErr()) {
            controller.error(typedResult.error);
            return;
          }
          controller.enqueue(typedResult.value);
        }
      }
    },

    flush(controller) {
      if (buffer.length > 0) {
        const result = buffer.tryDecodeOne();

        if (result.status === "needMore") {
          controller.error(
            DecodeErrorClass.truncatedStream(
              `${buffer.length} bytes remaining at end of schema stream`
            )
          );
          return;
        }

        if (result.status === "error") {
          controller.error(result.error);
          return;
        }

        if (result.status === "ok") {
          if (result.value.isErr()) {
            controller.error(result.value.error);
            return;
          }

          // Convert raw DecodedValue to schema-typed value using internal helper
          const typedResult = _decodeValueToTyped<Static<T>>(result.value.value, schema as SchemaValue);
          if (typedResult.isErr()) {
            controller.error(typedResult.error);
            return;
          }
          controller.enqueue(typedResult.value);
        }
      }
    },
  });
}
