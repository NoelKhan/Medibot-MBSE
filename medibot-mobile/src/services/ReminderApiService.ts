/**
 * Reminder API Service
 * ====================
 * Connects to backend reminder endpoints
 * Maps between frontend (scheduledTime) and backend (reminderTime) field names
 */

import { apiClient } from './ApiClient';
import { createLogger } from './Logger';

const logger = createLogger('ReminderApiService');

// Frontend types (matching ReminderListScreen and MockReminderFollowupService)
export interface FrontendReminder {
  id: string;
  userId: string;
  caseId?: string;
  title: string;
  description: string;
  type: 'medication' | 'appointment' | 'followup' | 'test' | 'general';
  scheduledTime: Date; // Frontend uses scheduledTime
  status: 'pending' | 'sent' | 'dismissed' | 'completed';
  recurring?: 'daily' | 'weekly' | 'monthly' | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
}

// Backend types (matching backend DTOs)
interface BackendReminder {
  id: string;
  userId: string;
  type: string;
  title: string;
  description?: string;
  reminderTime: string; // Backend uses reminderTime (ISO string)
  status: string;
  priority: string;
  recurring?: boolean;
  recurringPattern?: string;
  recurringInterval?: number;
  metadata?: Record<string, any>;
  appointmentId?: string;
  medicationId?: string;
  caseId?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateReminderRequest {
  type: string;
  title: string;
  description?: string;
  reminderTime: string;
  priority?: string;
  recurring?: boolean;
  recurringPattern?: string;
  recurringInterval?: number;
  appointmentId?: string;
  medicationId?: string;
  caseId?: string;
}

interface UpdateReminderRequest {
  title?: string;
  description?: string;
  reminderTime?: string;
  priority?: string;
  recurring?: boolean;
  recurringPattern?: string;
  recurringInterval?: number;
}

/**
 * Reminder API Service
 */
class ReminderApiService {
  private static instance: ReminderApiService;

  private constructor() {}

  public static getInstance(): ReminderApiService {
    if (!ReminderApiService.instance) {
      ReminderApiService.instance = new ReminderApiService();
    }
    return ReminderApiService.instance;
  }

  /**
   * Map backend reminder to frontend format
   */
  private mapToFrontend(backend: BackendReminder): FrontendReminder {
    // Map recurring pattern to frontend format
    let recurring: 'daily' | 'weekly' | 'monthly' | null = null;
    if (backend.recurring && backend.recurringPattern) {
      recurring = backend.recurringPattern as 'daily' | 'weekly' | 'monthly';
    }

    return {
      id: backend.id,
      userId: backend.userId,
      caseId: backend.caseId,
      title: backend.title,
      description: backend.description || '',
      type: backend.type as any,
      scheduledTime: new Date(backend.reminderTime), // Map reminderTime -> scheduledTime
      status: backend.status as any,
      recurring,
      priority: backend.priority as any,
      createdAt: new Date(backend.createdAt),
      updatedAt: new Date(backend.updatedAt),
    };
  }

  /**
   * Map frontend reminder to backend create format
   */
  private mapToBackendCreate(
    frontend: Partial<FrontendReminder>
  ): CreateReminderRequest {
    const request: CreateReminderRequest = {
      type: frontend.type!,
      title: frontend.title!,
      description: frontend.description,
      reminderTime: frontend.scheduledTime!.toISOString(), // Map scheduledTime -> reminderTime
      priority: frontend.priority,
      caseId: frontend.caseId,
    };

    // Map recurring pattern
    if (frontend.recurring) {
      request.recurring = true;
      request.recurringPattern = frontend.recurring;
      // Set default interval based on pattern
      switch (frontend.recurring) {
        case 'daily':
          request.recurringInterval = 1;
          break;
        case 'weekly':
          request.recurringInterval = 7;
          break;
        case 'monthly':
          request.recurringInterval = 30;
          break;
      }
    }

    return request;
  }

  /**
   * Map frontend reminder to backend update format
   */
  private mapToBackendUpdate(
    frontend: Partial<FrontendReminder>
  ): UpdateReminderRequest {
    const request: UpdateReminderRequest = {};

    if (frontend.title) request.title = frontend.title;
    if (frontend.description) request.description = frontend.description;
    if (frontend.scheduledTime) {
      request.reminderTime = frontend.scheduledTime.toISOString();
    }
    if (frontend.priority) request.priority = frontend.priority;

    // Map recurring pattern
    if (frontend.recurring !== undefined) {
      if (frontend.recurring) {
        request.recurring = true;
        request.recurringPattern = frontend.recurring;
        switch (frontend.recurring) {
          case 'daily':
            request.recurringInterval = 1;
            break;
          case 'weekly':
            request.recurringInterval = 7;
            break;
          case 'monthly':
            request.recurringInterval = 30;
            break;
        }
      } else {
        request.recurring = false;
      }
    }

    return request;
  }

  /**
   * Get user reminders
   */
  async getUserReminders(userId: string): Promise<FrontendReminder[]> {
    try {
      const data = await apiClient.get<BackendReminder[]>('/reminders');
      return data.map((r: BackendReminder) => this.mapToFrontend(r));
    } catch (error) {
      logger.error('Error fetching reminders', error);
      throw error;
    }
  }

  /**
   * Get upcoming reminders (next 7 days)
   */
  async getUpcomingReminders(userId: string): Promise<FrontendReminder[]> {
    try {
      const data = await apiClient.get<BackendReminder[]>('/reminders/upcoming');
      return data.map((r: BackendReminder) => this.mapToFrontend(r));
    } catch (error) {
      logger.error('Error fetching upcoming reminders', error);
      throw error;
    }
  }

  /**
   * Get reminder by ID
   */
  async getReminderById(reminderId: string): Promise<FrontendReminder> {
    try {
      const data = await apiClient.get<BackendReminder>(`/reminders/${reminderId}`);
      return this.mapToFrontend(data);
    } catch (error) {
      logger.error('Error fetching reminder', error);
      throw error;
    }
  }

  /**
   * Create new reminder
   */
  async createReminder(reminder: Omit<FrontendReminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<FrontendReminder> {
    try {
      const backendData = this.mapToBackendCreate(reminder);
      const data = await apiClient.post<BackendReminder>('/reminders', backendData);
      return this.mapToFrontend(data);
    } catch (error) {
      logger.error('Error creating reminder', error);
      throw error;
    }
  }

  /**
   * Update reminder
   */
  async updateReminder(reminderId: string, updates: Partial<FrontendReminder>): Promise<FrontendReminder> {
    try {
      const backendUpdates = updates.scheduledTime
        ? { ...updates, reminderTime: updates.scheduledTime, scheduledTime: undefined }
        : updates;
      
      const data = await apiClient.put<BackendReminder>(`/reminders/${reminderId}`, backendUpdates);
      return this.mapToFrontend(data);
    } catch (error) {
      logger.error('Error updating reminder', error);
      throw error;
    }
  }

  /**
   * Update reminder status
   */
  async updateReminderStatus(reminderId: string, status: FrontendReminder['status']): Promise<void> {
    try {
      await apiClient.patch(`/reminders/${reminderId}/status`, { status });
    } catch (error) {
      logger.error('Error updating reminder status', error);
      throw error;
    }
  }

  /**
   * Delete reminder
   */
  async deleteReminder(reminderId: string): Promise<void> {
    try {
      await apiClient.delete(`/reminders/${reminderId}`);
    } catch (error) {
      logger.error('Error deleting reminder', error);
      throw error;
    }
  }

  /**
   * Cancel reminders for specific appointment
   */
  async cancelAppointmentReminders(appointmentId: string): Promise<void> {
    try {
      await apiClient.delete(`/reminders/appointment/${appointmentId}`);
    } catch (error) {
      logger.error('Error cancelling appointment reminders', error);
      throw error;
    }
  }
}

export default ReminderApiService;
