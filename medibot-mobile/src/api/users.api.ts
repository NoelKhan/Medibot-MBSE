/**
 * Users API
 * ==========
 * Pure API calls to user endpoints
 * No business logic - just HTTP calls
 */

import httpClient from './client';
import { PatientUser, MedicalHistory, Medication, Allergy } from '../types/Booking';

// Request Types
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

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<PatientUser> {
  return httpClient.get<PatientUser>(`/api/users/${userId}`);
}

/**
 * Update user basic information
 */
export async function updateUser(userId: string, data: UpdateUserRequest): Promise<PatientUser> {
  return httpClient.patch<PatientUser>(`/api/users/${userId}`, data);
}

/**
 * Update patient profile (medical information)
 */
export async function updateProfile(userId: string, data: UpdateProfileRequest): Promise<any> {
  return httpClient.patch(`/api/users/${userId}/profile`, data);
}

/**
 * Get medical history
 */
export async function getMedicalHistory(userId: string): Promise<MedicalHistory[]> {
  return httpClient.get<MedicalHistory[]>(`/api/users/${userId}/medical-history`);
}

/**
 * Add medical history entry
 */
export async function addMedicalHistory(
  userId: string,
  data: AddMedicalHistoryRequest
): Promise<MedicalHistory> {
  return httpClient.post<MedicalHistory>(`/api/users/${userId}/medical-history`, data);
}

/**
 * Get medications
 */
export async function getMedications(userId: string): Promise<Medication[]> {
  return httpClient.get<Medication[]>(`/api/users/${userId}/medications`);
}

/**
 * Add medication
 */
export async function addMedication(userId: string, data: AddMedicationRequest): Promise<Medication> {
  return httpClient.post<Medication>(`/api/users/${userId}/medications`, data);
}

/**
 * Get allergies
 */
export async function getAllergies(userId: string): Promise<Allergy[]> {
  return httpClient.get<Allergy[]>(`/api/users/${userId}/allergies`);
}

/**
 * Add allergy
 */
export async function addAllergy(userId: string, data: AddAllergyRequest): Promise<Allergy> {
  return httpClient.post<Allergy>(`/api/users/${userId}/allergies`, data);
}

// Export as object for convenience
export const usersApi = {
  getUser,
  updateUser,
  updateProfile,
  getMedicalHistory,
  addMedicalHistory,
  getMedications,
  addMedication,
  getAllergies,
  addAllergy,
};
