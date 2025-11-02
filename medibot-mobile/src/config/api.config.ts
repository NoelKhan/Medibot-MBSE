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
 * For Expo Go development:
 * - iOS simulator: Use localhost or 127.0.0.1
 * - Android emulator: Use 10.0.2.2 (Android's special alias for host machine)
 * - Physical devices: Use your computer's local network IP (e.g., 192.168.x.x)
 * 
 * For production: Use deployed backend URL
 */
const getApiBaseUrl = (): string => {
  // Check environment variables first
  const envBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 
                     process.env.EXPO_PUBLIC_API_BASE_URL;
  
  if (envBaseUrl) {
    return envBaseUrl;
  }

  // Development defaults based on platform
  const { platform } = Constants;
  
  if (__DEV__) {
    // For physical devices and Expo Go, use your computer's local IP
    const LOCAL_IP = '192.168.0.158';
    
    // Always use local IP for Expo Go on physical devices
    // Comment out the return below if using simulator/emulator
    return `http://${LOCAL_IP}:3000`;
    
    // Uncomment below ONLY if using iOS Simulator
    // return 'http://localhost:3000';
    
    // Uncomment below ONLY if using Android Emulator
    // return 'http://10.0.2.2:3000';
  }

  // Production - replace with your deployed backend URL
  return 'https://api.medibot.com';
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

logger.info('API Configuration', {
  baseURL: API_CONFIG.baseURL,
  isDevelopment: __DEV__,
  useAPI: FEATURE_FLAGS.USE_API,
});
