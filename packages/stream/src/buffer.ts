// pattern: Functional Core
import { type Result, ok } from "neverthrow";
import { decode, type DecodedValue, type DecodeError } from "@grounds/core";

export type TryDecodeResult =
  | { status: "ok"; value: Result<DecodedValue, DecodeError>; bytesConsumed: number }
  | { status: "needMore" }
  | { status: "error"; error: DecodeError };

export class StreamBuffer {
  private chunks: Array<Uint8Array> = [];
  private totalLength = 0;

  get length(): number {
    return this.totalLength;
  }

  append(chunk: Uint8Array): void {
    this.chunks.push(chunk);
    this.totalLength += chunk.length;
  }

  peek(n: number): Uint8Array {
    if (n > this.totalLength) {
      n = this.totalLength;
    }
    return this.collectBytes(n, false);
  }

  consume(n: number): Uint8Array {
    if (n > this.totalLength) {
      n = this.totalLength;
    }
    return this.collectBytes(n, true);
  }

  tryDecodeOne(): TryDecodeResult {
    if (this.totalLength === 0) {
      return { status: "needMore" };
    }

    // Get all available bytes for decode attempt
    const data = this.toUint8Array();
    const result = decode(data);

    if (result.isErr()) {
      const error = result.error;
      // UNEXPECTED_EOF during decode means we need more data
      if (error.code === "UNEXPECTED_EOF") {
        return { status: "needMore" };
      }
      // Other errors are real decode errors
      return { status: "error", error };
    }

    // Success - figure out how many bytes were consumed
    // For now, consume all bytes (single value decode)
    const bytesConsumed = this.totalLength;
    this.chunks = [];
    this.totalLength = 0;

    return { status: "ok", value: ok(result.value), bytesConsumed };
  }

  toUint8Array(): Uint8Array {
    if (this.chunks.length === 0) {
      return new Uint8Array(0);
    }
    if (this.chunks.length === 1) {
      return this.chunks[0]!;
    }
    const result = new Uint8Array(this.totalLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  private collectBytes(n: number, remove: boolean): Uint8Array {
    const result = new Uint8Array(n);
    let offset = 0;
    let remaining = n;

    while (remaining > 0 && this.chunks.length > 0) {
      const chunk = this.chunks[0]!;
      const take = Math.min(remaining, chunk.length);

      result.set(chunk.subarray(0, take), offset);
      offset += take;
      remaining -= take;

      if (remove) {
        if (take === chunk.length) {
          this.chunks.shift();
        } else {
          this.chunks[0] = chunk.subarray(take);
        }
        this.totalLength -= take;
      }
    }

    return result;
  }
}
