// pattern: Functional Core
import { Result, ok, err } from "neverthrow";
import type {
  RelishValue,
  RelishArray,
  RelishMap,
  RelishStruct,
  RelishEnum,
} from "./types.js";
import { TypeCode } from "./types.js";
import { EncodeError } from "./errors.js";
import { encodeTaggedVarint, getTypeCodeForValue } from "./encoding-helpers.js";

/**
 * Encode a RelishValue to bytes.
 */
export function encode(value: RelishValue): Result<Uint8Array, EncodeError> {
  const encoder = new Encoder();
  return encoder.encode(value);
}

/**
 * Encoder class with pre-allocated buffer for performance.
 * Can be reused for multiple encode operations.
 */
export class Encoder {
  private buffer: Uint8Array;
  private view: DataView;
  private position: number;

  constructor(initialSize: number = 1024) {
    this.buffer = new Uint8Array(initialSize);
    this.view = new DataView(this.buffer.buffer);
    this.position = 0;
  }

  encode(value: RelishValue): Result<Uint8Array, EncodeError> {
    this.position = 0;
    return this.encodeValue(value).map(() => this.getResult());
  }

  private getResult(): Uint8Array {
    return this.buffer.slice(0, this.position);
  }

  private ensureCapacity(needed: number): void {
    const required = this.position + needed;
    if (required > this.buffer.length) {
      const newSize = Math.max(this.buffer.length * 2, required);
      const newBuffer = new Uint8Array(newSize);
      newBuffer.set(this.buffer);
      this.buffer = newBuffer;
      this.view = new DataView(this.buffer.buffer);
    }
  }

  private writeByte(byte: number): void {
    this.ensureCapacity(1);
    this.buffer[this.position++] = byte;
  }

  private writeBytes(bytes: Uint8Array): void {
    this.ensureCapacity(bytes.length);
    this.buffer.set(bytes, this.position);
    this.position += bytes.length;
  }

  private encodeValue(value: RelishValue): Result<void, EncodeError> {
    const typeCode = getTypeCodeForValue(value);
    this.writeByte(typeCode);

    switch (value.type) {
      case "null":
        return ok(undefined);

      case "bool":
        // Rust: true = 0xFF, false = 0x00
        this.writeByte(value.value ? 0xff : 0x00);
        return ok(undefined);

      case "u8":
        this.writeByte(value.value);
        return ok(undefined);

      case "u16":
        this.ensureCapacity(2);
        this.view.setUint16(this.position, value.value, true);
        this.position += 2;
        return ok(undefined);

      case "u32":
        this.ensureCapacity(4);
        this.view.setUint32(this.position, value.value, true);
        this.position += 4;
        return ok(undefined);

      case "u64":
        this.encodeBigIntLE(value.value, 8);
        return ok(undefined);

      case "u128":
        this.encodeBigIntLE(value.value, 16);
        return ok(undefined);

      case "i8":
        this.writeByte(value.value & 0xff);
        return ok(undefined);

      case "i16":
        this.ensureCapacity(2);
        this.view.setInt16(this.position, value.value, true);
        this.position += 2;
        return ok(undefined);

      case "i32":
        this.ensureCapacity(4);
        this.view.setInt32(this.position, value.value, true);
        this.position += 4;
        return ok(undefined);

      case "i64":
        this.encodeBigIntLE(value.value, 8);
        return ok(undefined);

      case "i128":
        this.encodeBigIntLE(value.value, 16);
        return ok(undefined);

      case "f32":
        this.ensureCapacity(4);
        this.view.setFloat32(this.position, value.value, true);
        this.position += 4;
        return ok(undefined);

      case "f64":
        this.ensureCapacity(8);
        this.view.setFloat64(this.position, value.value, true);
        this.position += 8;
        return ok(undefined);

      case "string":
        return this.encodeString(value.value);

      case "timestamp":
        this.encodeBigIntLE(value.unixSeconds, 8);
        return ok(undefined);

      case "array":
        return this.encodeArray(value);

      case "map":
        return this.encodeMap(value);

      case "struct":
        return this.encodeStruct(value);

      case "enum":
        return this.encodeEnum(value);
    }
  }

  private encodeBigIntLE(value: bigint, byteLength: number): void {
    this.ensureCapacity(byteLength);
    const mask = (1n << BigInt(byteLength * 8)) - 1n;
    let unsigned = value < 0n ? (value & mask) : value;

    for (let i = 0; i < byteLength; i++) {
      this.buffer[this.position++] = Number(unsigned & 0xffn);
      unsigned >>= 8n;
    }
  }

  private encodeString(str: string): Result<void, EncodeError> {
    const bytes = new TextEncoder().encode(str);
    const lengthBytes = encodeTaggedVarint(bytes.length);
    this.writeBytes(lengthBytes);
    this.writeBytes(bytes);
    return ok(undefined);
  }

  private encodeArray(value: RelishArray): Result<void, EncodeError> {
    // First encode all elements to get content
    const contentEncoder = new Encoder();
    contentEncoder.writeByte(value.elementType);
    for (const element of value.elements) {
      // Array elements hold raw JS values for primitive types, RelishValue for composite types
      const result = contentEncoder.encodeRawValue(value.elementType, element);
      if (result.isErr()) return result;
    }
    const content = contentEncoder.getResult();

    // Write length + content
    const lengthBytes = encodeTaggedVarint(content.length);
    this.writeBytes(lengthBytes);
    this.writeBytes(content);
    return ok(undefined);
  }

  private encodeMap(value: RelishMap): Result<void, EncodeError> {
    // First encode all entries to get content
    const contentEncoder = new Encoder();
    contentEncoder.writeByte(value.keyType);
    contentEncoder.writeByte(value.valueType);
    for (const [key, val] of value.entries) {
      // Map entries hold raw JS values for primitive types, RelishValue for composite types
      const keyResult = contentEncoder.encodeRawValue(value.keyType, key);
      if (keyResult.isErr()) return keyResult;
      const valResult = contentEncoder.encodeRawValue(value.valueType, val);
      if (valResult.isErr()) return valResult;
    }
    const content = contentEncoder.getResult();

    const lengthBytes = encodeTaggedVarint(content.length);
    this.writeBytes(lengthBytes);
    this.writeBytes(content);
    return ok(undefined);
  }

  private encodeStruct(value: RelishStruct): Result<void, EncodeError> {
    // First encode all fields to get content length
    const contentEncoder = new Encoder();

    const sortedFields = [...value.fields.entries()].sort(([a], [b]) => a - b);

    let previousId = -1;
    for (const [fieldId, fieldValue] of sortedFields) {
      if (fieldId <= previousId) {
        return err(EncodeError.unsortedFields(previousId, fieldId));
      }
      if (fieldId > 127) {
        return err(EncodeError.invalidFieldId(fieldId));
      }
      previousId = fieldId;

      contentEncoder.writeByte(fieldId);
      const result = contentEncoder.encodeValue(fieldValue);
      if (result.isErr()) return result;
    }

    const content = contentEncoder.getResult();
    const lengthBytes = encodeTaggedVarint(content.length);
    this.writeBytes(lengthBytes);
    this.writeBytes(content);
    return ok(undefined);
  }

  private encodeEnum(value: RelishEnum): Result<void, EncodeError> {
    if (value.variantId > 127) {
      return err(EncodeError.invalidFieldId(value.variantId));
    }

    // Encode variant content: variant ID + full value encoding
    const contentEncoder = new Encoder();
    contentEncoder.writeByte(value.variantId);
    const innerResult = contentEncoder.encodeValue(value.value);
    if (innerResult.isErr()) return err(innerResult.error);
    const content = contentEncoder.getResult();

    const lengthBytes = encodeTaggedVarint(content.length);
    this.writeBytes(lengthBytes);
    this.writeBytes(content);
    return ok(undefined);
  }

  /**
   * Encode a raw value (JS primitive or RelishValue) based on its TypeCode.
   * For primitive types, value is the raw JS value (number, bigint, string, etc.)
   * For composite types (Array, Map, Struct, Enum), value is a RelishValue.
   */
  private encodeRawValue(typeCode: TypeCode, value: unknown): Result<void, EncodeError> {
    switch (typeCode) {
      case TypeCode.Null:
        return ok(undefined);
      case TypeCode.Bool:
        this.writeByte((value as boolean) ? 0xff : 0x00);
        return ok(undefined);
      case TypeCode.U8:
        this.writeByte(value as number);
        return ok(undefined);
      case TypeCode.U16:
        this.ensureCapacity(2);
        this.view.setUint16(this.position, value as number, true);
        this.position += 2;
        return ok(undefined);
      case TypeCode.U32:
        this.ensureCapacity(4);
        this.view.setUint32(this.position, value as number, true);
        this.position += 4;
        return ok(undefined);
      case TypeCode.U64:
        this.encodeBigIntLE(value as bigint, 8);
        return ok(undefined);
      case TypeCode.U128:
        this.encodeBigIntLE(value as bigint, 16);
        return ok(undefined);
      case TypeCode.I8:
        this.writeByte((value as number) & 0xff);
        return ok(undefined);
      case TypeCode.I16:
        this.ensureCapacity(2);
        this.view.setInt16(this.position, value as number, true);
        this.position += 2;
        return ok(undefined);
      case TypeCode.I32:
        this.ensureCapacity(4);
        this.view.setInt32(this.position, value as number, true);
        this.position += 4;
        return ok(undefined);
      case TypeCode.I64:
        this.encodeBigIntLE(value as bigint, 8);
        return ok(undefined);
      case TypeCode.I128:
        this.encodeBigIntLE(value as bigint, 16);
        return ok(undefined);
      case TypeCode.F32:
        this.ensureCapacity(4);
        this.view.setFloat32(this.position, value as number, true);
        this.position += 4;
        return ok(undefined);
      case TypeCode.F64:
        this.ensureCapacity(8);
        this.view.setFloat64(this.position, value as number, true);
        this.position += 8;
        return ok(undefined);
      case TypeCode.String: {
        const bytes = new TextEncoder().encode(value as string);
        const lengthBytes = encodeTaggedVarint(bytes.length);
        this.writeBytes(lengthBytes);
        this.writeBytes(bytes);
        return ok(undefined);
      }
      case TypeCode.Timestamp:
        this.encodeBigIntLE(value as bigint, 8);
        return ok(undefined);
      case TypeCode.Array:
      case TypeCode.Map:
      case TypeCode.Struct:
      case TypeCode.Enum:
        // Composite types are passed as RelishValue, use full encoding
        return this.encodeValue(value as RelishValue);
      default:
        return err(EncodeError.invalidTypeCode(typeCode));
    }
  }
}
