FROM oven/bun:1.2.2-alpine as base

FROM base as deps
WORKDIR /app
# Modified to use package.json only or include bun.lockb if it exists
COPY package.json bun.lockb* ./
# Bun automatically handles peer dependencies better than npm
RUN bun install --frozen-lockfile

FROM deps as builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base as runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
CMD ["bun", "server.js"]