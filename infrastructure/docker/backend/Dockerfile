# ============================================
# MediBot Backend - Dockerfile
# ============================================
# Multi-stage Docker build for MediBot Backend
# Built from root context: docker build -f infrastructure/docker/backend/Dockerfile -t medibot-backend .
# ===========================================
# Stage 1: Base - Install dependencies
# Stage 2: Development - For local development with hot-reload
# Stage 3: Builder - Build for production
# Stage 4: Production - Minimal runtime image

# ============================================
# Stage 1: Base
# ============================================
FROM node:22-alpine AS base

# Install build dependencies
RUN apk add --no-cache python3 make g++ postgresql-client curl

WORKDIR /app

# ============================================
# Stage 2: Development
# ============================================
FROM base AS development

# Copy package files from medibot-backend directory
COPY medibot-backend/package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code from medibot-backend directory
COPY medibot-backend/ ./

# Expose port
EXPOSE 3001

# Run in development mode with hot-reload
CMD ["npm", "run", "start:dev"]

# ============================================
# Stage 3: Builder
# ============================================
FROM base AS builder

# Copy package files from medibot-backend directory
COPY medibot-backend/package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code from medibot-backend directory
COPY medibot-backend/ ./

# Build the application
RUN npm run build

# ============================================
# Stage 4: Production
# ============================================
FROM node:22-alpine AS production

# Install runtime dependencies only
RUN apk add --no-cache postgresql-client curl

WORKDIR /app

# Copy package files from medibot-backend directory
COPY medibot-backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/migrations ./src/database/migrations

# Create non-root user
RUN addgroup -g 1001 -S node-user && \
    adduser -S node-user -u 1001 && \
    chown -R node-user:node-user /app

# Switch to non-root user
USER node-user

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "dist/main"]
