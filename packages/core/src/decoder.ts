// pattern: Functional Core
// Decoder class with cursor management for Relish binary decoding

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
}
