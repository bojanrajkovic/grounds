// examples/stream/compressed-streams.ts
// Demonstrates: Combining schema-aware streams with Web Streams CompressionStream API
//
// Usage: pnpm exec tsx examples/stream/compressed-streams.ts [algorithm] [count]
//   algorithm: "gzip" (default), "deflate", or "deflate-raw"
//   count: number of log entries to generate (default: 20)
//
// Examples:
//   pnpm exec tsx examples/stream/compressed-streams.ts
//   pnpm exec tsx examples/stream/compressed-streams.ts deflate
//   pnpm exec tsx examples/stream/compressed-streams.ts gzip 100

import {
  createSchemaEncoderStream,
  createSchemaDecoderStream,
} from "@grounds/stream";
import { RStruct, RString, RTimestamp, RMap, field } from "@grounds/schema";
import { type Static } from "@sinclair/typebox";
import { DateTime } from "luxon";
import { faker } from "@faker-js/faker";

// Define a LogEntry schema - realistic for streaming + compression scenarios
const LogEntrySchema = RStruct({
  timestamp: field(0, RTimestamp()),
  level: field(1, RString()),
  message: field(2, RString()),
  source: field(3, RString()),
  attributes: field(4, RMap(RString(), RString())),
});

type LogEntry = Static<typeof LogEntrySchema>;

// Supported compression algorithms
// gzip, deflate, deflate-raw: Standard Web Streams API (all runtimes)
// zstd: Bun only (not available in browsers or Node.js)
type CompressionAlgorithm = "gzip" | "deflate" | "deflate-raw" | "zstd";

const VALID_ALGORITHMS: ReadonlyArray<CompressionAlgorithm> = [
  "gzip",
  "deflate",
  "deflate-raw",
  "zstd",
];

function isValidAlgorithm(value: string): value is CompressionAlgorithm {
  return VALID_ALGORITHMS.includes(value as CompressionAlgorithm);
}

// Generate sample log entries with varied data using faker
function generateLogEntries(count: number): Array<LogEntry> {
  const levels = ["info", "warn", "error", "debug"] as const;
  const sources = ["api", "auth", "db", "cache", "worker"] as const;

  const entries: Array<LogEntry> = [];
  const baseTime = DateTime.now().toUTC();

  for (let i = 0; i < count; i++) {
    entries.push({
      timestamp: baseTime.plus({ seconds: i }),
      level: faker.helpers.arrayElement(levels),
      message: faker.hacker.phrase(),
      source: faker.helpers.arrayElement(sources),
      attributes: new Map([
        ["requestId", faker.string.uuid()],
        ["userId", faker.string.nanoid(10)],
        ["duration", `${faker.number.int({ min: 1, max: 5000 })}ms`],
        ["ip", faker.internet.ipv4()],
        ["userAgent", faker.internet.userAgent()],
      ]),
    });
  }

  return entries;
}

// Format bytes with thousands separator
function formatBytes(bytes: number): string {
  return bytes.toLocaleString();
}

// Verify that decoded entries match the originals
// Note: Relish timestamps are Unix seconds, so millisecond precision is lost
function verifyRoundtrip(
  originals: Array<LogEntry>,
  decoded: Array<LogEntry>,
): boolean {
  if (originals.length !== decoded.length) {
    return false;
  }

  for (let i = 0; i < originals.length; i++) {
    const original = originals[i];
    const dec = decoded[i];

    if (!original || !dec) {
      return false;
    }

    // Compare at second precision (Relish truncates to seconds)
    const originalSeconds = Math.floor(original.timestamp.toSeconds());
    const decodedSeconds = Math.floor(dec.timestamp.toSeconds());

    if (
      originalSeconds !== decodedSeconds ||
      original.level !== dec.level ||
      original.message !== dec.message ||
      original.source !== dec.source
    ) {
      return false;
    }

    // Compare attributes map
    if (original.attributes.size !== dec.attributes.size) {
      return false;
    }

    for (const [key, value] of original.attributes) {
      if (dec.attributes.get(key) !== value) {
        return false;
      }
    }
  }

  return true;
}

async function main(): Promise<void> {
  // Parse CLI arguments
  const algorithmArg = process.argv[2] ?? "gzip";
  const countArg = process.argv[3] ?? "20";

  if (!isValidAlgorithm(algorithmArg)) {
    console.error(
      `Invalid algorithm: "${algorithmArg}". Must be one of: ${VALID_ALGORITHMS.join(", ")}`,
    );
    process.exit(1);
  }

  const count = parseInt(countArg, 10);
  if (isNaN(count) || count <= 0) {
    console.error(`Invalid count: "${countArg}". Must be a positive integer.`);
    process.exit(1);
  }

  const algorithm: CompressionAlgorithm = algorithmArg;

  console.log(`Compression algorithm: ${algorithm}`);
  console.log(`Generating ${count} log entries...\n`);

  // Generate sample data
  const entries = generateLogEntries(count);

  console.log("Pipeline: encode → compress → decompress → decode\n");

  // Step 1: Create source stream from log entries
  const sourceStream = new ReadableStream<LogEntry>({
    start(controller) {
      for (const entry of entries) {
        controller.enqueue(entry);
      }
      controller.close();
    },
  });

  // Step 2: Encode → Compress pipeline
  // Schema encoder outputs Uint8Array, which feeds directly into CompressionStream
  // Note: Type assertions needed because:
  // 1. DOM types don't include "zstd" (Bun-only algorithm)
  // 2. CompressionStream types don't perfectly align with Web Streams generics
  const compressedStream = sourceStream
    .pipeThrough(createSchemaEncoderStream(LogEntrySchema))
    .pipeThrough(
      new CompressionStream(
        algorithm as CompressionFormat,
      ) as unknown as TransformStream<Uint8Array, Uint8Array>,
    );

  // Step 3: Collect compressed bytes to measure size
  const compressedChunks: Array<Uint8Array> = [];
  const compressedReader = compressedStream.getReader();

  while (true) {
    const { done, value } = await compressedReader.read();
    if (done) break;
    compressedChunks.push(value);
  }

  // Calculate sizes
  const compressedSize = compressedChunks.reduce((sum, chunk) => sum + chunk.length, 0);

  // Step 4: Decompress → Decode pipeline
  const compressedDataStream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of compressedChunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });

  // Note: Type assertions for same reasons as CompressionStream above
  const decodedStream = compressedDataStream
    .pipeThrough(
      new DecompressionStream(
        algorithm as CompressionFormat,
      ) as unknown as TransformStream<Uint8Array, Uint8Array>,
    )
    .pipeThrough(createSchemaDecoderStream(LogEntrySchema));

  // Step 5: Collect decoded entries and measure uncompressed size
  const decodedEntries: Array<LogEntry> = [];
  let uncompressedSize = 0;

  // We need to re-encode to get uncompressed size (or calculate from original)
  // For simplicity, we'll encode the original entries without compression
  const measureStream = new ReadableStream<LogEntry>({
    start(controller) {
      for (const entry of entries) {
        controller.enqueue(entry);
      }
      controller.close();
    },
  });

  const measureEncodedStream = measureStream.pipeThrough(
    createSchemaEncoderStream(LogEntrySchema),
  );
  const measureReader = measureEncodedStream.getReader();

  while (true) {
    const { done, value } = await measureReader.read();
    if (done) break;
    uncompressedSize += value.length;
  }

  // Collect decoded entries
  const decodedReader = decodedStream.getReader();

  while (true) {
    const { done, value } = await decodedReader.read();
    if (done) break;
    decodedEntries.push(value);
  }

  // Calculate compression ratio
  const ratio = ((1 - compressedSize / uncompressedSize) * 100).toFixed(1);

  console.log(`Uncompressed size: ${formatBytes(uncompressedSize)} bytes`);
  console.log(`Compressed size:   ${formatBytes(compressedSize)} bytes`);
  console.log(`Compression ratio: ${ratio}%\n`);

  // Step 6: Verify roundtrip
  const allMatch = verifyRoundtrip(entries, decodedEntries);

  if (allMatch) {
    console.log(`✓ All ${decodedEntries.length} entries decoded successfully`);
    console.log("✓ Roundtrip verification passed");
  } else {
    console.log("✗ Roundtrip verification FAILED");
    process.exit(1);
  }
}

await main();
