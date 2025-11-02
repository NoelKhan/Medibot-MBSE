/**
 * Medical Cases API Service
 * =========================
 * API wrapper for medical case management endpoints
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api.config';
import type { MedicalCase, CaseNote, TriageAssessment } from '../types/Booking';

export interface CreateCaseRequest {
  patientId: string;
  chiefComplaint: string;
  symptoms: string[];
  severity: 1 | 2 | 3 | 4 | 5;
}

export interface UpdateCaseRequest {
  status?: 'open' | 'in-progress' | 'resolved' | 'closed';
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

export class CasesApiService {
  private static instance: CasesApiService;

  private constructor() {}

  public static getInstance(): CasesApiService {
    if (!CasesApiService.instance) {
      CasesApiService.instance = new CasesApiService();
    }
    return CasesApiService.instance;
  }

  /**
   * Create new medical case
   */
  public async createCase(data: CreateCaseRequest): Promise<MedicalCase> {
    return apiClient.post<MedicalCase>(
      API_ENDPOINTS.CASES.CREATE,
      data
    );
  }

  /**
   * Get all cases (optionally filter by patient)
   */
  public async getCases(patientId?: string): Promise<MedicalCase[]> {
    const url = patientId
      ? `${API_ENDPOINTS.CASES.LIST}?patientId=${patientId}`
      : API_ENDPOINTS.CASES.LIST;

    return apiClient.get<MedicalCase[]>(url);
  }

  /**
   * Get case by ID
   */
  public async getCase(caseId: string): Promise<MedicalCase> {
    return apiClient.get<MedicalCase>(
      API_ENDPOINTS.CASES.GET(caseId)
    );
  }

  /**
   * Update case
   */
  public async updateCase(caseId: string, data: UpdateCaseRequest): Promise<MedicalCase> {
    return apiClient.patch<MedicalCase>(
      API_ENDPOINTS.CASES.UPDATE(caseId),
      data
    );
  }

  /**
   * Add case note
   */
  public async addNote(caseId: string, data: AddCaseNoteRequest): Promise<CaseNote> {
    return apiClient.post<CaseNote>(
      API_ENDPOINTS.CASES.NOTES(caseId),
      data
    );
  }

  /**
   * Get case notes
   */
  public async getNotes(caseId: string): Promise<CaseNote[]> {
    return apiClient.get<CaseNote[]>(
      API_ENDPOINTS.CASES.NOTES(caseId)
    );
  }

  /**
   * Create triage assessment
   */
  public async createTriage(caseId: string, data: CreateTriageRequest): Promise<TriageAssessment> {
    return apiClient.post<TriageAssessment>(
      API_ENDPOINTS.CASES.TRIAGE(caseId),
      data
    );
  }

  /**
   * Get triage history
   */
  public async getTriageHistory(caseId: string): Promise<TriageAssessment[]> {
    return apiClient.get<TriageAssessment[]>(
      API_ENDPOINTS.CASES.TRIAGE(caseId)
    );
  }
}

export const casesApiService = CasesApiService.getInstance();
