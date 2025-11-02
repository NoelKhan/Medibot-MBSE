/**
 * MediBot Shared API Client Library
 * ==================================
 * Platform-agnostic API client for mobile and web applications
 */

// Export all types
export * from './types';

// Export HTTP client interface
export * from './utils/httpClient';

// Export API services
export { ChatApiService } from './services/ChatApiService';
export { DoctorsApiService } from './services/DoctorsApiService';
export { AppointmentsApiService } from './services/AppointmentsApiService';
export { AuthApiService } from './services/AuthApiService';

// Export a factory function to create all services
import type { HttpClient } from './utils/httpClient';
import { ChatApiService } from './services/ChatApiService';
import { DoctorsApiService } from './services/DoctorsApiService';
import { AppointmentsApiService } from './services/AppointmentsApiService';
import { AuthApiService } from './services/AuthApiService';

export interface MediBotApiClient {
  chat: ChatApiService;
  doctors: DoctorsApiService;
  appointments: AppointmentsApiService;
  auth: AuthApiService;
}

/**
 * Create a MediBot API client with all services
 * @param httpClient - Platform-specific HTTP client implementation
 * @returns Object containing all API services
 */
export function createMediBotClient(httpClient: HttpClient): MediBotApiClient {
  return {
    chat: new ChatApiService(httpClient),
    doctors: new DoctorsApiService(httpClient),
    appointments: new AppointmentsApiService(httpClient),
    auth: new AuthApiService(httpClient),
  };
}
