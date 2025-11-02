/**
 * API Configuration for MediBot Web Application
 * =============================================
 * Centralized configuration for all backend API endpoints
 */

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  endpoints: {
    auth: {
      login: string;
      register: string;
      logout: string;
      refresh: string;
      profile: string;
    };
    chat: {
      conversations: string;
      messages: string;
      analyze: string;
    };
    doctors: {
      search: string;
      specialties: string;
      availability: string;
    };
    appointments: {
      create: string;
      list: string;
      cancel: string;
    };
    cases: {
      list: string;
      create: string;
      details: string;
      timeline: string;
      assign: string;
    };
    reminders: {
      list: string;
      create: string;
      update: string;
      delete: string;
    };
  };
}

const isDevelopment = import.meta.env.MODE === 'development';

export const API_CONFIG: ApiConfig = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000,
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      profile: '/auth/profile',
    },
    chat: {
      conversations: '/chat/conversations',
      messages: '/chat/messages',
      analyze: '/chat/analyze',
    },
    doctors: {
      search: '/doctors/search',
      specialties: '/doctors/specialties',
      availability: '/doctors/:id/availability',
    },
    appointments: {
      create: '/appointments',
      list: '/appointments',
      cancel: '/appointments/:id/cancel',
    },
    cases: {
      list: '/cases',
      create: '/cases',
      details: '/cases/:id',
      timeline: '/cases/:id/timeline',
      assign: '/cases/:id/assign',
    },
    reminders: {
      list: '/reminders',
      create: '/reminders',
      update: '/reminders/:id',
      delete: '/reminders/:id',
    },
  },
};

// Helper to replace URL parameters
export const buildEndpoint = (endpoint: string, params: Record<string, string>): string => {
  let url = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  return url;
};

// Log API configuration in development
if (isDevelopment) {
  console.log('🔧 API Configuration:', {
    baseURL: API_CONFIG.baseURL,
    mode: import.meta.env.MODE,
  });
}

// Export endpoints in the format expected by legacy code
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: API_CONFIG.endpoints.auth.register,
    LOGIN: API_CONFIG.endpoints.auth.login,
    STAFF_LOGIN: API_CONFIG.endpoints.auth.login, // Same endpoint for now
    GUEST: API_CONFIG.endpoints.auth.login, // Same endpoint for now
    REFRESH: API_CONFIG.endpoints.auth.refresh,
    ME: API_CONFIG.endpoints.auth.profile,
  },
  DOCTORS: {
    SEARCH: API_CONFIG.endpoints.doctors.search,
    SPECIALTIES: API_CONFIG.endpoints.doctors.specialties,
    AVAILABILITY: API_CONFIG.endpoints.doctors.availability,
  },
  APPOINTMENTS: API_CONFIG.endpoints.appointments,
  CASES: {
    CREATE: API_CONFIG.endpoints.cases.create,
    LIST: API_CONFIG.endpoints.cases.list,
    GET: (id: string) => `/cases/${id}`,
    UPDATE: (id: string) => `/cases/${id}`,
    NOTES: (id: string) => `/cases/${id}/notes`,
    TRIAGE: (id: string) => `/cases/${id}/triage`,
    list: API_CONFIG.endpoints.cases.list,
    create: API_CONFIG.endpoints.cases.create,
    details: API_CONFIG.endpoints.cases.details,
    timeline: API_CONFIG.endpoints.cases.timeline,
    assign: API_CONFIG.endpoints.cases.assign,
  },
  BOOKINGS: {
    DOCTORS: '/doctors',
    APPOINTMENTS: '/appointments',
    APPOINTMENT: (id: string) => `/appointments/${id}`,
    create: API_CONFIG.endpoints.appointments.create,
    list: API_CONFIG.endpoints.appointments.list,
    cancel: API_CONFIG.endpoints.appointments.cancel,
  },
  EMERGENCY: {
    CREATE: '/emergency/create',
    LIST: '/emergency/list',
    GET: (id: string) => `/emergency/${id}`,
    UPDATE: (id: string) => `/emergency/${id}`,
    ASSIGN: (id: string, staffId: string) => `/emergency/${id}/assign/${staffId}`,
  },
};
