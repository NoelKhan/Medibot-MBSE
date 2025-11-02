/**
 * Notifications API Service
 * Handles push notifications, notification history, and user preferences
 */

import { apiClient } from './ApiClient';

export interface NotificationPreferences {
  id?: string;
  userId?: string;
  pushEnabled: boolean;
  pushToken?: string;
  emailEnabled: boolean;
  emailAppointmentConfirmation: boolean;
  emailAppointmentReminder: boolean;
  emailMedicationReminder: boolean;
  emailMarketingUpdates: boolean;
  reminderTimingPrimary: number; // minutes before
  reminderTimingSecondary: number; // minutes before
  reminderTimingCustom: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string; // HH:MM format
  deviceType?: string;
  appVersion?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'appointment_confirmation' | 'appointment_reminder' | 'medication_reminder' | 'case_update' | 'emergency_alert' | 'general';
  title: string;
  body: string;
  data?: Record<string, any>;
  status: 'pending' | 'sent' | 'failed' | 'read';
  pushToken?: string;
  read: boolean;
  sentAt?: string;
  readAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendNotificationRequest {
  userId: string;
  type: Notification['type'];
  title: string;
  body: string;
  data?: Record<string, any>;
  sendEmail?: boolean;
}

export interface RegisterPushTokenRequest {
  pushToken: string;
  deviceType: 'ios' | 'android' | 'web';
  appVersion: string;
}

class NotificationsApiService {
  private static instance: NotificationsApiService;

  public static getInstance(): NotificationsApiService {
    if (!NotificationsApiService.instance) {
      NotificationsApiService.instance = new NotificationsApiService();
    }
    return NotificationsApiService.instance;
  }

  /**
   * Send a push notification
   */
  async sendNotification(request: SendNotificationRequest): Promise<Notification> {
    const response = await apiClient.post('/notifications/send', request);
    return response.data;
  }

  /**
   * Get user's notification history
   */
  async getNotifications(limit?: number, offset?: number): Promise<Notification[]> {
    const params = { limit, offset };
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.count;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ updated: number }> {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  }

  /**
   * Get user's notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get('/notifications/preferences');
    return response.data;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await apiClient.put('/notifications/preferences', preferences);
    return response.data;
  }

  /**
   * Register push notification token with backend
   */
  async registerPushToken(request: RegisterPushTokenRequest): Promise<NotificationPreferences> {
    const response = await apiClient.post('/notifications/register-token', request);
    return response.data;
  }
}

export const notificationsApiService = NotificationsApiService.getInstance();
export default NotificationsApiService;
