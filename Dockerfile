# =============================================================================
#  Multi-stage Dockerfile — optimised for production
#
#  Stages:
#    deps    — install ALL npm dependencies (cached layer)
#    build   — compile TypeScript + generate Prisma client
#    runner  — lean production image (no dev deps, no source files)
# =============================================================================

# ── Stage 1: install ALL deps ──────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install OS-level build tools needed by some native addons (bcrypt, etc.)
RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client BEFORE tsc so generated types are available
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# ── Stage 3: production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 --ingroup nodejs appuser

ENV NODE_ENV=production
ENV SERVICE_NAME=all

# Only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --prefer-offline && \
    npm cache clean --force

# Copy compiled output
COPY --from=build /app/dist ./dist

# Copy Prisma client (generated — not in source)
COPY --from=build /app/node_modules/.prisma      ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma      ./node_modules/@prisma

# Copy Prisma schema (needed for migrate deploy at runtime via DIRECT_DATABASE_URL)
COPY prisma ./prisma

# Switch to non-root
USER appuser

EXPOSE 10000

# Health-check so Docker Swarm / Compose knows when the container is ready
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-10000}/health || exit 1

# The SERVICE_NAME env var selects which routes / worker to start
CMD ["sh", "-c", \
  "if [ \"$SERVICE_NAME\" = \"worker\" ]; then \
     node dist/worker.js; \
   else \
     node dist/server.js; \
   fi"]
