/**
 * Emergency API
 * ==============
 * Pure API calls to emergency case endpoints
 * No business logic - just HTTP calls
 */

import httpClient from './client';
import { EmergencyCase } from '../types/Booking';

// Request Types
export interface CreateEmergencyRequest {
  userId: string;
  emergencyType: string;
  severity: 1 | 2 | 3 | 4 | 5;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface UpdateEmergencyRequest {
  status?: 'pending' | 'assigned' | 'en-route' | 'on-scene' | 'resolved' | 'cancelled';
  assignedStaffId?: string;
  notes?: string;
}

/**
 * Create emergency case
 */
export async function createEmergency(data: CreateEmergencyRequest): Promise<EmergencyCase> {
  return httpClient.post<EmergencyCase>('/api/emergency', data);
}

/**
 * Get all emergencies (optionally filter by user)
 */
export async function getEmergencies(userId?: string): Promise<EmergencyCase[]> {
  const url = userId ? `/api/emergency?userId=${userId}` : '/api/emergency';
  return httpClient.get<EmergencyCase[]>(url);
}

/**
 * Get emergency by ID
 */
export async function getEmergency(emergencyId: string): Promise<EmergencyCase> {
  return httpClient.get<EmergencyCase>(`/api/emergency/${emergencyId}`);
}

/**
 * Update emergency case
 */
export async function updateEmergency(
  emergencyId: string,
  data: UpdateEmergencyRequest
): Promise<EmergencyCase> {
  return httpClient.patch<EmergencyCase>(`/api/emergency/${emergencyId}`, data);
}

/**
 * Assign staff to emergency
 */
export async function assignStaff(emergencyId: string, staffId: string): Promise<EmergencyCase> {
  return httpClient.patch<EmergencyCase>(`/api/emergency/${emergencyId}/assign/${staffId}`);
}

// Export as object for convenience
export const emergencyApi = {
  createEmergency,
  getEmergencies,
  getEmergency,
  updateEmergency,
  assignStaff,
};
