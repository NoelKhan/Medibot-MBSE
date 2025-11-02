/**
 * Medical Case Management Service
 * Handles creation, storage, and retrieval of medical cases
 */

import type { MedicalCase, SeverityScale } from '../types/Medical';
import { createLogger } from './Logger';

// Web storage adapter
const WebStorage = {
  getItem: async (key: string): Promise<string | null> => localStorage.getItem(key),
  setItem: async (key: string, value: string): Promise<void> => {
    localStorage.setItem(key, value);
  },
};

const logger = createLogger('MedicalCaseService');
const CASES_STORAGE_KEY = 'medibot_medical_cases';

export interface CaseCreationParams {
  userId: string;
  title: string;
  description: string;
  symptoms: string[];
  severity?: SeverityScale;
  category?: string;
  conversationId?: string;
}

export interface CaseUpdateParams {
  notes?: string;
  status?: 'active' | 'completed' | 'escalated' | 'follow_up';
  diagnosis?: string;
  recommendations?: string[];
}

export class MedicalCaseService {
  private static instance: MedicalCaseService;
  private cases: Map<string, MedicalCase[]> = new Map(); // userId -> cases

  public static getInstance(): MedicalCaseService {
    if (!MedicalCaseService.instance) {
      MedicalCaseService.instance = new MedicalCaseService();
    }
    return MedicalCaseService.instance;
  }

  /**
   * Initialize service and load cases from storage
   */
  public async initialize(): Promise<void> {
    try {
      const stored = await WebStorage.getItem(CASES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cases = new Map(Object.entries(parsed));
        
        // Convert date strings back to Date objects
        for (const [userId, userCases] of this.cases.entries()) {
          const convertedCases = (userCases as MedicalCase[]).map(c => ({
            ...c,
            createdAt: c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt),
            updatedAt: c.updatedAt instanceof Date ? c.updatedAt : new Date(c.updatedAt),
            followUpDate: c.followUpDate ? (c.followUpDate instanceof Date ? c.followUpDate : new Date(c.followUpDate)) : undefined,
          }));
          this.cases.set(userId, convertedCases);
        }
        
        logger.info('Loaded medical cases from storage');
      }
    } catch (error) {
      logger.error('Error loading medical cases', error);
    }
  }

  /**
   * Save cases to storage
   */
  private async saveCases(): Promise<void> {
    try {
      const obj = Object.fromEntries(this.cases);
      await WebStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      logger.error('Error saving medical cases', error);
    }
  }

  /**
   * Create a new medical case
   */
  public async createCase(params: CaseCreationParams): Promise<MedicalCase> {
    const caseId = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newCase: MedicalCase = {
      id: caseId,
      userId: params.userId,
      conversationId: params.conversationId || '',
      title: params.title,
      symptoms: params.symptoms,
      severity: (params.severity || 3) as SeverityScale,
      status: 'active',
      followUpRequired: false,
      recommendations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [params.category || 'general'],
      notes: params.description,
    };

    // Get user's cases or initialize new array
    const userCases = this.cases.get(params.userId) || [];
    userCases.push(newCase);
    this.cases.set(params.userId, userCases);

    await this.saveCases();
    logger.info('Created medical case', { caseId });

    return newCase;
  }

  /**
   * Create a case automatically from a chat conversation
   */
  public async createCaseFromChat(
    userId: string,
    conversationId: string,
    chatSummary: string,
    symptoms: string[],
    severity: SeverityScale
  ): Promise<MedicalCase> {
    return this.createCase({
      userId,
      conversationId,
      title: `Health Consultation - ${new Date().toLocaleDateString()}`,
      description: chatSummary,
      symptoms,
      severity,
      category: severity >= 4 ? 'urgent' : 'general',
    });
  }

  /**
   * Get all cases for a user
   */
  public async getUserCases(userId: string): Promise<MedicalCase[]> {
    const cases = this.cases.get(userId) || [];
    // Ensure dates are Date objects and sort by most recent first
    return cases.map(c => ({
      ...c,
      createdAt: c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt),
      updatedAt: c.updatedAt instanceof Date ? c.updatedAt : new Date(c.updatedAt),
      followUpDate: c.followUpDate ? (c.followUpDate instanceof Date ? c.followUpDate : new Date(c.followUpDate)) : undefined,
    })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get a specific case by ID
   */
  public async getCaseById(caseId: string): Promise<MedicalCase | null> {
    for (const userCases of this.cases.values()) {
      const found = userCases.find(c => c.id === caseId);
      if (found) return found;
    }
    return null;
  }

  /**
   * Update a case
   */
  public async updateCase(
    caseId: string,
    updates: CaseUpdateParams
  ): Promise<MedicalCase | null> {
    for (const [userId, userCases] of this.cases.entries()) {
      const caseIndex = userCases.findIndex(c => c.id === caseId);
      if (caseIndex >= 0) {
        const currentCase = userCases[caseIndex];
        
        // Update case
        const updatedCase: MedicalCase = {
          ...currentCase,
          ...updates,
          updatedAt: new Date(),
        };

        // Add to notes if provided
        if (updates.notes) {
          const timestamp = new Date().toLocaleString();
          updatedCase.notes = currentCase.notes 
            ? `${currentCase.notes}\n\n[${timestamp}] ${updates.notes}`
            : `[${timestamp}] ${updates.notes}`;
        }

        userCases[caseIndex] = updatedCase;
        this.cases.set(userId, userCases);
        await this.saveCases();

        return updatedCase;
      }
    }
    return null;
  }

  /**
   * Delete a case
   */
  public async deleteCase(caseId: string): Promise<boolean> {
    for (const [userId, userCases] of this.cases.entries()) {
      const filteredCases = userCases.filter(c => c.id !== caseId);
      if (filteredCases.length !== userCases.length) {
        this.cases.set(userId, filteredCases);
        await this.saveCases();
        return true;
      }
    }
    return false;
  }

  /**
   * Get cases statistics for a user
   */
  public async getCaseStats(userId: string): Promise<{
    total: number;
    open: number;
    closed: number;
    followup: number;
    urgent: number;
  }> {
    const cases = await this.getUserCases(userId);
    
    return {
      total: cases.length,
      open: cases.filter(c => c.status === 'active').length,
      closed: cases.filter(c => c.status === 'completed').length,
      followup: cases.filter(c => c.status === 'follow_up').length,
      urgent: cases.filter(c => c.severity >= 4).length,
    };
  }

  /**
   * Link a conversation to a case
   */
  public async linkConversationToCase(
    caseId: string,
    conversationId: string
  ): Promise<boolean> {
    const medicalCase = await this.getCaseById(caseId);
    if (medicalCase) {
      await this.updateCase(caseId, {
        notes: `Linked to conversation: ${conversationId}`,
      });
      return true;
    }
    return false;
  }

  /**
   * Get recent cases (last 30 days)
   */
  public async getRecentCases(userId: string, days: number = 30): Promise<MedicalCase[]> {
    const cases = await this.getUserCases(userId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return cases.filter(c => c.createdAt >= cutoffDate);
  }
}

export default MedicalCaseService;
