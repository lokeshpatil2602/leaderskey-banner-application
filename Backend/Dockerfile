# Multi-stage production Dockerfile for Banner Application Backend

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for build
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript to dist/
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Stage 2: Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Security: run as non-root node user
USER node

# Copy production node_modules and compiled output
COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

CMD ["node", "dist/server.js"]
