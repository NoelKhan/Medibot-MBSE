/**
 * AI Agent Service
 * =================
 * Service for interacting with AI Agent triage endpoints
 */

import { API_CONFIG } from '../config/api.config';

export interface TriageCase {
  id: string;
  userId: string;
  symptoms: any;
  triage: {
    severity_level: 'GREEN' | 'AMBER' | 'RED';
    rationale: string;
    recommended_action: string;
    red_flags_triggered: string[];
    care_instructions: string[];
  };
  action: {
    type: string;
    specialization?: string;
    urgency: string;
    instructions: string[];
  };
  summary: {
    patient_summary: string;
    clinician_summary: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

class AIAgentService {
  private static instance: AIAgentService;
  private baseURL: string;
  private token: string | null = null;

  private constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  public static getInstance(): AIAgentService {
    if (!AIAgentService.instance) {
      AIAgentService.instance = new AIAgentService();
    }
    return AIAgentService.instance;
  }

  public setToken(token: string): void {
    this.token = token;
  }

  public clearToken(): void {
    this.token = null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Get all triage cases
   */
  public async getTriageCases(filters?: {
    status?: string;
    severity?: string;
    userId?: string;
  }): Promise<TriageCase[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.severity) params.append('severity', filters.severity);
      if (filters?.userId) params.append('userId', filters.userId);

      const url = `${this.baseURL}/api/ai/cases${params.toString() ? `?${params}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch triage cases');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching triage cases:', error);
      throw error;
    }
  }

  /**
   * Get single triage case
   */
  public async getTriageCase(id: string): Promise<TriageCase> {
    try {
      const response = await fetch(`${this.baseURL}/api/ai/cases/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch triage case');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching triage case:', error);
      throw error;
    }
  }

  /**
   * Get emergency cases (RED severity)
   */
  public async getEmergencyCases(): Promise<TriageCase[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/ai/emergencies`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch emergency cases');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching emergency cases:', error);
      throw error;
    }
  }

  /**
   * Update triage case status
   */
  public async updateCaseStatus(id: string, status: string): Promise<TriageCase> {
    try {
      const response = await fetch(`${this.baseURL}/api/ai/cases/${id}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update case status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating case status:', error);
      throw error;
    }
  }

  /**
   * Get AI Agent health status
   */
  public async getHealth(): Promise<{ status: string; version?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/ai/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { status: 'unhealthy' };
      }

      return await response.json();
    } catch (error) {
      console.error('AI Agent health check failed:', error);
      return { status: 'error' };
    }
  }

  /**
   * Send a message for conversational triage
   */
  public async chatTriage(message: string, includeHistory: boolean = true): Promise<{
    severity: 'unknown' | 'self_care' | 'referral' | 'urgent' | 'emergency';
    confidence: number;
    recommendation: string;
    suggestedActions: string[];
    disclaimer: string;
    needsEscalation: boolean;
    carePathway?: any;
    actionPlan?: any;
    needsMoreInfo?: boolean;
    possibleConditions?: string[];
  }> {
    try {
      console.log('🚀 Sending chat triage request...');
      
      const response = await fetch(`${this.baseURL}/api/ai-chat/chat/triage`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ message, includeHistory }),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Failed to process chat triage: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Success!');
      return data;
    } catch (error) {
      console.error('💥 Chat triage error:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  public async getChatHistory(limit: number = 10): Promise<Array<{
    id: string;
    timestamp: string;
    userMessage: string;
    assistantResponse: string;
    severity: string;
    confidence: number;
  }>> {
    try {
      const response = await fetch(`${this.baseURL}/api/ai-chat/chat/history/${limit}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve chat history');
      }

      return await response.json();
    } catch (error) {
      console.error('Get chat history error:', error);
      throw error;
    }
  }

  /**
   * Clear conversation history
   */
  public async clearChatHistory(): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/ai-chat/chat/clear`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to clear chat history');
      }
    } catch (error) {
      console.error('Clear chat history error:', error);
      throw error;
    }
  }

  /**
   * Check AI Agent conversational service health
   */
  public async checkChatHealth(): Promise<{ status: string; aiAgentAvailable: boolean }> {
    try {
      const response = await fetch(`${this.baseURL}/api/ai-chat/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { status: 'unhealthy', aiAgentAvailable: false };
      }

      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      return { status: 'error', aiAgentAvailable: false };
    }
  }
}

export default AIAgentService.getInstance();

// Export convenience functions for conversational chat
export const chatTriage = (message: string, includeHistory?: boolean) => 
  AIAgentService.getInstance().chatTriage(message, includeHistory);

export const getChatHistory = (limit?: number) => 
  AIAgentService.getInstance().getChatHistory(limit);

export const clearChatHistory = () => 
  AIAgentService.getInstance().clearChatHistory();

export const checkChatHealth = () => 
  AIAgentService.getInstance().checkChatHealth();
