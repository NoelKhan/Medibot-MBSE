/**
 * Chat API Service
 * ================
 * Handles API calls for chat/AI consultation endpoints
 */

import { API_CONFIG } from '../config/api.config';
import { createLogger } from './Logger';

const logger = createLogger('ChatApiService');

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai' | 'staff';
  content: string;
  messageType: 'text' | 'image' | 'audio';
  metadata?: any;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  status: 'active' | 'archived' | 'closed';
  lastMessageAt: Date | null;
  messages?: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageRequest {
  conversationId?: string;
  content: string;
  messageType?: 'text' | 'image' | 'audio';
  metadata?: any;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
}

export interface SymptomAnalysis {
  symptoms: string[];
  severity: 'low' | 'moderate' | 'high' | 'emergency';
  bodyParts: string[];
  duration: string | null;
  triggers: string[];
  sentiment: 'concerned' | 'anxious' | 'calm' | 'urgent';
  medicalTerms: string[];
}

export class ChatApiService {
  private static instance: ChatApiService;
  private baseURL: string;
  private token: string | null = null;

  private constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  public static getInstance(): ChatApiService {
    if (!ChatApiService.instance) {
      ChatApiService.instance = new ChatApiService();
    }
    return ChatApiService.instance;
  }

  /**
   * Set authentication token
   */
  public setToken(token: string): void {
    this.token = token;
  }

  /**
   * Clear authentication token
   */
  public clearToken(): void {
    this.token = null;
  }

  /**
   * Get authorization headers
   */
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
   * Send message and get AI response
   */
  public async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      logger.info('Sending message', { conversationId: request.conversationId });

      const response = await fetch(`${this.baseURL}/api/chat/message`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send message';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (parseError) {
          logger.warn('Could not parse error response');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data || !data.userMessage || !data.aiMessage) {
        throw new Error('Invalid response format from server');
      }
      
      logger.info('Message sent successfully', { 
        userMessageId: data.userMessage?.id,
        aiMessageId: data.aiMessage?.id 
      });

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('network')) {
        logger.error('Network error sending message', error);
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        logger.error('Request timeout', error);
        throw new Error('Request timed out. Please try again.');
      }
      logger.error('Error sending message', error as Error);
      throw error;
    }
  }

  /**
   * Analyze symptoms from text
   */
  public async analyzeSymptoms(content: string): Promise<SymptomAnalysis> {
    try {
      logger.info('Analyzing symptoms');

      const response = await fetch(`${this.baseURL}/api/chat/analyze`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ content }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to analyze symptoms';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (parseError) {
          logger.warn('Could not parse error response');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data || !data.severity) {
        throw new Error('Invalid analysis response from server');
      }
      
      logger.info('Symptoms analyzed', { severity: data.severity });

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('network')) {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new Error('Request timed out. Please try again.');
      }
      logger.error('Error analyzing symptoms', error as Error);
      throw error;
    }
  }

  public async getConversations(): Promise<Conversation[]> {
    try {
      logger.info('Fetching conversations');

      const response = await fetch(`${this.baseURL}/api/chat/conversations`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch conversations';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (parseError) {
          logger.warn('Could not parse error response');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        logger.warn('Expected array of conversations, got:', typeof data);
        return [];
      }
      
      logger.info('Conversations fetched', { count: data.length });

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('network')) {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new Error('Request timed out. Please try again.');
      }
      logger.error('Error fetching conversations', error as Error);
      throw error;
    }
  }

  /**
   * Get conversation by ID with messages
   */
  public async getConversation(conversationId: string): Promise<Conversation> {
    try {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }
      
      logger.info('Fetching conversation', { conversationId });

      const response = await fetch(
        `${this.baseURL}/api/chat/conversations/${conversationId}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(15000),
        },
      );

      if (!response.ok) {
        let errorMessage = 'Failed to fetch conversation';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (parseError) {
          logger.warn('Could not parse error response');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data || !data.id) {
        throw new Error('Invalid conversation data received');
      }
      
      logger.info('Conversation fetched', { 
        conversationId,
        messageCount: data.messages?.length || 0 
      });

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('network')) {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new Error('Request timed out. Please try again.');
      }
      logger.error('Error fetching conversation', error as Error);
      throw error;
    }
  }

  /**
   * Update conversation (title, status)
   */
  public async updateConversation(
    conversationId: string,
    updates: { title?: string; status?: 'active' | 'archived' | 'closed' },
  ): Promise<Conversation> {
    try {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('No updates provided');
      }
      
      logger.info('Updating conversation', { conversationId, updates });

      const response = await fetch(
        `${this.baseURL}/api/chat/conversations/${conversationId}`,
        {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
          signal: AbortSignal.timeout(15000),
        },
      );

      if (!response.ok) {
        let errorMessage = 'Failed to update conversation';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (parseError) {
          logger.warn('Could not parse error response');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data || !data.id) {
        throw new Error('Invalid response from server');
      }
      
      logger.info('Conversation updated', { conversationId });

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('network')) {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new Error('Request timed out. Please try again.');
      }
      logger.error('Error updating conversation', error as Error);
      throw error;
    }
  }

  /**
   * Delete conversation
   */
  public async deleteConversation(conversationId: string): Promise<void> {
    try {
      logger.info('Deleting conversation', { conversationId });

      const response = await fetch(
        `${this.baseURL}/api/chat/conversations/${conversationId}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete conversation');
      }

      logger.info('Conversation deleted', { conversationId });
    } catch (error) {
      logger.error('Error deleting conversation', error as Error);
      throw error;
    }
  }

  // ============================================================
  // AI AGENT INTEGRATION - Medical Triage
  // ============================================================

  /**
   * Process message through AI Agent for medical triage
   * Uses LangGraph workflow for intelligent symptom analysis
   */
  public async aiTriage(request: AITriageRequest): Promise<AITriageResponse> {
    try {
      logger.info('Sending AI triage request');

      const response = await fetch(`${this.baseURL}/api/ai-chat/chat/triage`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          message: request.message,
          conversationId: request.conversationId,
          includeHistory: request.includeHistory ?? true,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        let errorMessage = 'AI triage failed';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (parseError) {
          logger.warn('Could not parse error response');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data || !data.case_id) {
        throw new Error('Invalid AI triage response');
      }
      
      logger.info('AI triage completed', { caseId: data.case_id, severity: data.triage?.severity_level });
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('network')) {
        logger.error('Network error during AI triage', error);
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        logger.error('AI triage request timeout', error);
        throw new Error('AI triage took too long. Please try again.');
      }
      logger.error('Error during AI triage', error as Error);
      throw error;
    }
  }

  /**
   * Get user's triage cases
   * @param status - Filter by status: 'active', 'resolved', 'escalated'
   */
  public async getTriageCases(status?: string): Promise<AITriageResponse[]> {
    try {
      const url = status 
        ? `${this.baseURL}/api/ai-chat/cases?status=${status}`
        : `${this.baseURL}/api/ai-chat/cases`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch triage cases');
      }

      const data = await response.json();
      logger.info('Fetched triage cases', { count: data.length });
      return data;
    } catch (error) {
      logger.error('Error fetching triage cases', error as Error);
      throw error;
    }
  }

  /**
   * Get specific triage case by ID
   * @param caseId - Triage case UUID
   */
  public async getTriageCase(caseId: string): Promise<AITriageResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/ai-chat/cases/${caseId}`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Triage case not found');
        }
        throw new Error('Failed to fetch triage case');
      }

      const data = await response.json();
      logger.info('Fetched triage case', { caseId });
      return data;
    } catch (error) {
      logger.error('Error fetching triage case', error as Error);
      throw error;
    }
  }

  /**
   * Get AI Agent health status
   */
  public async getAIAgentHealth(): Promise<{ status: string; version?: string; model?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/ai-chat/health`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return { status: 'unavailable' };
      }

      return await response.json();
    } catch (error) {
      logger.warn('AI Agent health check failed', error as Error);
      return { status: 'error' };
    }
  }
}

// ============================================================
// AI AGENT TYPE DEFINITIONS
// ============================================================

export interface AITriageRequest {
  message: string;
  conversationId?: string;
  includeHistory?: boolean;
}

export interface AITriageResponse {
  case_id: string;
  symptoms: {
    chief_complaint?: string;
    duration?: string;
    severity_self?: string;
    age_band?: string;
    associated_symptoms: string[];
  };
  triage: {
    severity_level: 'GREEN' | 'AMBER' | 'RED';
    rationale: string;
    recommended_action: 'self-care' | 'referral' | 'emergency';
    red_flags_triggered: string[];
    care_instructions: string[];
    confidence?: number;
  };
  action: {
    type: 'self-care' | 'book_appointment' | 'emergency' | 'referral';
    specialization?: string;
    urgency: string;
    instructions: string[];
    resources: string[];
  };
  summary: {
    patient_summary: string;
    clinician_summary: string;
  };
  message: string;
  status: string;
}

export default ChatApiService.getInstance();
