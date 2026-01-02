// pattern: Functional Core
// Decoder class with cursor management for Relish binary decoding

import { Result, ok, err } from "neverthrow";
import { DecodeError } from "./errors.js";
import { TypeCode, type DecodedValue } from "./types.js";

type DecoderMethod = (decoder: Decoder) => Result<DecodedValue, DecodeError>;

const TYPE_DECODERS: Partial<Record<TypeCode, DecoderMethod>> = {
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
};

export class Decoder {
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

    const decoderMethod = TYPE_DECODERS[typeCode as TypeCode];
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
}
