/**
 * JWT Authentication Configuration
 * =================================
 * JWT token settings for user and staff authentication
 */

import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  // Access token (short-lived)
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRATION || '1h',

  // Refresh token (long-lived)
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-token-key',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',

  // Token options
  issuer: 'medibot-backend',
  audience: 'medibot-app',
}));
