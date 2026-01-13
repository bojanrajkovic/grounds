# Grounds - Project Overview

## Purpose

TypeScript implementation of [Relish](https://github.com/alex/relish), a binary serialization format. Provides type-safe encoding/decoding with full TypeScript inference.

## Tech Stack

- **Language**: TypeScript (strict mode, ES modules)
- **Runtime**: Node.js 24 LTS
- **Package Manager**: pnpm 10.x (monorepo with workspaces)
- **Testing**: Vitest + fast-check (property-based testing)
- **Linting**: oxlint
- **Formatting**: oxfmt (Prettier-compatible)
- **Git Hooks**: Husky + lint-staged
- **Releases**: Changesets (automated via CI)
- **Documentation**: mdBook + TypeDoc

## Monorepo Structure

```
packages/
├── core/       # Low-level T[L]V encoding (@grounds/core)
├── schema/     # TypeBox integration (@grounds/schema)
├── stream/     # Streaming utilities (@grounds/stream)
└── test-utils/ # Shared test helpers (private)
examples/       # Runnable usage examples
docs/           # mdBook documentation
mdbook/         # mdBook configuration
scripts/        # Build/release scripts
```

## Key Dependencies

- `neverthrow`: Result types for error handling (no exceptions)
- `@sinclair/typebox`: Schema definitions with type inference
- `luxon`: DateTime handling in schema package
