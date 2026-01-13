# Suggested Commands

## Development

```bash
pnpm install               # Install dependencies
pnpm build                 # Build all packages
pnpm test                  # Run all tests
pnpm test:watch            # Run tests in watch mode
pnpm lint                  # Run oxlint
pnpm format                # Format all files with oxfmt
pnpm format:check          # Check formatting (CI mode)
```

## Package-Specific

```bash
pnpm --filter @grounds/core build   # Build specific package
pnpm --filter @grounds/core test    # Test specific package
```

## Documentation

```bash
pnpm docs:build            # Build full documentation (packages + TypeDoc + mdBook)
pnpm docs:serve            # Serve docs locally
pnpm docs:generate-api     # Generate TypeDoc API reference only
pnpm docs:build-validator  # Build Docker container for example validation
```

## Release (typically automated)

```bash
pnpm changeset             # Create changeset manually (rarely needed)
pnpm release               # Build and publish packages
```

## Git

```bash
git status                 # Check working tree status
git log --oneline -10      # Recent commits
git diff main              # Compare to main branch
```

## Running Examples

```bash
pnpm exec tsx examples/core/encode-roundtrip.ts
pnpm exec tsx examples/schema/using-codecs.ts
```
