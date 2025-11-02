/**
 * CaseService - Consolidated Medical Case Management
 * 
 * This service consolidates medical case management functionality from:
 * - UserAuthService (case CRUD operations)
 * - MedicalCaseService (case retrieval)
 * - CaseFollowupService (follow-up management)
 * 
 * Architecture:
 * Component → CaseService (business logic) → cases.api (HTTP) → Backend
 * 
 * NOTE: Currently uses hybrid approach:
 * - Tries API first for backend integration
 * - Falls back to in-memory storage for backward compatibility
 * - Provides UserAuthService-compatible methods for easy migration
 */

import * as casesApi from '../../api/cases.api';
import { createLogger } from '../Logger';
import { MedicalCase, CaseNote as BookingCaseNote, TriageAssessment } from '../../types/Booking';
import { PatientUser } from '../../types/Booking';

const logger = createLogger('CaseService');

// Internal storage for in-memory cases (backward compatibility)
// TODO: Remove once backend fully supports all operations
const inMemoryCases = new Map<string, MedicalCase>();
const inMemoryUsers = new Map<string, PatientUser>();

export interface CreateCaseData {
  title: string;
  description: string;
  symptoms: string[];
  severity: 1 | 2 | 3 | 4 | 5;
  category: 'general' | 'emergency' | 'follow-up' | 'prescription' | 'consultation';
}

export interface UpdateCaseData {
  title?: string;
  description?: string;
  status?: 'open' | 'in-progress' | 'waiting-patient' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

class CaseService {
  private static instance: CaseService;

  private constructor() {
    logger.info('CaseService initialized');
  }

  public static getInstance(): CaseService {
    if (!CaseService.instance) {
      CaseService.instance = new CaseService();
    }
    return CaseService.instance;
  }

  /**
   * Create a new medical case for a patient
   * Uses API if available, falls back to in-memory storage
   */
  public async createCase(
    patientId: string,
    caseData: CreateCaseData
  ): Promise<MedicalCase> {
    try {
      logger.info('Creating medical case', { patientId, title: caseData.title });

      // Try API first
      try {
        const apiCase = await casesApi.createCase({
          patientId,
          chiefComplaint: caseData.title,
          symptoms: caseData.symptoms,
          severity: caseData.severity,
        });

        logger.info('Medical case created via API', { caseId: apiCase.id });
        
        // Store in memory for quick access
        inMemoryCases.set(apiCase.id, apiCase);
        
        return apiCase;
      } catch (apiError) {
        logger.warn('API unavailable, using in-memory storage', apiError);
        
        // Fallback: Create case in memory
        const timestamp = Date.now();
        const ticketNumber = `CASE-${timestamp.toString().slice(-6)}`;
        
        const newCase: MedicalCase = {
          id: `case-${timestamp}-${Math.random().toString(36).substring(2, 11)}`,
          userId: patientId,
          ticketNumber,
          title: caseData.title,
          description: caseData.description,
          symptoms: caseData.symptoms,
          severity: caseData.severity,
          status: 'open',
          priority: this.severityToPriority(caseData.severity),
          category: caseData.category,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastActivity: new Date(),
          notes: [{
            id: `note-${Date.now()}`,
            authorId: patientId,
            authorName: 'Patient',
            authorRole: 'user',
            content: `Case created: ${caseData.description}`,
            timestamp: new Date(),
            isPrivate: false,
            type: 'update'
          }],
          followUpRequired: caseData.severity >= 3,
          relatedCases: []
        };

        inMemoryCases.set(newCase.id, newCase);
        
        // Update user's case list if available
        const user = inMemoryUsers.get(patientId);
        if (user) {
          user.activeCases.push(newCase.id);
          user.totalCases++;
          user.lastActivity = new Date();
        }

        logger.info('Medical case created in memory', { caseId: newCase.id, ticketNumber });
        return newCase;
      }
    } catch (error) {
      logger.error('Failed to create medical case', error);
      throw error;
    }
  }

  /**
   * Get a case by ID
   */
  public async getCaseById(caseId: string): Promise<MedicalCase | null> {
    try {
      logger.info('Fetching case by ID', { caseId });
      
      // Check memory first
      const memoryCase = inMemoryCases.get(caseId);
      if (memoryCase) {
        return memoryCase as any;
      }

      // Try API
      try {
        const apiCase = await casesApi.getCase(caseId);
        inMemoryCases.set(apiCase.id, apiCase);
        return apiCase as any;
      } catch (_apiError) {
        logger.warn('Case not found', { caseId });
        return null;
      }
    } catch (error) {
      logger.error('Failed to fetch case', error);
      return null;
    }
  }

  /**
   * Get all cases for a patient
   */
  public async getPatientCases(patientId: string): Promise<MedicalCase[]> {
    try {
      logger.info('Fetching patient cases', { patientId });
      
      // Try API first
      try {
        const apiCases = await casesApi.getCases(patientId);
        
        // Update memory cache
        apiCases.forEach(c => inMemoryCases.set(c.id, c));
        
        return apiCases;
      } catch (apiError) {
        logger.warn('API unavailable, using in-memory storage', apiError);
        
        // Fallback: Return from memory
        const cases = Array.from(inMemoryCases.values()).filter(
          c => c.userId === patientId
        );
        return cases;
      }
    } catch (error) {
      logger.error('Failed to fetch patient cases', error);
      return [];
    }
  }

  /**
   * Update a case
   */
  public async updateCase(
    caseId: string,
    updates: UpdateCaseData
  ): Promise<MedicalCase> {
    try {
      logger.info('Updating case', { caseId, updates });
      
      // Try API first
      try {
        const updatedCase = await casesApi.updateCase(caseId, {
          status: updates.status,
          assignedStaffId: undefined,
        });
        
        // Update memory cache
        inMemoryCases.set(caseId, updatedCase);
        
        logger.info('Case updated via API', { caseId });
        return updatedCase;
      } catch (apiError) {
        logger.warn('API unavailable, updating in-memory', apiError);
        
        // Fallback: Update in memory
        const memoryCase = inMemoryCases.get(caseId);
        if (memoryCase) {
          Object.assign(memoryCase, updates);
          memoryCase.updatedAt = new Date();
          logger.info('Case updated in memory', { caseId });
          return memoryCase;
        } else {
          throw new Error('Case not found');
        }
      }
    } catch (error) {
      logger.error('Failed to update case', error);
      throw error;
    }
  }

  /**
   * Add a note to a case
   */
  public async addCaseNote(
    caseId: string,
    authorType: 'patient' | 'doctor' | 'system' | 'user',
    authorId: string,
    content: string,
    isInternal: boolean = false,
    noteType: 'assessment' | 'treatment' | 'followup' | 'prescription' | 'general' = 'general'
  ): Promise<void> {
    try {
      logger.info('Adding case note', { caseId, authorType, noteType });
      
      // Map 'user' to 'patient' for API
      const mappedAuthorType = authorType === 'user' ? 'patient' : authorType;
      
      // Try API first
      try {
        await casesApi.addNote(caseId, {
          content,
          noteType: noteType as any,
          isVisibleToPatient: !isInternal,
        });
        
        logger.info('Case note added via API', { caseId });
      } catch (apiError) {
        logger.warn('API unavailable, adding note in-memory', apiError);
        
        // Fallback: Add to memory
        const memoryCase = inMemoryCases.get(caseId);
        if (memoryCase) {
          const newNote: BookingCaseNote = {
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            authorId: authorId,
            authorName: authorType === 'system' ? 'System' : 'User',
            authorRole: mappedAuthorType === 'system' ? 'system' : 'user',
            content,
            timestamp: new Date(),
            isPrivate: isInternal,
            type: noteType === 'assessment' ? 'assessment' : 'update',
          };
          
          memoryCase.notes.push(newNote);
          memoryCase.updatedAt = new Date();
          memoryCase.lastActivity = new Date();
          
          logger.info('Case note added in memory', { caseId });
        } else {
          throw new Error('Case not found');
        }
      }
    } catch (error) {
      logger.error('Failed to add case note', error);
      throw error;
    }
  }

  /**
   * Create triage assessment
   * Can be called with either:
   * 1. Auto-generate: createTriage(caseId, assessedBy)
   * 2. Manual: createTriage(caseId, triageData)
   */
  public async createTriage(
    caseId: string,
    assessedByOrData: string | {
      severity: number;
      urgency: string;
      notes: string;
    }
  ): Promise<TriageAssessment> {
    try {
      logger.info('Creating triage assessment', { caseId });
      
      // Get the case to generate assessment
      const medicalCase = await this.getCaseById(caseId);
      if (!medicalCase) {
        throw new Error('Case not found');
      }

      // Auto-generate triage if only userId provided
      if (typeof assessedByOrData === 'string') {
        const assessedBy = assessedByOrData;
        
        // Generate assessment based on case severity and symptoms
        const triageLevel = medicalCase.severity || 3;
        
        const assessment: TriageAssessment = {
          caseId,
          assessedBy,
          assessedAt: new Date(),
          triageLevel: triageLevel as (1 | 2 | 3 | 4 | 5),
          reasoningScore: {
            symptomsScore: medicalCase.symptoms?.length || 0,
            vitalSignsScore: 3,
            painLevel: triageLevel,
            mobilityScore: 4,
            mentalStateScore: 4,
          },
          recommendedAction: triageLevel <= 2 ? 'immediate-care' : 
                            triageLevel === 3 ? 'urgent-care' : 'standard-care',
          estimatedWaitTime: triageLevel <= 2 ? 15 : triageLevel === 3 ? 30 : 60,
        };

        // Try to call API (it will create the triage record)
        try {
          await casesApi.createTriage(caseId, {
            esiLevel: triageLevel as (1 | 2 | 3 | 4 | 5),
            assessmentNotes: `Auto-generated triage assessment based on severity level ${triageLevel}`,
          });
        } catch (apiError) {
          logger.warn('API unavailable, triage assessment not persisted', apiError);
        }
        
        logger.info('Triage assessment created', { caseId, triageLevel });
        return assessment;
      } else {
        // Manual triage with provided data
        const triageData = assessedByOrData;
        
        await casesApi.createTriage(caseId, {
          esiLevel: triageData.severity as (1 | 2 | 3 | 4 | 5),
          assessmentNotes: triageData.notes,
        });
        
        const assessment: TriageAssessment = {
          caseId,
          assessedBy: 'system',
          assessedAt: new Date(),
          triageLevel: triageData.severity as (1 | 2 | 3 | 4 | 5),
          reasoningScore: {
            symptomsScore: 3,
            vitalSignsScore: 3,
            painLevel: triageData.severity,
            mobilityScore: 3,
            mentalStateScore: 3,
          },
          recommendedAction: triageData.urgency === 'immediate' ? 'immediate-care' : 
                            triageData.urgency === 'urgent' ? 'urgent-care' : 'standard-care',
          estimatedWaitTime: triageData.urgency === 'immediate' ? 15 : 
                            triageData.urgency === 'urgent' ? 30 : 60,
        };
        
        logger.info('Triage assessment created', { caseId });
        return assessment;
      }
    } catch (error) {
      logger.error('Failed to create triage', error);
      throw error;
    }
  }

  /**
   * Assign a doctor to a case
   * TODO: Add this endpoint to cases.api when backend supports it
   */
  public async assignDoctor(caseId: string, doctorId: string): Promise<void> {
    try {
      logger.info('Assigning doctor to case', { caseId, doctorId });
      
      // TODO: Implement when API is ready
      // await casesApi.assignDoctor(caseId, doctorId);
      
      // For now, update in memory
      const memoryCase = inMemoryCases.get(caseId);
      if (memoryCase) {
        memoryCase.assignedDoctor = doctorId;
        memoryCase.updatedAt = new Date();
        logger.info('Doctor assigned in memory', { caseId, doctorId });
      } else {
        logger.warn('Case not found for doctor assignment', { caseId });
      }
    } catch (error) {
      logger.error('Failed to assign doctor', error);
      throw error;
    }
  }

  /**
   * Close a case
   * TODO: Add this endpoint to cases.api when backend supports it
   */
  public async closeCase(
    caseId: string,
    _resolution: string
  ): Promise<void> {
    try {
      logger.info('Closing case', { caseId });
      
      // TODO: Implement when API is ready
      // await casesApi.closeCase(caseId, { resolution });
      
      // For now, update in memory
      const memoryCase = inMemoryCases.get(caseId);
      if (memoryCase) {
        memoryCase.status = 'closed';
        memoryCase.updatedAt = new Date();
        logger.info('Case closed in memory', { caseId });
      } else {
        logger.warn('Case not found for closing', { caseId });
      }
    } catch (error) {
      logger.error('Failed to close case', error);
      throw error;
    }
  }

  // ====== BACKWARD COMPATIBILITY METHODS ======
  // Match old UserAuthService interface for easy migration

  /**
   * Get user by ID (backward compatibility for ChatScreen)
   */
  public getUserById(userId: string): PatientUser | undefined {
    return inMemoryUsers.get(userId);
  }

  /**
   * Get all users (backward compatibility for ChatScreen)
   */
  public getAllUsers(): PatientUser[] {
    return Array.from(inMemoryUsers.values());
  }

  /**
   * Register a user in memory (backward compatibility)
   * Temporary until full migration complete
   */
  public registerUser(user: PatientUser): void {
    inMemoryUsers.set(user.id, user);
    logger.info('User registered in memory', { userId: user.id });
  }

  // ====== HELPER METHODS ======

  /**
   * Convert severity to priority
   */
  private severityToPriority(severity: number): 'low' | 'medium' | 'high' | 'critical' {
    if (severity >= 4) return 'critical';
    if (severity === 3) return 'high';
    if (severity === 2) return 'medium';
    return 'low';
  }
}

// Export singleton instance
export const caseService = CaseService.getInstance();
export default CaseService;
