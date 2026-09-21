# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS base
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* prisma.config.* ./
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/db?sslmode=disable"
ENV DATABASE_URL=$DATABASE_URL NEXT_TELEMETRY_DISABLED=1
ENV JWT_ACCESS_SECRET="build-only-placeholder-secret-32-characters-min"
ENV ADMIN_JWT_SECRET="build-only-placeholder-admin-secret-32-chars-min"
ENV BANK_TRANSFER_BANK_NAME="Commercial Bank"
ENV BANK_TRANSFER_ACCOUNT_NAME="Celiz LK (Pvt) Ltd"
ENV BANK_TRANSFER_ACCOUNT_NUMBER="1000-2345-6789"
ENV BANK_TRANSFER_BRANCH="Colombo Main"
RUN npx prisma generate
RUN npm run build

FROM builder AS migrator
CMD ["npx", "prisma", "migrate", "deploy"]

FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]