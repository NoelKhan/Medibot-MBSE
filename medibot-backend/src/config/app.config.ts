/**
 * Application Configuration
 * =========================
 * General app settings and feature flags
 */

import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api',

  // CORS (Allow Expo Go and web app)
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CORS_ORIGIN?.split(',') || []
      : true, // Allow all origins in development
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Rate Limiting
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 900, // 15 minutes
    limit: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // 100 requests
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    ttl: parseInt(process.env.REDIS_TTL, 10) || 900, // 15 minutes
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',

  // Feature Flags (for prototype)
  features: {
    websocket: process.env.ENABLE_WEBSOCKET === 'true',
    fhirFormat: process.env.ENABLE_FHIR_FORMAT === 'true',
    sampleData: process.env.LOAD_SAMPLE_DATA === 'true',
  },

  // AWS Configuration (for future deployment)
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || '',
  },

  // Local Network (for Expo Go testing)
  localIp: process.env.LOCAL_IP || 'localhost',
}));
