/**
 * FEATURE FLAGS & CONFIGURATION
 * ==============================
 * Central configuration for app behavior, debugging, and migration strategies.
 * 
 * Toggle flags here to test different behaviors without code changes.
 * Developer-friendly: All flags documented and easy to understand.
 */

import { createLogger } from '../services/Logger';

const logger = createLogger('FeatureFlags');

// Get backend URL from environment or use default
const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.158:3000';

/**
 * API & Backend Configuration
 */
export const API_CONFIG = {
  // Backend connection settings
  BACKEND_URL: BACKEND_BASE_URL,
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 2,
  
  /**
   * Mock Mode Configuration
   * When enabled, falls back to local mock data if backend fails
   * Useful for: Development, testing, offline mode, backend issues
   */
  MOCK_MODE: {
    AUTH: true,        // Use mock authentication if API fails
    BOOKINGS: true,    // Use mock bookings if API fails
    REMINDERS: true,   // Use mock reminders if API fails
    EMERGENCY: true,   // Use mock emergency services if API fails
  },
  
  /**
   * Debug Features (Development Only)
   * These features help developers debug issues
   * Automatically disabled in production builds
   */
  DEBUG: {
    LOG_API_CALLS: true,       // Console log all API requests
    LOG_API_RESPONSES: true,   // Console log all API responses
    LOG_ERRORS: true,          // Console log all errors
    LOG_NAVIGATION: false,     // Console log navigation events
    SHOW_ERROR_ALERTS: false,  // Show alert dialogs on API errors (can be annoying)
    ENABLE_DEV_PANEL: true,    // Show developer debug panel (dev only)
  },
};

/**
 * User Migration Configuration
 * Controls how existing users are migrated to the new role-based system
 */
export const MIGRATION_CONFIG = {
  /**
   * OPTION A: Smart Routing (RECOMMENDED - Default)
   * - Seamless experience for existing users
   * - Auto-detects user role and routes appropriately
   * - New users see role selection screen
   * - No forced re-login
   * 
   * OPTION B: Strict Mode (Testing)
   * - Forces ALL users to choose role on first launch
   * - Clean break, clear separation
   * - Good for major version updates
   * - More disruptive but clearer
   */
  FORCE_ROLE_SELECTION: true, // false = Option A (Smart), true = Option B (Strict)
  
  /**
   * Auto-assign roles based on User.role field
   * If true, existing authenticated users are automatically routed
   * based on their role without showing role selection
   */
  AUTO_ROUTE_BY_ROLE: true,
  
  /**
   * Allow users to switch roles via settings
   * If true, users can change between patient/staff portals
   * If false, role is locked after selection
   */
  ALLOW_ROLE_SWITCH: true,
  
  /**
   * Remember last role choice
   * If true, app remembers user's last role selection
   * If false, asks for role every time
   */
  REMEMBER_ROLE_PREFERENCE: true,
};

/**
 * UI/UX Configuration
 */
export const UI_CONFIG = {
  /**
   * Banner Collapse Settings (Staff Dashboard)
   */
  BANNER: {
    COLLAPSE_THRESHOLD: 50,  // Pixels scrolled before banner collapses
    ANIMATION_DURATION: 200, // Milliseconds for collapse animation
    EXPANDED_HEIGHT: 80,     // Height when expanded (mobile)
    COLLAPSED_HEIGHT: 40,    // Height when collapsed (mobile)
    WEB_HEIGHT: 60,          // Height on web (always expanded)
  },
  
  /**
   * Theme Settings
   */
  THEME: {
    DEFAULT_THEME: 'auto',   // 'light', 'dark', or 'auto'
    RESPECT_SYSTEM: true,    // Follow system theme if 'auto'
  },
};

/**
 * Feature Toggles
 * Enable/disable specific features for testing or gradual rollout
 */
export const FEATURES = {
  PATIENT_TRIAGE_CHAT: true,    // Enable medical staff triage chat
  EMERGENCY_DIRECT_CALL: true,  // Enable direct 000 calling from chat
  CALENDAR_SYNC: true,           // Enable calendar integration
  SMS_REMINDERS: true,           // Enable SMS reminder options
  EMAIL_REMINDERS: true,         // Enable email reminder options
  PUSH_NOTIFICATIONS: true,      // Enable push notifications
  BIOMETRIC_AUTH: false,         // Enable fingerprint/face ID (future)
};

/**
 * Helper Functions
 */

/**
 * Check if backend is available and responding
 * @returns Promise<boolean> - true if backend is healthy
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s health check

    const response = await fetch(`${API_CONFIG.BACKEND_URL}/health`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const isHealthy = response.ok;
    
    if (API_CONFIG.DEBUG.LOG_API_CALLS) {
      logger.info('Backend health check', { isHealthy, status: isHealthy ? 'ONLINE' : 'OFFLINE' });
    }
    
    return isHealthy;
  } catch (error) {
    if (API_CONFIG.DEBUG.LOG_ERRORS) {
      logger.warn('Backend unavailable, using mock mode');
    }
    return false;
  }
};

/**
 * Get current environment
 */
export const getEnvironment = (): 'development' | 'production' => {
  return __DEV__ ? 'development' : 'production';
};

/**
 * Check if debug features should be enabled
 */
export const isDebugEnabled = (): boolean => {
  return getEnvironment() === 'development' && API_CONFIG.DEBUG.ENABLE_DEV_PANEL;
};

/**
 * Log API call (respects DEBUG settings)
 */
export const logApiCall = (endpoint: string, method: string, data?: any) => {
  if (API_CONFIG.DEBUG.LOG_API_CALLS) {
    logger.info('API call', { endpoint, method, data: data || undefined });
  }
};

/**
 * Log API response (respects DEBUG settings)
 */
export const logApiResponse = (endpoint: string, status: number, data?: any) => {
  if (API_CONFIG.DEBUG.LOG_API_RESPONSES) {
    const isSuccess = status >= 200 && status < 300;
    logger.info('API response', { endpoint, status, isSuccess, data: data || undefined });
  }
};

/**
 * Log error (respects DEBUG settings)
 */
export const logError = (context: string, error: any) => {
  if (API_CONFIG.DEBUG.LOG_ERRORS) {
    logger.error('Error occurred', { context, error });
  }
};

/**
 * Export all configs as default for easy import
 */
export default {
  API_CONFIG,
  MIGRATION_CONFIG,
  UI_CONFIG,
  FEATURES,
  checkBackendHealth,
  getEnvironment,
  isDebugEnabled,
  logApiCall,
  logApiResponse,
  logError,
};
