// pattern: Imperative Shell
// @grounds/stream - Streaming encode/decode utilities

// AsyncGenerator streaming
export { encodeIterable, encodeIterableBytes } from "./encode.js";
export { decodeIterable } from "./decode.js";

// Web Streams API
export { createEncoderStream, createDecoderStream } from "./web-streams.js";

// Schema-aware Web Streams
export { createSchemaEncoderStream, createSchemaDecoderStream } from "./schema-streams.js";
