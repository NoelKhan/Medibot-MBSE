# MediBot Healthcare App - Production Deployment
# ============================================
# Multi-stage Docker build for React Native app with backend services

# Stage 1: Base Node.js environment
FROM node:18-alpine AS base
WORKDIR /app

# Install system dependencies for React Native and native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    bash \
    curl \
    && npm install -g @expo/cli

# Copy package files for dependency installation
COPY package*.json ./
COPY yarn.lock* ./

# Stage 2: Development environment
FROM base AS development
ENV NODE_ENV=development
ENV EXPO_PUBLIC_ENVIRONMENT=development
ENV EXPO_PUBLIC_MAX_CONCURRENT_USERS=5

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY . .

# Expose development ports
EXPOSE 8081 19000 19001 19002

# Development command
CMD ["npm", "start"]

# Stage 3: Build environment
FROM base AS build
ENV NODE_ENV=production
ENV EXPO_PUBLIC_ENVIRONMENT=production

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 4: Production web server (if using Expo Web)
FROM nginx:alpine AS production-web
ENV NODE_ENV=production

# Copy built assets from build stage
COPY --from=build /app/web-build /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Stage 5: Production API server (Node.js backend)
FROM base AS production-api
ENV NODE_ENV=production
ENV EXPO_PUBLIC_ENVIRONMENT=production

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S medibot -u 1001

# Copy built application from build stage
COPY --from=build --chown=medibot:nodejs /app .

# Switch to non-root user
USER medibot

# Health check for API server
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose API port
EXPOSE 3000

# Start the API server
CMD ["node", "server/index.js"]

# Stage 6: Mobile app build container
FROM base AS mobile-build
ENV NODE_ENV=production
ENV EXPO_PUBLIC_ENVIRONMENT=production

# Install EAS CLI for mobile builds
RUN npm install -g @expo/eas-cli

# Copy source code
COPY . .

# Install dependencies
RUN npm ci

# This stage is used for building mobile apps via EAS
# The actual build process is handled by Expo's build servers
CMD ["eas", "build", "--platform", "all", "--non-interactive"]