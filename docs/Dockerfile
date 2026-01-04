# Validator container for mdbook TypeScript example validation
# IMPORTANT: Node version must match mise.toml
FROM node:24-slim

WORKDIR /validator

# Copy pre-packaged library tarballs
# These are created by `npm pack` during the build process
COPY packages/*.tgz ./packages/

# Install tsx globally for running TypeScript
RUN npm install -g tsx

# Install peer dependencies that examples need
RUN npm install -g @sinclair/typebox luxon neverthrow

# Create directory for example execution
RUN mkdir -p /example

WORKDIR /example
