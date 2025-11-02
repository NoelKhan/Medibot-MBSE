/**
 * Cases API
 * ==========
 * Pure API calls to medical case endpoints
 * No business logic - just HTTP calls
 */

import httpClient from './client';
import { MedicalCase, CaseNote, TriageAssessment } from '../types/Booking';

// Request Types
export interface CreateCaseRequest {
  patientId: string;
  chiefComplaint: string;
  symptoms: string[];
  severity: 1 | 2 | 3 | 4 | 5;
}

export interface UpdateCaseRequest {
  status?: 'open' | 'in-progress' | 'waiting-patient' | 'resolved' | 'closed';
  assignedStaffId?: string;
}

export interface AddCaseNoteRequest {
  content: string;
  noteType?: 'general' | 'clinical' | 'administrative';
  isVisibleToPatient?: boolean;
}

export interface CreateTriageRequest {
  esiLevel: 1 | 2 | 3 | 4 | 5;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  assessmentNotes?: string;
}

/**
 * Create new medical case
 */
export async function createCase(data: CreateCaseRequest): Promise<MedicalCase> {
  return httpClient.post<MedicalCase>('/api/cases', data);
}

/**
 * Get all cases (optionally filter by patient)
 */
export async function getCases(patientId?: string): Promise<MedicalCase[]> {
  const url = patientId ? `/api/cases?patientId=${patientId}` : '/api/cases';
  return httpClient.get<MedicalCase[]>(url);
}

/**
 * Get case by ID
 */
export async function getCase(caseId: string): Promise<MedicalCase> {
  return httpClient.get<MedicalCase>(`/api/cases/${caseId}`);
}

/**
 * Update case
 */
export async function updateCase(caseId: string, data: UpdateCaseRequest): Promise<MedicalCase> {
  return httpClient.patch<MedicalCase>(`/api/cases/${caseId}`, data);
}

/**
 * Get case notes
 */
export async function getNotes(caseId: string): Promise<CaseNote[]> {
  return httpClient.get<CaseNote[]>(`/api/cases/${caseId}/notes`);
}

/**
 * Add case note
 */
export async function addNote(caseId: string, data: AddCaseNoteRequest): Promise<CaseNote> {
  return httpClient.post<CaseNote>(`/api/cases/${caseId}/notes`, data);
}

/**
 * Create triage assessment
 */
export async function createTriage(
  caseId: string,
  data: CreateTriageRequest
): Promise<TriageAssessment> {
  return httpClient.post<TriageAssessment>(`/api/cases/${caseId}/triage`, data);
}

// Export as object for convenience
export const casesApi = {
  createCase,
  getCases,
  getCase,
  updateCase,
  getNotes,
  addNote,
  createTriage,
};
