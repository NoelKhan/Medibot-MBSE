/**
 * Reminders API Service
 * Handles scheduled reminders for appointments, medications, and custom reminders
 */

import { apiClient } from './ApiClient';

export interface Reminder {
  id: string;
  userId: string;
  type: 'appointment' | 'medication' | 'followup' | 'custom';
  title: string;
  description?: string;
  reminderTime: string; // ISO date string
  status: 'scheduled' | 'sent' | 'cancelled' | 'failed';
  metadata?: Record<string, any>;
  recurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringInterval?: number;
  sentAt?: string;
  errorMessage?: string;
  appointmentId?: string;
  medicationId?: string;
  caseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderRequest {
  type: Reminder['type'];
  title: string;
  description?: string;
  reminderTime: string; // ISO date string
  recurring?: boolean;
  recurringPattern?: Reminder['recurringPattern'];
  recurringInterval?: number;
  metadata?: Record<string, any>;
  appointmentId?: string;
  medicationId?: string;
  caseId?: string;
}

export interface UpdateReminderRequest {
  title?: string;
  description?: string;
  reminderTime?: string;
  recurring?: boolean;
  recurringPattern?: Reminder['recurringPattern'];
  recurringInterval?: number;
  metadata?: Record<string, any>;
}

class RemindersApiService {
  private static instance: RemindersApiService;

  public static getInstance(): RemindersApiService {
    if (!RemindersApiService.instance) {
      RemindersApiService.instance = new RemindersApiService();
    }
    return RemindersApiService.instance;
  }

  /**
   * Create a new reminder
   */
  async createReminder(request: CreateReminderRequest): Promise<Reminder> {
    const response = await apiClient.post('/reminders', request);
    return response.data;
  }

  /**
   * Get all user reminders
   */
  async getReminders(status?: Reminder['status']): Promise<Reminder[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get('/reminders', { params });
    return response.data;
  }

  /**
   * Get upcoming reminders (next 7 days)
   */
  async getUpcomingReminders(): Promise<Reminder[]> {
    const response = await apiClient.get('/reminders/upcoming');
    return response.data;
  }

  /**
   * Get a specific reminder by ID
   */
  async getReminderById(reminderId: string): Promise<Reminder> {
    const response = await apiClient.get(`/reminders/${reminderId}`);
    return response.data;
  }

  /**
   * Update a reminder
   */
  async updateReminder(reminderId: string, request: UpdateReminderRequest): Promise<Reminder> {
    const response = await apiClient.put(`/reminders/${reminderId}`, request);
    return response.data;
  }

  /**
   * Cancel a reminder
   */
  async cancelReminder(reminderId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/reminders/${reminderId}`);
    return response.data;
  }

  /**
   * Cancel all reminders for an appointment
   */
  async cancelAppointmentReminders(appointmentId: string): Promise<{ message: string; cancelled: number }> {
    const response = await apiClient.delete(`/reminders/appointment/${appointmentId}`);
    return response.data;
  }
}

export const remindersApiService = RemindersApiService.getInstance();
export default RemindersApiService;
