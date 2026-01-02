// pattern: Functional Core
// Decoder class with cursor management for Relish binary decoding

import { Result, ok, err } from "neverthrow";
import { DecodeError } from "./errors.js";

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
}
