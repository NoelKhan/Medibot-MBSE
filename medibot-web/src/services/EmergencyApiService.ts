/**
 * Emergency API Service
 * =====================
 * API wrapper for emergency case endpoints
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api.config';
import type { EmergencyCase } from '../types/Booking';

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

export class EmergencyApiService {
  private static instance: EmergencyApiService;

  private constructor() {}

  public static getInstance(): EmergencyApiService {
    if (!EmergencyApiService.instance) {
      EmergencyApiService.instance = new EmergencyApiService();
    }
    return EmergencyApiService.instance;
  }

  /**
   * Create emergency case
   */
  public async createEmergency(data: CreateEmergencyRequest): Promise<EmergencyCase> {
    return apiClient.post<EmergencyCase>(
      API_ENDPOINTS.EMERGENCY.CREATE,
      data
    );
  }

  /**
   * Get all emergencies (optionally filter by user)
   */
  public async getEmergencies(userId?: string): Promise<EmergencyCase[]> {
    const url = userId
      ? `${API_ENDPOINTS.EMERGENCY.LIST}?userId=${userId}`
      : API_ENDPOINTS.EMERGENCY.LIST;

    return apiClient.get<EmergencyCase[]>(url);
  }

  /**
   * Get emergency by ID
   */
  public async getEmergency(emergencyId: string): Promise<EmergencyCase> {
    return apiClient.get<EmergencyCase>(
      API_ENDPOINTS.EMERGENCY.GET(emergencyId)
    );
  }

  /**
   * Update emergency case
   */
  public async updateEmergency(
    emergencyId: string,
    data: UpdateEmergencyRequest
  ): Promise<EmergencyCase> {
    return apiClient.patch<EmergencyCase>(
      API_ENDPOINTS.EMERGENCY.UPDATE(emergencyId),
      data
    );
  }

  /**
   * Assign staff to emergency
   */
  public async assignStaff(emergencyId: string, staffId: string): Promise<EmergencyCase> {
    return apiClient.patch<EmergencyCase>(
      API_ENDPOINTS.EMERGENCY.ASSIGN(emergencyId, staffId)
    );
  }
}

export const emergencyApiService = EmergencyApiService.getInstance();
