// Web storage adapter
const WebStorage = { getItem: async (key: string) => localStorage.getItem(key), setItem: async (key: string, value: string) => { localStorage.setItem(key, value); }, removeItem: async (key: string) => { localStorage.removeItem(key); } };
import { Conversation } from '../types/Medical';
import { createLogger } from './Logger';

const logger = createLogger('StorageService');
const CONVERSATIONS_KEY = '@medibot_conversations';

export class StorageService {
  private static instance: StorageService;

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async getAllConversations(): Promise<Conversation[]> {
    try {
      const data = await WebStorage.getItem(CONVERSATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Error getting conversations', error);
      return [];
    }
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const conversations = await this.getAllConversations();
      return conversations.filter(c => c.userId === userId);
    } catch (error) {
      logger.error('Error getting user conversations', error);
      return [];
    }
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    try {
      const conversations = await this.getAllConversations();
      const existingIndex = conversations.findIndex(c => c.id === conversation.id);
      
      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.push(conversation);
      }

      await WebStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (error) {
      logger.error('Error saving conversation', error);
      throw error;
    }
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const conversations = await this.getAllConversations();
      return conversations.find(c => c.id === conversationId) || null;
    } catch (error) {
      logger.error('Error getting conversation', error);
      return null;
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const conversations = await this.getAllConversations();
      const filtered = conversations.filter(c => c.id !== conversationId);
      await WebStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      logger.error('Error deleting conversation', error);
      throw error;
    }
  }
}

export default StorageService;