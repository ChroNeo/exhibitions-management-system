# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

ENV PNPM_HOME=/usr/local/share/pnpm \
    PNPM_STORE_DIR=/app/.pnpm-store

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate \
 && pnpm config set store-dir ${PNPM_STORE_DIR} \
 && pnpm config set node-linker pnpm

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/package.json

# Install ALL dependencies (including dev for build)
RUN pnpm --dir apps/backend install --frozen-lockfile

# Copy backend source
COPY apps/backend ./apps/backend

# Build TypeScript → JavaScript
RUN pnpm --dir apps/backend run build

# ---- Stage 2: Production ----
FROM node:20-alpine AS production

ENV NODE_ENV=production \
    PNPM_HOME=/usr/local/share/pnpm \
    PNPM_STORE_DIR=/app/.pnpm-store

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate \
 && pnpm config set store-dir ${PNPM_STORE_DIR} \
 && pnpm config set node-linker pnpm

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/package.json

# Install production dependencies only
RUN pnpm --dir apps/backend install --frozen-lockfile --prod

# Copy compiled output from builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Copy static assets (fonts for PDF generation, etc.)
COPY apps/backend/assets ./apps/backend/assets

# Create uploads directory
RUN mkdir -p /app/apps/backend/uploads

EXPOSE 3001

# Run the compiled JS (working directory must be apps/backend for uploads path)
WORKDIR /app/apps/backend
CMD ["node", "dist/server.js"]
