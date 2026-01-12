// pattern: Imperative Shell
import { describe, it, expect } from "vitest";
import { createEncoderStream, createDecoderStream } from "../src/web-streams.js";
import { Null, Bool } from "@grounds/core";

describe("createEncoderStream", () => {
  it("should transform RelishValues to Uint8Array chunks", async () => {
    const values = [Null, Bool(true)];

    const readable = new ReadableStream({
      start(controller) {
        for (const v of values) {
          controller.enqueue(v);
        }
        controller.close();
      },
    });

    const encoded = readable.pipeThrough(createEncoderStream());
    const reader = encoded.getReader();
    const chunks: Array<Uint8Array> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
    }

    expect(chunks.length).toBeGreaterThan(0);
  });
});

describe("createDecoderStream", () => {
  it("should transform Uint8Array chunks to DecodedValues", async () => {
    const readable = new ReadableStream({
      start(controller) {
        // Null + Bool true
        controller.enqueue(new Uint8Array([0x00, 0x01, 0x01]));
        controller.close();
      },
    });

    const decoded = readable.pipeThrough(createDecoderStream());
    const reader = decoded.getReader();
    const values: Array<unknown> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      values.push(value);
    }

    expect(values).toHaveLength(2);
    expect(values[0]).toBe(null);
    expect(values[1]).toBe(true);
  });

  it("should error with TRUNCATED_STREAM for incomplete trailing data", async () => {
    const readable = new ReadableStream({
      start(controller) {
        // Complete Null + incomplete String (type + length but no data)
        controller.enqueue(new Uint8Array([0x00, 0x0e, 0x05]));
        controller.close();
      },
    });

    const decoded = readable.pipeThrough(createDecoderStream());
    const reader = decoded.getReader();

    // First read: Null value
    const first = await reader.read();
    expect(first.done).toBe(false);
    expect(first.value).toBe(null);

    // Second read: should error with TRUNCATED_STREAM
    await expect(reader.read()).rejects.toMatchObject({
      code: "TRUNCATED_STREAM",
    });
  });
});
