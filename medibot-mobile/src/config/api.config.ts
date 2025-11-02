/**
 * API Configuration
 * =================
 * Centralized API configuration for MediBot backend integration
 */

import Constants from 'expo-constants';
import { createLogger } from '../services/Logger';

const logger = createLogger('ApiConfig');

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Get API Base URL based on environment
 * 
 * DYNAMIC AUTO-DETECTION for any local OS context:
 * - Automatically detects the Metro bundler host IP
 * - Works on any network configuration
 * - Supports simulators, emulators, and physical devices
 * - Mimics remote/online workflow without hardcoded IPs
 * 
 * For production: Use deployed backend URL
 */
const getApiBaseUrl = (): string => {
  // 1. Check environment variables first (highest priority)
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  
  if (envBaseUrl) {
    logger.info('Using API URL from environment variable', { envBaseUrl });
    return envBaseUrl;
  }

  // 2. Production mode - use deployed backend
  if (!__DEV__) {
    const prodUrl = 'https://api.medibot.com';
    logger.info('Using production API URL', { prodUrl });
    return prodUrl;
  }

  // 3. Development mode - Auto-detect backend URL dynamically
  try {
    // Expo provides the debugger host which is the machine running Metro bundler
    // For Expo Go: This is your development machine's IP
    // Format: "192.168.x.x:8081" or "localhost:8081"
    const debuggerHost = Constants.expoConfig?.hostUri || 
                         Constants.manifest?.debuggerHost ||
                         Constants.manifest2?.extra?.expoGo?.debuggerHost;
    
    if (debuggerHost) {
      // Extract just the IP/hostname (remove port)
      const host = debuggerHost.split(':')[0];
      
      // Determine if we're on simulator/emulator or physical device
      const isSimulator = host === 'localhost' || host === '127.0.0.1';
      const isAndroidEmulator = Constants.platform?.android && isSimulator;
      
      let backendUrl: string;
      
      if (isAndroidEmulator) {
        // Android emulator uses special alias for host machine
        backendUrl = 'http://10.0.2.2:3001';
      } else if (isSimulator) {
        // iOS simulator can use localhost
        backendUrl = 'http://localhost:3001';
      } else {
        // Physical device - use the detected host IP
        backendUrl = `http://${host}:3001`;
      }
      
      logger.info('Auto-detected backend URL', { 
        debuggerHost, 
        host, 
        backendUrl,
        isSimulator,
        isAndroidEmulator 
      });
      
      return backendUrl;
    }
  } catch (error) {
    logger.warn('Failed to auto-detect backend URL, using fallback', { error });
  }

  // 4. Fallback - try common local URLs in order
  const fallbackUrl = 'http://192.168.0.158:3001';
  logger.warn('Using fallback backend URL', { fallbackUrl });
  return fallbackUrl;
};

export const API_CONFIG: ApiConfig = {
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    STAFF_LOGIN: '/api/auth/staff/login',
    GUEST: '/api/auth/guest',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
  },
  
  // Users
  USERS: {
    GET: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    UPDATE_PROFILE: (id: string) => `/api/users/${id}/profile`,
    MEDICAL_HISTORY: (id: string) => `/api/users/${id}/medical-history`,
    MEDICATIONS: (id: string) => `/api/users/${id}/medications`,
    ALLERGIES: (id: string) => `/api/users/${id}/allergies`,
  },
  
  // Medical Cases
  CASES: {
    CREATE: '/api/cases',
    LIST: '/api/cases',
    GET: (id: string) => `/api/cases/${id}`,
    UPDATE: (id: string) => `/api/cases/${id}`,
    NOTES: (id: string) => `/api/cases/${id}/notes`,
    TRIAGE: (id: string) => `/api/cases/${id}/triage`,
  },
  
  // Bookings
  BOOKINGS: {
    DOCTORS: '/api/bookings/doctors',
    APPOINTMENTS: '/api/bookings/appointments',
    APPOINTMENT: (id: string) => `/api/bookings/appointments/${id}`,
  },
  
  // Emergency
  EMERGENCY: {
    CREATE: '/api/emergency',
    LIST: '/api/emergency',
    GET: (id: string) => `/api/emergency/${id}`,
    UPDATE: (id: string) => `/api/emergency/${id}`,
    ASSIGN: (id: string, staffId: string) => `/api/emergency/${id}/assign/${staffId}`,
  },
};

// Feature flags for hybrid mode
export const FEATURE_FLAGS = {
  USE_API: true, // Set to false to use only mock data
  FALLBACK_TO_MOCK: true, // Fallback to mock data if API fails
  LOG_API_CALLS: __DEV__, // Log API calls in development
};

// Offline detection timeout
export const OFFLINE_TIMEOUT = 5000; // 5 seconds

// Log API configuration on startup
logger.info('API Configuration Initialized', {
  baseURL: API_CONFIG.baseURL,
  isDevelopment: __DEV__,
  useAPI: FEATURE_FLAGS.USE_API,
  timeout: API_CONFIG.timeout,
  retryAttempts: API_CONFIG.retryAttempts,
});

/**
 * Test backend connectivity on startup
 * This helps diagnose network issues immediately
 */
if (__DEV__) {
  // Test health endpoint after a short delay to allow app initialization
  setTimeout(async () => {
    try {
      logger.info('Testing backend connectivity...', { url: `${API_CONFIG.baseURL}/api/health` });
      
      const response = await fetch(`${API_CONFIG.baseURL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        logger.info('✅ Backend is reachable', { 
          status: response.status,
          url: API_CONFIG.baseURL,
          health: data 
        });
      } else {
        logger.warn('⚠️ Backend returned error status', { 
          status: response.status,
          url: API_CONFIG.baseURL 
        });
      }
    } catch (error: any) {
      logger.error('❌ Cannot reach backend - Network error', { 
        url: API_CONFIG.baseURL,
        error: error.message,
        suggestion: 'Check that backend is running on the correct IP and port'
      });
      
      // Log helpful debugging info
      logger.info('Troubleshooting tips:', {
        tip1: 'Verify backend is running: curl http://localhost:3001/api/health',
        tip2: 'Check IP address matches your machine',
        tip3: 'Ensure phone and computer are on same WiFi network',
        tip4: 'Check firewall allows port 3001',
        currentURL: API_CONFIG.baseURL,
      });
    }
  }, 2000); // Wait 2 seconds after app starts
}
