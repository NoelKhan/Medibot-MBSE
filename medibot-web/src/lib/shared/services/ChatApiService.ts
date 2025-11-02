/**
 * Chat API Service
 * ================
 * Platform-agnostic chat and AI consultation service
 */

import type { HttpClient } from '../utils/httpClient';
import type {
  ChatMessage,
  Conversation,
  SendMessageRequest,
  SendMessageResponse,
  SymptomAnalysis,
} from '../types';

export class ChatApiService {
  private httpClient: HttpClient;
  private baseEndpoint = '/chat';

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await this.httpClient.post<SendMessageResponse>(
      `${this.baseEndpoint}/message`,
      request
    );
    return this.deserializeDates(response.data);
  }

  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<Conversation[]> {
    const response = await this.httpClient.get<Conversation[]>(
      `${this.baseEndpoint}/conversations`
    );
    return response.data.map(conv => this.deserializeConversation(conv));
  }

  /**
   * Get a specific conversation with all messages
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await this.httpClient.get<Conversation>(
      `${this.baseEndpoint}/conversations/${conversationId}`
    );
    return this.deserializeConversation(response.data);
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const response = await this.httpClient.get<ChatMessage[]>(
      `${this.baseEndpoint}/conversations/${conversationId}/messages`
    );
    return response.data.map(msg => this.deserializeMessage(msg));
  }

  /**
   * Analyze symptoms from conversation
   */
  async analyzeSymptoms(conversationId: string): Promise<SymptomAnalysis> {
    const response = await this.httpClient.post<SymptomAnalysis>(
      `${this.baseEndpoint}/analyze`,
      { conversationId }
    );
    return response.data;
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string): Promise<void> {
    await this.httpClient.patch(
      `${this.baseEndpoint}/conversations/${conversationId}`,
      { status: 'archived' }
    );
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await this.httpClient.delete(
      `${this.baseEndpoint}/conversations/${conversationId}`
    );
  }

  // Helper methods to deserialize dates from JSON strings
  private deserializeDates(response: SendMessageResponse): SendMessageResponse {
    return {
      userMessage: this.deserializeMessage(response.userMessage),
      aiMessage: this.deserializeMessage(response.aiMessage),
    };
  }

  private deserializeMessage(message: any): ChatMessage {
    return {
      ...message,
      createdAt: new Date(message.createdAt),
    };
  }

  private deserializeConversation(conversation: any): Conversation {
    return {
      ...conversation,
      lastMessageAt: conversation.lastMessageAt
        ? new Date(conversation.lastMessageAt)
        : null,
      createdAt: new Date(conversation.createdAt),
      updatedAt: new Date(conversation.updatedAt),
      messages: conversation.messages
        ? conversation.messages.map((msg: any) => this.deserializeMessage(msg))
        : undefined,
    };
  }
}
