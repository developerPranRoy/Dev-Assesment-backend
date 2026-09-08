
FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 --ingroup nodejs appuser

ENV NODE_ENV=production
ENV SERVICE_NAME=all

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --prefer-offline && \
    npm cache clean --force

COPY --from=build /app/dist ./dist

COPY --from=build /app/node_modules/.prisma      ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma      ./node_modules/@prisma

COPY prisma ./prisma

USER appuser

EXPOSE 10000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-10000}/health || exit 1

CMD ["sh", "-c", \
  "if [ \"$SERVICE_NAME\" = \"worker\" ]; then \
     node dist/worker.js; \
   else \
     node dist/server.js; \
   fi"]
