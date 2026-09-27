# Multi-stage production Dockerfile for Backend from repository root
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests and tsconfig from Backend directory
COPY Backend/package*.json ./
COPY Backend/tsconfig.json ./

# Clean install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy Backend source code
COPY Backend/src ./src

# Build TypeScript into dist/
RUN npm run build

# Prune devDependencies to keep only production modules
RUN npm prune --production

# Stage 2: Production runtime stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Security: non-root user
USER node

# Copy production package manifests, pruned node_modules, and compiled dist/
COPY --chown=node:node Backend/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/health || exit 1

CMD ["node", "dist/server.js"]
