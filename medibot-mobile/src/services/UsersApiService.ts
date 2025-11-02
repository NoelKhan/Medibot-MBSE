/**
 * Users API Service
 * =================
 * API wrapper for user profile and medical records endpoints
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '../config/api.config';
import { PatientUser, MedicalHistory, Medication, Allergy } from '../types/Booking';

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
}

export interface UpdateProfileRequest {
  bloodType?: string;
  height?: number;
  weight?: number;
  dateOfBirth?: string;
}

export interface AddMedicalHistoryRequest {
  condition: string;
  diagnosedDate: string;
  status: 'active' | 'resolved' | 'managed';
  notes?: string;
}

export interface AddMedicationRequest {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy?: string;
}

export interface AddAllergyRequest {
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export class UsersApiService {
  private static instance: UsersApiService;

  private constructor() {}

  public static getInstance(): UsersApiService {
    if (!UsersApiService.instance) {
      UsersApiService.instance = new UsersApiService();
    }
    return UsersApiService.instance;
  }

  /**
   * Get user by ID
   */
  public async getUser(userId: string): Promise<PatientUser> {
    return apiClient.get<PatientUser>(API_ENDPOINTS.USERS.GET(userId));
  }

  /**
   * Update user
   */
  public async updateUser(userId: string, data: UpdateUserRequest): Promise<PatientUser> {
    return apiClient.patch<PatientUser>(API_ENDPOINTS.USERS.UPDATE(userId), data);
  }

  /**
   * Update patient profile
   */
  public async updateProfile(userId: string, data: UpdateProfileRequest): Promise<any> {
    return apiClient.patch(API_ENDPOINTS.USERS.UPDATE_PROFILE(userId), data);
  }

  /**
   * Add medical history
   */
  public async addMedicalHistory(userId: string, data: AddMedicalHistoryRequest): Promise<MedicalHistory> {
    return apiClient.post<MedicalHistory>(
      API_ENDPOINTS.USERS.MEDICAL_HISTORY(userId),
      data
    );
  }

  /**
   * Get medical history
   */
  public async getMedicalHistory(userId: string): Promise<MedicalHistory[]> {
    return apiClient.get<MedicalHistory[]>(
      API_ENDPOINTS.USERS.MEDICAL_HISTORY(userId)
    );
  }

  /**
   * Add medication
   */
  public async addMedication(userId: string, data: AddMedicationRequest): Promise<Medication> {
    return apiClient.post<Medication>(
      API_ENDPOINTS.USERS.MEDICATIONS(userId),
      data
    );
  }

  /**
   * Get medications
   */
  public async getMedications(userId: string): Promise<Medication[]> {
    return apiClient.get<Medication[]>(
      API_ENDPOINTS.USERS.MEDICATIONS(userId)
    );
  }

  /**
   * Add allergy
   */
  public async addAllergy(userId: string, data: AddAllergyRequest): Promise<Allergy> {
    return apiClient.post<Allergy>(
      API_ENDPOINTS.USERS.ALLERGIES(userId),
      data
    );
  }

  /**
   * Get allergies
   */
  public async getAllergies(userId: string): Promise<Allergy[]> {
    return apiClient.get<Allergy[]>(
      API_ENDPOINTS.USERS.ALLERGIES(userId)
    );
  }
}

export const usersApiService = UsersApiService.getInstance();
