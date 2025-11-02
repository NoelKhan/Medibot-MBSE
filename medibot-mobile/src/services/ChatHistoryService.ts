import { Message, Conversation } from '../types/Medical';
import { User } from '../types/User';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from './Logger';

const logger = createLogger('ChatHistoryService');

export interface ChatExportOptions {
  format: 'pdf' | 'text' | 'html';
  includeTimestamps: boolean;
  includeUserInfo: boolean;
  emailRecipient?: string;
}

export class ChatHistoryService {
  private static instance: ChatHistoryService;
  private readonly STORAGE_KEY = 'medibot_chat_history';

  public static getInstance(): ChatHistoryService {
    if (!ChatHistoryService.instance) {
      ChatHistoryService.instance = new ChatHistoryService();
    }
    return ChatHistoryService.instance;
  }

  /**
   * Save a conversation to storage
   */
  public async saveConversation(conversation: Conversation): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      const conversations: Map<string, Conversation[]> = stored 
        ? new Map(JSON.parse(stored))
        : new Map();

      const userId = conversation.userId;
      const userConversations = conversations.get(userId) || [];
      
      // Check if conversation already exists, update it, otherwise add new
      const existingIndex = userConversations.findIndex(c => c.id === conversation.id);
      if (existingIndex >= 0) {
        userConversations[existingIndex] = conversation;
      } else {
        userConversations.push(conversation);
      }
      
      // Sort by date, most recent first
      // Ensure dates are Date objects before sorting
      userConversations.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      conversations.set(userId, userConversations);
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(Array.from(conversations.entries()))
      );
    } catch (error) {
      logger.error('Error saving conversation', error as Error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   */
  public async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const conversations: Map<string, Conversation[]> = new Map(JSON.parse(stored));
      const userConversations = conversations.get(userId) || [];
      
      // Ensure dates are Date objects
      return userConversations.map(conv => ({
        ...conv,
        createdAt: conv.createdAt instanceof Date ? conv.createdAt : new Date(conv.createdAt),
        startTime: conv.startTime instanceof Date ? conv.startTime : new Date(conv.startTime),
        endTime: conv.endTime ? (conv.endTime instanceof Date ? conv.endTime : new Date(conv.endTime)) : undefined,
      }));
    } catch (error) {
      logger.error('Error loading conversations', error as Error);
      return [];
    }
  }

  /**
   * Get a specific conversation by ID
   */
  public async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const conversations: Map<string, Conversation[]> = new Map(JSON.parse(stored));
      for (const userConversations of conversations.values()) {
        const found = userConversations.find(c => c.id === conversationId);
        if (found) {
          // Ensure dates are Date objects
          return {
            ...found,
            createdAt: found.createdAt instanceof Date ? found.createdAt : new Date(found.createdAt),
            startTime: found.startTime instanceof Date ? found.startTime : new Date(found.startTime),
            endTime: found.endTime ? (found.endTime instanceof Date ? found.endTime : new Date(found.endTime)) : undefined,
          };
        }
      }
      return null;
    } catch (error) {
      logger.error('Error loading conversation', error as Error);
      return null;
    }
  }

  /**
   * Get recent conversations for a user (limited)
   */
  public async getRecentConversations(userId: string, limit: number = 10): Promise<Conversation[]> {
    const conversations = await this.getUserConversations(userId);
    return conversations.slice(0, limit);
  }

  /**
   * Delete a conversation
   */
  public async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;

      const conversations: Map<string, Conversation[]> = new Map(JSON.parse(stored));
      
      for (const [userId, userConversations] of conversations.entries()) {
        const index = userConversations.findIndex(c => c.id === conversationId);
        if (index >= 0) {
          userConversations.splice(index, 1);
          conversations.set(userId, userConversations);
          await AsyncStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(Array.from(conversations.entries()))
          );
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('Error deleting conversation', error as Error);
      return false;
    }
  }

  /**
   * Generate a formatted text version of the chat
   */
  public generateTextExport(
    conversation: Conversation,
    user: User,
    options: ChatExportOptions
  ): string {
    let content = '';

    if (options.includeUserInfo) {
      content += `MEDICAL CHAT EXPORT\n`;
      content += `==================\n\n`;
      content += `Patient: ${user.name || 'Anonymous User'}\n`;
      content += `Email: ${user.email || 'Not provided'}\n`;
      content += `Date: ${conversation.createdAt.toLocaleDateString()}\n`;
      content += `Conversation ID: ${conversation.id}\n\n`;
    }

    content += `CHAT TRANSCRIPT\n`;
    content += `===============\n\n`;

    conversation.messages.forEach((message, index) => {
      const sender = message.sender === 'user' ? 'Patient' : 'MediBot AI';
      const timestamp = options.includeTimestamps 
        ? ` [${message.timestamp.toLocaleString()}]`
        : '';

      content += `${sender}${timestamp}:\n`;
      content += `${message.content}\n\n`;

      if (message.metadata?.severity) {
        content += `  → Severity Level: ${message.metadata.severity}/5\n\n`;
      }
    });

    content += `\n\nDISCLAIMER:\n`;
    content += `This chat transcript is for informational purposes only.\n`;
    content += `Always consult with healthcare professionals for medical advice.\n`;

    return content;
  }

  /**
   * Generate HTML export
   */
  public generateHTMLExport(
    conversation: Conversation,
    user: User,
    options: ChatExportOptions
  ): string {
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>MediBot Chat Export</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #007AFF; padding-bottom: 10px; margin-bottom: 20px; }
            .message { margin: 10px 0; padding: 10px; border-radius: 8px; }
            .user-message { background-color: #007AFF; color: white; margin-left: 50px; }
            .bot-message { background-color: #f0f0f0; margin-right: 50px; }
            .timestamp { font-size: 12px; opacity: 0.7; }
            .severity { font-weight: bold; color: #FF3B30; }
            .disclaimer { background-color: #FFF3CD; border: 1px solid #FFEEBA; padding: 10px; border-radius: 5px; margin-top: 20px; }
        </style>
    </head>
    <body>`;

    if (options.includeUserInfo) {
      html += `
        <div class="header">
            <h1>MediBot Chat Export</h1>
            <p><strong>Patient:</strong> ${user.name || 'Anonymous User'}</p>
            <p><strong>Email:</strong> ${user.email || 'Not provided'}</p>
            <p><strong>Date:</strong> ${conversation.createdAt.toLocaleDateString()}</p>
            <p><strong>Conversation ID:</strong> ${conversation.id}</p>
        </div>`;
    }

    html += `<div class="chat-content">`;

    conversation.messages.forEach((message) => {
      const messageClass = message.sender === 'user' ? 'user-message' : 'bot-message';
      const sender = message.sender === 'user' ? 'Patient' : 'MediBot AI';
      const timestamp = options.includeTimestamps 
        ? `<span class="timestamp">${message.timestamp.toLocaleString()}</span>`
        : '';

      html += `
        <div class="message ${messageClass}">
            <strong>${sender}</strong> ${timestamp}
            <div>${message.content.replace(/\n/g, '<br>')}</div>`;

      if (message.metadata?.severity) {
        html += `<div class="severity">Severity Level: ${message.metadata.severity}/5</div>`;
      }

      html += `</div>`;
    });

    html += `</div>`;

    html += `
        <div class="disclaimer">
            <strong>DISCLAIMER:</strong> This chat transcript is for informational purposes only.
            Always consult with healthcare professionals for medical advice.
        </div>
    </body>
    </html>`;

    return html;
  }

  /**
   * Export chat to file and optionally share
   */
  public async exportChat(
    conversation: Conversation,
    user: User,
    options: ChatExportOptions
  ): Promise<string> {
    try {
      let content: string;
      let fileName: string;
      let mimeType: string;

      if (options.format === 'html') {
        content = this.generateHTMLExport(conversation, user, options);
        fileName = `MediBot_Chat_${conversation.id}_${Date.now()}.html`;
        mimeType = 'text/html';
      } else if (options.format === 'pdf') {
        // For PDF, we'll export as HTML and let the system handle PDF conversion
        content = this.generateHTMLExport(conversation, user, options);
        fileName = `MediBot_Chat_${conversation.id}_${Date.now()}.html`;
        mimeType = 'text/html';
      } else {
        content = this.generateTextExport(conversation, user, options);
        fileName = `MediBot_Chat_${conversation.id}_${Date.now()}.txt`;
        mimeType = 'text/plain';
      }

      // Create file in document directory
      const documentsDir = (FileSystem as any).documentDirectory;
      if (!documentsDir) {
        throw new Error('Documents directory not available');
      }
      
      const fileUri = `${documentsDir}${fileName}`;
      await (FileSystem as any).writeAsStringAsync(fileUri, content, {
        encoding: 'utf8',
      });

      return fileUri;
    } catch (error) {
      logger.error('Error exporting chat', error as Error);
      throw new Error('Failed to export chat');
    }
  }

  /**
   * Share exported chat file
   */
  public async shareChat(fileUri: string, mimeType: string = 'text/plain'): Promise<void> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: 'Share MediBot Chat Export'
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      logger.error('Error sharing chat', error as Error);
      throw new Error('Failed to share chat');
    }
  }

  /**
   * Send chat via email
   */
  public async emailChat(
    conversation: Conversation,
    user: User,
    options: ChatExportOptions
  ): Promise<void> {
    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Email is not available on this device');
      }

      const content = this.generateTextExport(conversation, user, {
        ...options,
        includeTimestamps: true,
        includeUserInfo: true
      });

      const emailOptions: MailComposer.MailComposerOptions = {
        recipients: options.emailRecipient ? [options.emailRecipient] : [],
        subject: `MediBot Chat Export - ${conversation.createdAt.toLocaleDateString()}`,
        body: content,
        isHtml: false,
      };

      await MailComposer.composeAsync(emailOptions);
    } catch (error) {
      logger.error('Error sending email', error as Error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Get chat preview for history list
   */
  public getChatPreview(conversation: Conversation, maxLength: number = 100): string {
    if (conversation.messages.length === 0) {
      return 'No messages';
    }

    // Get first user message
    const firstUserMessage = conversation.messages.find(msg => msg.sender === 'user');
    if (firstUserMessage) {
      const preview = firstUserMessage.content.substring(0, maxLength);
      return preview.length < firstUserMessage.content.length 
        ? `${preview}...` 
        : preview;
    }

    // Fallback to first message
    const firstMessage = conversation.messages[0];
    const preview = firstMessage.content.substring(0, maxLength);
    return preview.length < firstMessage.content.length 
      ? `${preview}...` 
      : preview;
  }

  /**
   * Get chat summary statistics
   */
  public getChatSummary(conversation: Conversation): {
    messageCount: number;
    userMessageCount: number;
    botMessageCount: number;
    duration: string;
    lastActivity: Date;
    avgSeverity?: number;
  } {
    const userMessages = conversation.messages.filter(msg => msg.sender === 'user');
    const botMessages = conversation.messages.filter(msg => msg.sender === 'bot');
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const firstMessage = conversation.messages[0];
    
    let duration = 'Unknown';
    if (lastMessage && firstMessage) {
      const durationMs = lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime();
      const minutes = Math.floor(durationMs / 60000);
      duration = minutes > 0 ? `${minutes} minutes` : 'Less than a minute';
    }

    // Calculate average severity if available
    const severityMessages = conversation.messages.filter(
      msg => msg.metadata?.severity !== undefined
    );
    const avgSeverity = severityMessages.length > 0
      ? severityMessages.reduce((sum, msg) => sum + (msg.metadata?.severity || 0), 0) / severityMessages.length
      : undefined;

    return {
      messageCount: conversation.messages.length,
      userMessageCount: userMessages.length,
      botMessageCount: botMessages.length,
      duration,
      lastActivity: lastMessage?.timestamp || conversation.createdAt,
      avgSeverity
    };
  }
}