# Multi-stage Dockerfile for React Web App
# ==========================================

# This Dockerfile should be built from the ROOT directory:
# docker build -f infrastructure/docker/web/Dockerfile -t medibot-web .

# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /workspace

# Copy package files first for better caching
COPY medibot-web/package*.json ./medibot-web/

# Install web app dependencies
WORKDIR /workspace/medibot-web
RUN npm ci

# Copy web app source code
COPY medibot-web/ ./

# Build the web application (only for production stage)
# Development stage will use npm run dev

# Stage 2: Development (for docker-compose)
FROM node:22-alpine AS development

WORKDIR /workspace/medibot-web

# Copy package files
COPY medibot-web/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY medibot-web/ ./

# Expose Vite dev server port
EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Stage 3: Production build
FROM builder AS production-builder

# Now build for production
RUN npm run build

# Stage 4: Production with nginx
FROM nginx:alpine AS production

# Copy built files from production-builder
COPY --from=production-builder /workspace/medibot-web/dist /usr/share/nginx/html

# Copy custom nginx configuration from infrastructure
COPY infrastructure/docker/web/nginx.conf /etc/nginx/conf.d/default.conf

# Create a non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

USER nginx-user

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
