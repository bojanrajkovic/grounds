# Task Completion Checklist

## Before Committing

1. **Format code**

   ```bash
   pnpm format
   ```

2. **Run linter**

   ```bash
   pnpm lint
   ```

3. **Run tests**

   ```bash
   pnpm test
   ```

4. **Type check** (if TypeScript changes)
   ```bash
   pnpm exec tsc --build
   ```

## Git Hooks (Automatic)

The following run automatically on commit/push:

- **pre-commit**: oxfmt + oxlint on staged files
- **commit-msg**: Validates conventional commit format
- **pre-push**: Full test suite

## For Documentation Changes

If docs were modified:

```bash
pnpm docs:build
```

This validates:

- TypeDoc generation succeeds
- mdBook builds successfully
- Example code in docs compiles and runs

## For API Changes

If public API changed:

- Update TSDoc comments with `@group` tags
- Verify TypeDoc output looks correct
- Consider if CHANGELOG needs manual notes

## PR Checklist

- [ ] Tests pass locally
- [ ] Linting passes
- [ ] Formatting is correct
- [ ] Commit messages follow conventional format
- [ ] PR title follows conventional commit format
- [ ] Breaking changes documented (if any)
