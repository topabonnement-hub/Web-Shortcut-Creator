# syntax=docker/dockerfile:1

# -----------------------------------------------------------------------------
# Stage 1: Build stage
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies needed for build)
COPY package.json package-lock.json* bun.lock* ./
RUN npm install

# Copy source code and build client + server bundle
COPY . .
ENV NODE_ENV=production
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Minimal production runner
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --omit=dev

# Copy compiled client assets and bundled server from builder
COPY --from=builder /app/dist ./dist

# Expose standard port for Coolify
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.js"]
