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
COPY apps/frontend/package.json ./apps/frontend/package.json

# Install ALL dependencies (including dev for build)
RUN pnpm --dir apps/frontend install --frozen-lockfile

# Copy frontend source
COPY apps/frontend ./apps/frontend

# Build args for Vite env variables (baked into the bundle at build time)
ARG VITE_API_URL
ARG VITE_BASE
ARG VITE_LIFF_REGISTRATION
ARG VITE_LIFF_TICKET
ARG VITE_LIFF_SURVEY
ARG VITE_LIFF_CERTIFICATE
ARG VITE_LIFF_EXHIBITION
ARG VITE_LIFF_NEWS
ARG VITE_LIFF_MOCK=false

ENV VITE_API_URL=${VITE_API_URL} \
    VITE_BASE=${VITE_BASE} \
    VITE_LIFF_REGISTRATION=${VITE_LIFF_REGISTRATION} \
    VITE_LIFF_TICKET=${VITE_LIFF_TICKET} \
    VITE_LIFF_SURVEY=${VITE_LIFF_SURVEY} \
    VITE_LIFF_CERTIFICATE=${VITE_LIFF_CERTIFICATE} \
    VITE_LIFF_EXHIBITION=${VITE_LIFF_EXHIBITION} \
    VITE_LIFF_NEWS=${VITE_LIFF_NEWS} \
    VITE_LIFF_MOCK=${VITE_LIFF_MOCK}

# Build production bundle
RUN pnpm --dir apps/frontend run build

# ---- Stage 2: Serve with Nginx ----
FROM nginx:alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY infra/docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
