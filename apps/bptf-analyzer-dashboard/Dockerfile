FROM node:23-alpine as base

FROM base as deps
WORKDIR /app
COPY package.json package-lock.json ./
# Use legacy-peer-deps to resolve the date-fns/react-day-picker conflict
RUN npm install --frozen-lockfile --legacy-peer-deps

FROM deps as builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base as runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
CMD ["node",  "server.js"]