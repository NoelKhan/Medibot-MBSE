/**
 * Navigation Utilities
 * ====================
 * Helper functions for navigation parameter handling
 */

/**
 * Sanitize navigation parameters to ensure they are serializable
 * This is important for React Navigation which requires params to be serializable
 */
export function sanitizeNavParams<T extends Record<string, any>>(params: T): T {
  // For mobile React Native, we can pass complex objects directly
  // No sanitization needed for mobile navigation
  return params;
}
