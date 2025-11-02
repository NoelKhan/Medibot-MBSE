/**
 * Web Notification Service
 * Browser Notification API implementation for web
 */

import { API_CONFIG } from '../config/api.config';
import { createLogger } from './Logger';

const logger = createLogger('NotificationService');

const WebStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    localStorage.removeItem(key);
  },
};

export interface NotificationSettings {
  smsNotifications: boolean;
  emailNotifications: boolean;
  reminderNotifications: boolean;
  emergencyNotifications: boolean;
  followUpReminders: boolean;
  appointmentReminders: boolean;
  pushNotifications: boolean;
}

export interface ReminderRequest {
  id?: string;
  title: string;
  body: string;
  date: Date;
  type: 'appointment' | 'follow-up' | 'medication' | 'checkup' | 'custom';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  phoneNumber?: string;
  email?: string;
}

export interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  type: string;
  read: boolean;
  actionTaken?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings;
  private isInitialized: boolean = false;
  private scheduledReminders: Map<string, ReminderRequest> = new Map();
  private pushToken: string | null = null;

  private constructor() {
    this.settings = {
      smsNotifications: true,
      emailNotifications: true,
      reminderNotifications: true,
      emergencyNotifications: true,
      followUpReminders: true,
      appointmentReminders: true,
      pushNotifications: true,
    };
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.loadSettings();
      await this.registerForPushNotificationsAsync();
      this.isInitialized = true;
      logger.info('NotificationService initialized successfully');
    } catch (error) {
      logger.error('Error initializing NotificationService', error as Error);
    }
  }

  async registerForPushNotificationsAsync(): Promise<string | null> {
    if (!('Notification' in window)) {
      logger.warn('Browser does not support notifications');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        logger.info('Notification permission granted');
        this.pushToken = `web-${Date.now()}`;

        try {
          await this.registerDeviceToken(this.pushToken);
        } catch (error) {
          logger.error('Failed to register device token', error as Error);
        }

        return this.pushToken;
      } else {
        logger.warn('Notification permission denied');
        return null;
      }
    } catch (error) {
      logger.error('Error requesting notification permission', error as Error);
      return null;
    }
  }

  private async registerDeviceToken(token: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/notifications/register-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, deviceType: 'web', appVersion: '1.0.0' }),
      });

      if (!response.ok) throw new Error('Failed to register device token');
      logger.info('Device token registered successfully');
    } catch (error) {
      logger.error('Error registering device token', error as Error);
      throw error;
    }
  }

  async scheduleNotification(reminder: ReminderRequest): Promise<string> {
    const id = reminder.id || `reminder-${Date.now()}`;

    try {
      this.scheduledReminders.set(id, { ...reminder, id });
      await this.saveScheduledReminders();

      const delay = reminder.date.getTime() - Date.now();

      if (delay > 0) {
        setTimeout(() => {
          this.showBrowserNotification(reminder.title, reminder.body);
        }, delay);
        logger.info('Notification scheduled', { id, delay });
      } else {
        logger.warn('Notification date is in the past', { id });
      }

      return id;
    } catch (error) {
      logger.error('Error scheduling notification', error as Error);
      throw new Error('Failed to schedule notification');
    }
  }

  private showBrowserNotification(title: string, body: string): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log(`Notification: ${title} - ${body}`);
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/medibot-icon.png', badge: '/medibot-badge.png' });
    } else {
      console.log(`Notification (permission denied): ${title} - ${body}`);
    }
  }

  async scheduleRecurringNotification(
    title: string,
    body: string,
    intervalMinutes: number,
    repeatCount?: number
  ): Promise<string> {
    const id = `recurring-${Date.now()}`;

    try {
      let count = 0;
      const maxCount = repeatCount || Infinity;

      const intervalId = setInterval(() => {
        this.showBrowserNotification(title, body);
        count++;
        if (count >= maxCount) clearInterval(intervalId);
      }, intervalMinutes * 60 * 1000);

      logger.info('Recurring notification scheduled', { id, intervalMinutes });
      return id;
    } catch (error) {
      logger.error('Error scheduling recurring notification', error as Error);
      throw new Error('Failed to schedule recurring notification');
    }
  }

  showInAppNotification(title: string, body: string, onDismiss?: () => void): void {
    this.showBrowserNotification(title, body);
    if (onDismiss) onDismiss();
  }

  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    if (!this.settings.smsNotifications) {
      logger.info('SMS notifications are disabled');
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user',
          type: 'sms',
          title: 'MediBot SMS',
          message,
          priority: 'high',
          metadata: { phoneNumber },
        }),
      });

      if (!response.ok) throw new Error('Failed to send SMS');
      logger.info('SMS sent successfully', { phoneNumber });
    } catch (error) {
      logger.error('Error sending SMS', error as Error);
      throw new Error('Failed to send SMS notification');
    }
  }

  async sendEmail(email: string, subject: string, body: string): Promise<void> {
    if (!this.settings.emailNotifications) {
      logger.info('Email notifications are disabled');
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user',
          type: 'email',
          title: subject,
          message: body,
          priority: 'normal',
          metadata: { email },
        }),
      });

      if (!response.ok) throw new Error('Failed to send email');
      logger.info('Email sent successfully', { email });
    } catch (error) {
      logger.error('Error sending email', error as Error);
      throw new Error('Failed to send email notification');
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      this.scheduledReminders.delete(notificationId);
      await this.saveScheduledReminders();
      logger.info('Notification cancelled', { notificationId });
    } catch (error) {
      logger.error('Error cancelling notification', error as Error);
      throw new Error('Failed to cancel notification');
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      this.scheduledReminders.clear();
      await this.saveScheduledReminders();
      logger.info('All notifications cancelled');
    } catch (error) {
      logger.error('Error cancelling all notifications', error as Error);
    }
  }

  async getAllScheduledReminders(): Promise<ReminderRequest[]> {
    try {
      await this.loadScheduledReminders();
      return Array.from(this.scheduledReminders.values());
    } catch (error) {
      logger.error('Error getting scheduled reminders', error as Error);
      return [];
    }
  }

  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    logger.info('Notification settings updated', newSettings);
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  getPushToken(): string | null {
    return this.pushToken;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  private async loadSettings(): Promise<void> {
    try {
      const settingsJson = await WebStorage.getItem('notification_settings');
      if (settingsJson) this.settings = JSON.parse(settingsJson);
    } catch (error) {
      logger.error('Error loading settings', error as Error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await WebStorage.setItem('notification_settings', JSON.stringify(this.settings));
    } catch (error) {
      logger.error('Error saving settings', error as Error);
    }
  }

  private async loadScheduledReminders(): Promise<void> {
    try {
      const remindersJson = await WebStorage.getItem('scheduled_reminders');
      if (remindersJson) {
        const reminders = JSON.parse(remindersJson);
        this.scheduledReminders = new Map(Object.entries(reminders));
      }
    } catch (error) {
      logger.error('Error loading scheduled reminders', error as Error);
    }
  }

  private async saveScheduledReminders(): Promise<void> {
    try {
      const reminders = Object.fromEntries(this.scheduledReminders);
      await WebStorage.setItem('scheduled_reminders', JSON.stringify(reminders));
    } catch (error) {
      logger.error('Error saving scheduled reminders', error as Error);
    }
  }

  async getNotificationHistory(): Promise<NotificationHistory[]> {
    try {
      const historyJson = await WebStorage.getItem('notification_history');
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      logger.error('Error loading notification history', error as Error);
      return [];
    }
  }

  private async saveNotificationHistory(notification: NotificationHistory): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      history.push(notification);
      const trimmedHistory = history.slice(-100);
      await WebStorage.setItem('notification_history', JSON.stringify(trimmedHistory));
    } catch (error) {
      logger.error('Error saving notification history', error as Error);
    }
  }

  async sendEmergencyNotification(title: string, body: string): Promise<void> {
    if (!this.settings.emergencyNotifications) {
      logger.info('Emergency notifications disabled');
      return;
    }

    try {
      this.showBrowserNotification(`🚨 ${title}`, body);
      await this.saveNotificationHistory({
        id: `emergency-${Date.now()}`,
        title,
        body,
        timestamp: new Date(),
        type: 'emergency',
        read: false,
      });
      logger.info('Emergency notification sent successfully');
    } catch (error) {
      logger.error('Error sending emergency notification', error as Error);
    }
  }

  async notifyEmergencyContacts(
    message: string,
    contacts: Array<{ name: string; phone: string; email?: string }>
  ): Promise<void> {
    logger.info('Notifying emergency contacts', { count: contacts.length });

    for (const contact of contacts) {
      try {
        if (contact.phone) await this.sendSMS(contact.phone, message);
        if (contact.email) await this.sendEmail(contact.email, '🚨 Emergency Alert', message);
      } catch (error) {
        logger.error('Error notifying emergency contact', { contact: contact.name, error });
      }
    }
  }
}

export const notificationService = NotificationService.getInstance();
export default NotificationService;
