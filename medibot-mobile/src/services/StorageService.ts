import AsyncStorage from '@react-native-async-storage/async-storage';
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
      const data = await AsyncStorage.getItem(CONVERSATIONS_KEY);
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

      await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
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
      await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      logger.error('Error deleting conversation', error);
      throw error;
    }
  }
}

export default StorageService;