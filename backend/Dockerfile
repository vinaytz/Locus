# --- Build stage ----------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# OpenSSL is required by Prisma at install/generate time on Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Drop dev deps for a leaner runtime image
RUN npm prune --production

# --- Runtime stage --------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl tini

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
COPY tsconfig.json ./
# Install ts-node globally so `npm run seed` works inside the container.
RUN npm install -g ts-node@10.9.2 typescript@5.5.4

EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
# Apply pending migrations on every start, then boot the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
