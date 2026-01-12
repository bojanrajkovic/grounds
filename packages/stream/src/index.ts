// pattern: Imperative Shell
/**
 * Streaming utilities for encoding and decoding Relish values incrementally.
 *
 * Provides both async generator and Web Streams API support for streaming
 * scenarios. Includes schema-aware streaming for type-safe operations.
 *
 * @module @grounds/stream
 * @packageDocumentation
 *
 * @example
 * Async generator streaming:
 * ```typescript
 * import { encodeIterable, decodeIterable } from '@grounds/stream';
 * import { U32 } from '@grounds/core';
 *
 * async function* generateValues() {
 *   yield U32(1);
 *   yield U32(2);
 * }
 *
 * // Encode
 * for await (const result of encodeIterable(generateValues())) {
 *   // Process encoded bytes
 * }
 *
 * // Decode
 * async function* readChunks() {
 *   // Read from network, file, etc.
 * }
 *
 * for await (const result of decodeIterable(readChunks())) {
 *   // Process decoded values
 * }
 * ```
 *
 * @example
 * Web Streams API:
 * ```typescript
 * import { createEncoderStream, createDecoderStream } from '@grounds/stream';
 *
 * const encoder = createEncoderStream();
 * const decoder = createDecoderStream();
 *
 * valuesStream.pipeThrough(encoder).pipeThrough(decoder);
 * ```
 *
 * @example
 * Schema-aware streaming with async generators:
 * ```typescript
 * import { encodeIterable } from '@grounds/stream';
 * import { createCodec, RStruct, field, RString, type Static } from '@grounds/schema';
 *
 * const schema = RStruct({ name: field(0, RString()) });
 * type Data = Static<typeof schema>;
 *
 * async function* generate(): AsyncGenerator<Data> {
 *   yield { name: 'Alice' };
 * }
 *
 * const codec = createCodec(schema);
 * for await (const result of encodeIterable(generate())) {
 *   result.match(
 *     (bytes) => console.log('Encoded:', bytes),
 *     (error) => console.error('Failed:', error)
 *   );
 * }
 * ```
 *
 * @remarks
 * Two API styles:
 * - **Async Generators**: Full Result-based error handling, suitable for most use cases
 * - **Web Streams**: Standard TransformStream API, compatible with browser/Node.js streams
 *
 * Schema-aware variants combine validation from `@grounds/schema` with streaming.
 *
 * @see {@link encodeIterable} for async generator encoding
 * @see {@link decodeIterable} for async generator decoding
 * @see {@link createEncoderStream} for Web Streams encoding
 * @see {@link createDecoderStream} for Web Streams decoding
 */

// AsyncGenerator streaming
export { encodeIterable } from "./encode.js";
export { decodeIterable } from "./decode.js";

// Web Streams API
export { createEncoderStream, createDecoderStream } from "./web-streams.js";

// Schema-aware Web Streams
export { createSchemaEncoderStream, createSchemaDecoderStream } from "./schema-streams.js";
