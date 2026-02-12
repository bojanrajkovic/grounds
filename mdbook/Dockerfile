# Validator container for mdbook TypeScript example validation
# IMPORTANT: Node version must match mise.toml

# Build stage - install all dependencies
FROM node:24-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 AS builder

WORKDIR /validator

# Copy pre-packaged library tarballs
# These are created by `pnpm pack` during the build process
COPY packages/*.tgz ./packages/

# Copy pre-processed package.json (created from examples/package.json by build script)
COPY validator-package.json ./package.json

# Install dependencies
RUN npm install

# Install @grounds packages from tarballs
RUN for pkg in core schema stream; do \
      npm install ./packages/grounds-${pkg}-*.tgz; \
    done

# Final stage - copy only what we need
FROM node:24-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2

WORKDIR /example

# Copy validator script
COPY validators/validate-in-container.sh ./validate-in-container.sh
RUN chmod +x ./validate-in-container.sh

# Copy the node_modules from builder (includes tsx and all dependencies)
COPY --from=builder /validator/node_modules ./node_modules
