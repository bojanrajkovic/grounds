// pattern: Functional Core
// Decoder class with cursor management for Relish binary decoding

import { Result, ok, err } from "neverthrow";
import { DateTime } from "luxon";
import { DecodeError } from "./errors.js";
import { TypeCode, type DecodedValue } from "./types.js";

type DecoderMethod = (decoder: Decoder) => Result<DecodedValue, DecodeError>;

export class Decoder {
  private static readonly TYPE_DECODERS: Partial<Record<TypeCode, DecoderMethod>> = {
    [TypeCode.Null]: () => ok(null),
    [TypeCode.Bool]: (d) => d.decodeBool(),
    [TypeCode.U8]: (d) => d.decodeU8(),
    [TypeCode.U16]: (d) => d.decodeU16(),
    [TypeCode.U32]: (d) => d.decodeU32(),
    [TypeCode.U64]: (d) => d.decodeU64(),
    [TypeCode.U128]: (d) => d.decodeU128(),
    [TypeCode.I8]: (d) => d.decodeI8(),
    [TypeCode.I16]: (d) => d.decodeI16(),
    [TypeCode.I32]: (d) => d.decodeI32(),
    [TypeCode.I64]: (d) => d.decodeI64(),
    [TypeCode.I128]: (d) => d.decodeI128(),
    [TypeCode.F32]: (d) => d.decodeF32(),
    [TypeCode.F64]: (d) => d.decodeF64(),
    [TypeCode.String]: (d) => d.decodeString(),
    [TypeCode.Timestamp]: (d) => d.decodeTimestamp(),
    [TypeCode.Array]: (d) => d.decodeArray(),
    [TypeCode.Map]: (d) => d.decodeMap(),
    [TypeCode.Struct]: (d) => d.decodeStruct(),
    [TypeCode.Enum]: (d) => d.decodeEnum(),
  };
  private readonly buffer: Uint8Array;
  private readonly view: DataView;
  private cursor: number = 0;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }

  get position(): number {
    return this.cursor;
  }

  get remaining(): number {
    return this.buffer.length - this.cursor;
  }

  decodeVarsizeLength(): Result<number, DecodeError> {
    if (this.remaining < 1) {
      return err(DecodeError.unexpectedEnd(1, 0));
    }

    const firstByte = this.buffer[this.cursor]!;

    if ((firstByte & 0x01) === 0) {
      // Short form: 7-bit length
      this.cursor += 1;
      return ok(firstByte >> 1);
    }

    // Long form: 4-byte little-endian
    if (this.remaining < 4) {
      return err(DecodeError.unexpectedEnd(4, this.remaining));
    }

    const encoded = this.view.getUint32(this.cursor, true);
    this.cursor += 4;
    return ok(encoded >> 1);
  }

  decodeValue(): Result<DecodedValue, DecodeError> {
    if (this.remaining < 1) {
      return err(DecodeError.unexpectedEnd(1, 0));
    }

    const typeCode = this.buffer[this.cursor]!;

    // Validate type code (bit 7 must not be set)
    if ((typeCode & 0x80) !== 0) {
      return err(DecodeError.invalidTypeCode(typeCode));
    }

    this.cursor += 1;

    const decoderMethod = Decoder.TYPE_DECODERS[typeCode as TypeCode];
    if (decoderMethod === undefined) {
      return err(DecodeError.unknownTypeCode(typeCode));
    }

    return decoderMethod(this);
  }

  private decodeBool(): Result<boolean, DecodeError> {
    if (this.remaining < 1) {
      return err(DecodeError.unexpectedEnd(1, this.remaining));
    }
    const byte = this.buffer[this.cursor]!;
    this.cursor += 1;
    return ok(byte !== 0x00);
  }

  private decodeU8(): Result<number, DecodeError> {
    if (this.remaining < 1) {
      return err(DecodeError.unexpectedEnd(1, this.remaining));
    }
    const value = this.buffer[this.cursor]!;
    this.cursor += 1;
    return ok(value);
  }

  private decodeU16(): Result<number, DecodeError> {
    if (this.remaining < 2) {
      return err(DecodeError.unexpectedEnd(2, this.remaining));
    }
    const value = this.view.getUint16(this.cursor, true);
    this.cursor += 2;
    return ok(value);
  }

  private decodeU32(): Result<number, DecodeError> {
    if (this.remaining < 4) {
      return err(DecodeError.unexpectedEnd(4, this.remaining));
    }
    const value = this.view.getUint32(this.cursor, true);
    this.cursor += 4;
    return ok(value);
  }

  private decodeU64(): Result<bigint, DecodeError> {
    if (this.remaining < 8) {
      return err(DecodeError.unexpectedEnd(8, this.remaining));
    }
    const value = this.view.getBigUint64(this.cursor, true);
    this.cursor += 8;
    return ok(value);
  }

  private decodeU128(): Result<bigint, DecodeError> {
    if (this.remaining < 16) {
      return err(DecodeError.unexpectedEnd(16, this.remaining));
    }
    const low = this.view.getBigUint64(this.cursor, true);
    const high = this.view.getBigUint64(this.cursor + 8, true);
    this.cursor += 16;
    return ok((high << 64n) | low);
  }

  private decodeI8(): Result<number, DecodeError> {
    if (this.remaining < 1) {
      return err(DecodeError.unexpectedEnd(1, this.remaining));
    }
    const value = this.view.getInt8(this.cursor);
    this.cursor += 1;
    return ok(value);
  }

  private decodeI16(): Result<number, DecodeError> {
    if (this.remaining < 2) {
      return err(DecodeError.unexpectedEnd(2, this.remaining));
    }
    const value = this.view.getInt16(this.cursor, true);
    this.cursor += 2;
    return ok(value);
  }

  private decodeI32(): Result<number, DecodeError> {
    if (this.remaining < 4) {
      return err(DecodeError.unexpectedEnd(4, this.remaining));
    }
    const value = this.view.getInt32(this.cursor, true);
    this.cursor += 4;
    return ok(value);
  }

  private decodeI64(): Result<bigint, DecodeError> {
    if (this.remaining < 8) {
      return err(DecodeError.unexpectedEnd(8, this.remaining));
    }
    const value = this.view.getBigInt64(this.cursor, true);
    this.cursor += 8;
    return ok(value);
  }

  private decodeI128(): Result<bigint, DecodeError> {
    if (this.remaining < 16) {
      return err(DecodeError.unexpectedEnd(16, this.remaining));
    }
    const low = this.view.getBigUint64(this.cursor, true);
    const high = this.view.getBigInt64(this.cursor + 8, true);
    this.cursor += 16;
    return ok((high << 64n) | low);
  }

  private decodeF32(): Result<number, DecodeError> {
    if (this.remaining < 4) {
      return err(DecodeError.unexpectedEnd(4, this.remaining));
    }
    const value = this.view.getFloat32(this.cursor, true);
    this.cursor += 4;
    return ok(value);
  }

  private decodeF64(): Result<number, DecodeError> {
    if (this.remaining < 8) {
      return err(DecodeError.unexpectedEnd(8, this.remaining));
    }
    const value = this.view.getFloat64(this.cursor, true);
    this.cursor += 8;
    return ok(value);
  }

  private decodeString(): Result<string, DecodeError> {
    const lengthResult = this.decodeVarsizeLength();
    if (lengthResult.isErr()) {
      return err(lengthResult.error);
    }

    const length = lengthResult.value;
    if (this.remaining < length) {
      return err(DecodeError.unexpectedEnd(length, this.remaining));
    }

    const bytes = this.buffer.subarray(this.cursor, this.cursor + length);
    this.cursor += length;

    try {
      const decoder = new TextDecoder("utf-8", { fatal: true });
      return ok(decoder.decode(bytes));
    } catch {
      return err(DecodeError.invalidUtf8());
    }
  }

  private decodeTimestamp(): Result<DateTime, DecodeError> {
    if (this.remaining < 8) {
      return err(DecodeError.unexpectedEnd(8, this.remaining));
    }
    const unixSeconds = this.view.getBigInt64(this.cursor, true);
    this.cursor += 8;
    return ok(DateTime.fromSeconds(Number(unixSeconds), { zone: "utc" }));
  }

  private decodeArray(): Result<DecodedValue, DecodeError> {
    const lengthResult = this.decodeVarsizeLength();
    if (lengthResult.isErr()) {
      return err(lengthResult.error);
    }

    const contentLength = lengthResult.value;
    if (contentLength < 1) {
      return err(DecodeError.unexpectedEnd(1, contentLength));
    }

    if (this.remaining < 1) {
      return err(DecodeError.unexpectedEnd(1, 0));
    }

    const elementType = this.buffer[this.cursor]! as TypeCode;
    this.cursor += 1;

    // Calculate remaining bytes for elements
    const elementsLength = contentLength - 1;
    const endPosition = this.cursor + elementsLength;

    const elements: Array<DecodedValue> = [];

    while (this.cursor < endPosition) {
      let elementResult: Result<DecodedValue, DecodeError>;

      // Check if element type is composite
      if (
        elementType === TypeCode.Array ||
        elementType === TypeCode.Map ||
        elementType === TypeCode.Struct ||
        elementType === TypeCode.Enum
      ) {
        // Composite types: decode [L]V without expecting type code
        switch (elementType) {
          case TypeCode.Array:
            elementResult = this.decodeArray();
            break;
          case TypeCode.Map:
            elementResult = this.decodeMap();
            break;
          case TypeCode.Struct:
            elementResult = this.decodeStruct();
            break;
          case TypeCode.Enum:
            elementResult = this.decodeEnum();
            break;
          default:
            return err(DecodeError.unknownTypeCode(elementType));
        }
      } else {
        // Primitive types: decode raw value without type code
        elementResult = this.decodePrimitiveValue(elementType);
      }

      if (elementResult.isErr()) {
        return err(elementResult.error);
      }
      elements.push(elementResult.value);
    }

    // Return as ReadonlyArray (Array.isArray() still returns true for arrays)
    return ok(elements as DecodedValue);
  }

  private decodePrimitiveValue(typeCode: TypeCode): Result<DecodedValue, DecodeError> {
    // Decode raw value for a primitive type (without reading a type code from buffer)
    // Uses same dispatch table as decodeValue()
    const decoderMethod = Decoder.TYPE_DECODERS[typeCode];
    if (decoderMethod === undefined) {
      return err(DecodeError.unknownTypeCode(typeCode));
    }
    return decoderMethod(this);
  }

  private decodeMap(): Result<ReadonlyMap<DecodedValue, DecodedValue>, DecodeError> {
    const lengthResult = this.decodeVarsizeLength();
    if (lengthResult.isErr()) {
      return err(lengthResult.error);
    }

    const contentLength = lengthResult.value;
    if (contentLength < 2) {
      return err(DecodeError.unexpectedEnd(2, contentLength));
    }

    if (this.remaining < 2) {
      return err(DecodeError.unexpectedEnd(2, this.remaining));
    }

    const keyType = this.buffer[this.cursor]! as TypeCode;
    const valueType = this.buffer[this.cursor + 1]! as TypeCode;
    this.cursor += 2;

    // Calculate remaining bytes for entries
    const entriesLength = contentLength - 2;
    const endPosition = this.cursor + entriesLength;

    const entries = new Map<DecodedValue, DecodedValue>();
    const seenKeys = new Set<string>();

    while (this.cursor < endPosition) {
      // Decode key (composite or primitive)
      let keyResult: Result<DecodedValue, DecodeError>;
      if (
        keyType === TypeCode.Array ||
        keyType === TypeCode.Map ||
        keyType === TypeCode.Struct ||
        keyType === TypeCode.Enum
      ) {
        switch (keyType) {
          case TypeCode.Array:
            keyResult = this.decodeArray();
            break;
          case TypeCode.Map:
            keyResult = this.decodeMap();
            break;
          case TypeCode.Struct:
            keyResult = this.decodeStruct();
            break;
          case TypeCode.Enum:
            keyResult = this.decodeEnum();
            break;
          default:
            return err(DecodeError.unknownTypeCode(keyType));
        }
      } else {
        keyResult = this.decodePrimitiveValue(keyType);
      }

      if (keyResult.isErr()) {
        return err(keyResult.error);
      }

      // Check for duplicate keys using JSON serialization
      const keyString = JSON.stringify(keyResult.value);
      if (seenKeys.has(keyString)) {
        return err(DecodeError.duplicateMapKey());
      }
      seenKeys.add(keyString);

      // Decode value (composite or primitive)
      let valueResult: Result<DecodedValue, DecodeError>;
      if (
        valueType === TypeCode.Array ||
        valueType === TypeCode.Map ||
        valueType === TypeCode.Struct ||
        valueType === TypeCode.Enum
      ) {
        switch (valueType) {
          case TypeCode.Array:
            valueResult = this.decodeArray();
            break;
          case TypeCode.Map:
            valueResult = this.decodeMap();
            break;
          case TypeCode.Struct:
            valueResult = this.decodeStruct();
            break;
          case TypeCode.Enum:
            valueResult = this.decodeEnum();
            break;
          default:
            return err(DecodeError.unknownTypeCode(valueType));
        }
      } else {
        valueResult = this.decodePrimitiveValue(valueType);
      }

      if (valueResult.isErr()) {
        return err(valueResult.error);
      }

      entries.set(keyResult.value, valueResult.value);
    }

    return ok(entries as ReadonlyMap<DecodedValue, DecodedValue>);
  }

  private decodeStruct(): Result<Readonly<{ [fieldId: number]: DecodedValue }>, DecodeError> {
    const lengthResult = this.decodeVarsizeLength();
    if (lengthResult.isErr()) {
      return err(lengthResult.error);
    }

    const contentLength = lengthResult.value;
    const endPosition = this.cursor + contentLength;

    const fields: { [fieldId: number]: DecodedValue } = {};
    let lastFieldId = -1;

    while (this.cursor < endPosition) {
      if (this.remaining < 1) {
        return err(DecodeError.unexpectedEnd(1, this.remaining));
      }

      const fieldId = this.buffer[this.cursor]!;
      this.cursor += 1;

      // Validate field ID (bit 7 must not be set)
      if ((fieldId & 0x80) !== 0) {
        return err(DecodeError.invalidFieldId(fieldId));
      }

      // Validate field IDs are strictly ascending
      if (fieldId <= lastFieldId) {
        return err(DecodeError.unsortedFields(lastFieldId, fieldId));
      }
      lastFieldId = fieldId;

      // Recursively decode field value
      const valueResult = this.decodeValue();
      if (valueResult.isErr()) {
        return err(valueResult.error);
      }

      fields[fieldId] = valueResult.value;
    }

    return ok(fields as Readonly<{ [fieldId: number]: DecodedValue }>);
  }

  private decodeEnum(): Result<Readonly<{ variantId: number; value: DecodedValue }>, DecodeError> {
    const lengthResult = this.decodeVarsizeLength();
    if (lengthResult.isErr()) {
      return err(lengthResult.error);
    }

    const contentLength = lengthResult.value;
    if (contentLength < 1) {
      return err(DecodeError.unexpectedEnd(1, contentLength));
    }

    const startPosition = this.cursor;

    if (this.remaining < 1) {
      return err(DecodeError.unexpectedEnd(1, this.remaining));
    }

    const variantId = this.buffer[this.cursor]!;
    this.cursor += 1;

    // Validate variant ID (bit 7 must not be set)
    if ((variantId & 0x80) !== 0) {
      return err(DecodeError.invalidVariantId(variantId));
    }

    // Recursively decode the value
    const valueResult = this.decodeValue();
    if (valueResult.isErr()) {
      return err(valueResult.error);
    }

    // Validate that decoded content matches declared length
    const actualLength = this.cursor - startPosition;
    if (actualLength !== contentLength) {
      return err(DecodeError.enumLengthMismatch(contentLength, actualLength));
    }

    return ok({ variantId, value: valueResult.value } as Readonly<{ variantId: number; value: DecodedValue }>);
  }
}

export function decode(bytes: Uint8Array): Result<DecodedValue, DecodeError> {
  const decoder = new Decoder(bytes);
  return decoder.decodeValue();
}
