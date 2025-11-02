/**
 * CONSOLIDATED NOTIFICATION SERVICE
 * ==================================
 * 
 * Replaces:
 * - NotificationService (528 lines)
 * - EnhancedNotificationService (329 lines)
 * - PushNotificationService (200+ lines)
 * - SimpleNotificationService (150+ lines)
 * - NotificationsApiService (partial)
 * 
 * Responsibilities:
 * - Push notification registration and handling
 * - Local notification scheduling (reminders, appointments)
 * - Notification preferences management
 * - Backend sync for notifications
 * - Notification history tracking
 * 
 * Architecture: Service (business logic) → API (HTTP) → Backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationsApi, PushNotification as ApiNotification } from '../../api/notifications.api';
import { createLogger } from '../Logger';

const logger = createLogger('NotificationService');

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ==================== TYPES ====================

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  medicationReminders: boolean;
  followUpReminders: boolean;
  emergencyAlerts: boolean;
  marketingMessages: boolean;
}

export interface ReminderRequest {
  id?: string;
  title: string;
  body: string;
  date: Date;
  type: 'appointment' | 'medication' | 'follow-up' | 'checkup' | 'custom';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data?: Record<string, any>;
}

export interface LocalNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
  trigger?: Notifications.NotificationTriggerInput | null;
}

export interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  type: string;
  read: boolean;
  data?: Record<string, any>;
}

// ==================== STORAGE KEYS ====================

const STORAGE_KEYS = {
  SETTINGS: '@notification_settings',
  PUSH_TOKEN: '@push_token',
  HISTORY: '@notification_history',
  SCHEDULED: '@scheduled_reminders',
} as const;

// ==================== SERVICE CLASS ====================

class NotificationService {
  private static instance: NotificationService;
  
  // State
  private settings: NotificationSettings;
  private pushToken: string | null = null;
  private isInitialized: boolean = false;
  private notificationListener: any = null;
  private responseListener: any = null;
  
  // In-memory storage for reminders
  private scheduledReminders: Map<string, ReminderRequest> = new Map();
  private notificationHistory: NotificationHistory[] = [];

  private constructor() {
    // Default settings
    this.settings = {
      pushNotifications: true,
      emailNotifications: true,
      smsNotifications: true,
      appointmentReminders: true,
      medicationReminders: true,
      followUpReminders: true,
      emergencyAlerts: true,
      marketingMessages: false,
    };
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ==================== INITIALIZATION ====================

  /**
   * Initialize notification service
   * - Load settings
   * - Register for push notifications
   * - Setup listeners
   */
  async initialize(): Promise<string | null> {
    if (this.isInitialized) {
      logger.info('NotificationService already initialized');
      return this.pushToken;
    }

    try {
      // Load saved settings
      await this.loadSettings();
      
      // Register for push notifications
      const token = await this.registerForPushNotifications();
      
      // Setup listeners
      this.setupListeners();
      
      // Load scheduled reminders
      await this.loadScheduledReminders();
      
      this.isInitialized = true;
      logger.info('NotificationService initialized successfully', { pushToken: token });
      
      return token;
    } catch (error) {
      logger.error('Error initializing NotificationService', error);
      return null;
    }
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
    logger.info('NotificationService cleaned up');
  }

  // ==================== PUSH NOTIFICATIONS ====================

  /**
   * Register for push notifications
   * Get Expo push token and configure channels
   */
  private async registerForPushNotifications(): Promise<string | null> {
    // Check if device supports push notifications
    if (!Device.isDevice) {
      logger.warn('Push notifications only work on physical devices');
      return null;
    }

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn('Push notification permission denied');
        return null;
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.pushToken = tokenData.data;
      await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, this.pushToken);
      
      logger.info('Push token obtained', { token: this.pushToken });

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'MediBot Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#667eea',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
      }

      return this.pushToken;
    } catch (error) {
      logger.error('Error registering for push notifications', error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  async registerWithBackend(userId: string): Promise<void> {
    if (!this.pushToken) {
      logger.warn('No push token available to register');
      return;
    }

    try {
      await notificationsApi.registerDevice({
        userId,
        deviceToken: this.pushToken,
        platform: Platform.OS as 'ios' | 'android',
      });
      
      logger.info('Push token registered with backend', { userId });
    } catch (error) {
      logger.error('Error registering push token with backend', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Unregister device from backend
   */
  async unregisterFromBackend(): Promise<void> {
    if (!this.pushToken) {
      return;
    }

    try {
      await notificationsApi.unregisterDevice(this.pushToken);
      logger.info('Device unregistered from backend');
    } catch (error) {
      logger.error('Error unregistering device', error);
    }
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  // ==================== NOTIFICATION LISTENERS ====================

  /**
   * Setup notification listeners
   */
  private setupListeners(): void {
    // Listener for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        logger.info('Notification received', notification);
        this.addToHistory({
          id: notification.request.identifier,
          title: notification.request.content.title || 'Notification',
          body: notification.request.content.body || '',
          timestamp: new Date(),
          type: (notification.request.content.data?.type as string) || 'general',
          read: false,
          data: notification.request.content.data,
        });
      }
    );

    // Listener for notification interactions
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        logger.info('Notification tapped', response);
        const notificationId = response.notification.request.identifier;
        this.markAsRead(notificationId);
      }
    );
  }

  // ==================== LOCAL NOTIFICATIONS ====================

  /**
   * Send local notification immediately
   */
  async sendLocalNotification(notification: LocalNotification): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger: notification.trigger || null,
      });

      logger.info('Local notification scheduled', { id: notificationId });
      return notificationId;
    } catch (error) {
      logger.error('Error sending local notification', error);
      throw new Error('Failed to send notification');
    }
  }

  /**
   * Schedule reminder
   */
  async scheduleReminder(reminder: ReminderRequest): Promise<string> {
    try {
      const reminderId = reminder.id || `reminder_${Date.now()}`;
      
      // Calculate trigger time
      const trigger: Notifications.DateTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.date,
      };

      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          data: {
            type: reminder.type,
            priority: reminder.priority,
            reminderId,
            ...reminder.data,
          },
          sound: 'default',
          badge: 1,
        },
        trigger,
      });

      // Save reminder
      const reminderWithId = { ...reminder, id: reminderId };
      this.scheduledReminders.set(reminderId, reminderWithId);
      await this.saveScheduledReminders();

      logger.info('Reminder scheduled', { reminderId, notificationId, date: reminder.date });
      return reminderId;
    } catch (error) {
      logger.error('Error scheduling reminder', error);
      throw new Error('Failed to schedule reminder');
    }
  }

  /**
   * Cancel scheduled reminder
   */
  async cancelReminder(reminderId: string): Promise<void> {
    try {
      // Find all notifications with this reminder ID
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.reminderId === reminderId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }

      this.scheduledReminders.delete(reminderId);
      await this.saveScheduledReminders();

      logger.info('Reminder cancelled', { reminderId });
    } catch (error) {
      logger.error('Error cancelling reminder', error);
      throw new Error('Failed to cancel reminder');
    }
  }

  /**
   * Get all scheduled reminders
   */
  getScheduledReminders(): ReminderRequest[] {
    return Array.from(this.scheduledReminders.values());
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledReminders.clear();
      await this.saveScheduledReminders();
      logger.info('All notifications cancelled');
    } catch (error) {
      logger.error('Error cancelling all notifications', error);
    }
  }

  // ==================== BACKEND NOTIFICATIONS ====================

  /**
   * Fetch notifications from backend
   */
  async fetchNotifications(userId: string): Promise<ApiNotification[]> {
    try {
      const notifications = await notificationsApi.getNotifications(userId);
      logger.info('Fetched notifications from backend', { count: notifications.length });
      return notifications;
    } catch (error) {
      logger.error('Error fetching notifications', error);
      return [];
    }
  }

  /**
   * Mark notification as read (backend)
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await notificationsApi.markAsRead(notificationId);
      logger.info('Notification marked as read', { notificationId });
    } catch (error) {
      logger.error('Error marking notification as read', error);
    }
  }

  /**
   * Mark all notifications as read (backend)
   */
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await notificationsApi.markAllAsRead(userId);
      logger.info('All notifications marked as read', { userId });
    } catch (error) {
      logger.error('Error marking all as read', error);
    }
  }

  /**
   * Delete notification (backend)
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await notificationsApi.deleteNotification(notificationId);
      logger.info('Notification deleted', { notificationId });
    } catch (error) {
      logger.error('Error deleting notification', error);
    }
  }

  // ==================== SETTINGS ====================

  /**
   * Get notification settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Update notification settings
   */
  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      logger.info('Notification settings updated', this.settings);
    } catch (error) {
      logger.error('Error updating settings', error);
      throw new Error('Failed to update settings');
    }
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        this.settings = JSON.parse(stored);
        logger.info('Notification settings loaded');
      }
    } catch (error) {
      logger.error('Error loading settings', error);
    }
  }

  // ==================== HISTORY ====================

  /**
   * Get notification history
   */
  getHistory(): NotificationHistory[] {
    return [...this.notificationHistory];
  }

  /**
   * Add notification to history
   */
  private addToHistory(notification: NotificationHistory): void {
    this.notificationHistory.unshift(notification);
    
    // Keep only last 100 notifications
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(0, 100);
    }

    // Save to storage (async, don't wait)
    this.saveHistory().catch((error) => {
      logger.error('Error saving notification history', error);
    });
  }

  /**
   * Mark notification as read in history
   */
  private markAsRead(notificationId: string): void {
    const notification = this.notificationHistory.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveHistory().catch((error) => {
        logger.error('Error saving notification history', error);
      });
    }
  }

  /**
   * Clear notification history
   */
  async clearHistory(): Promise<void> {
    try {
      this.notificationHistory = [];
      await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
      logger.info('Notification history cleared');
    } catch (error) {
      logger.error('Error clearing history', error);
    }
  }

  /**
   * Save history to storage
   */
  private async saveHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.notificationHistory));
    } catch (error) {
      logger.error('Error saving history', error);
    }
  }

  // ==================== STORAGE HELPERS ====================

  /**
   * Load scheduled reminders from storage
   */
  private async loadScheduledReminders(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED);
      if (stored) {
        const reminders: ReminderRequest[] = JSON.parse(stored);
        reminders.forEach((reminder) => {
          if (reminder.id) {
            this.scheduledReminders.set(reminder.id, reminder);
          }
        });
        logger.info('Scheduled reminders loaded', { count: reminders.length });
      }
    } catch (error) {
      logger.error('Error loading scheduled reminders', error);
    }
  }

  /**
   * Save scheduled reminders to storage
   */
  private async saveScheduledReminders(): Promise<void> {
    try {
      const reminders = Array.from(this.scheduledReminders.values());
      await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED, JSON.stringify(reminders));
    } catch (error) {
      logger.error('Error saving scheduled reminders', error);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if notifications are enabled in device settings
   */
  async checkPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear all badges
   */
  async clearBadges(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  // ==================== BACKWARD COMPATIBILITY METHODS ====================

  /**
   * Send emergency notification (backward compatibility)
   * @deprecated Use scheduleReminder with type='custom' and priority='urgent'
   */
  async sendEmergencyNotification(message: string, data?: any): Promise<string | null> {
    try {
      return await this.sendLocalNotification({
        title: '🚨 EMERGENCY ALERT',
        body: message,
        data: {
          type: 'emergency',
          priority: 'urgent',
          ...data,
        },
      });
    } catch (error) {
      logger.error('Error sending emergency notification', error);
      return null;
    }
  }

  /**
   * Schedule appointment reminder (backward compatibility)
   * @deprecated Use scheduleReminder with type='appointment'
   */
  async scheduleAppointmentReminder(
    date: Date,
    title: string,
    minutesBefore: number = 60
  ): Promise<string> {
    const reminderDate = new Date(date.getTime() - minutesBefore * 60 * 1000);
    
    return await this.scheduleReminder({
      title: `Appointment Reminder`,
      body: title,
      date: reminderDate,
      type: 'appointment',
      priority: 'high',
      data: {
        appointmentDate: date.toISOString(),
        minutesBefore,
      },
    });
  }

  /**
   * Schedule follow-up reminder (backward compatibility)
   * @deprecated Use scheduleReminder with type='follow-up'
   */
  async scheduleFollowUpReminder(
    caseTitle: string,
    daysUntilFollowup: number
  ): Promise<string> {
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + daysUntilFollowup);
    
    return await this.scheduleReminder({
      title: 'Follow-up Reminder',
      body: `Time for follow-up on: ${caseTitle}`,
      date: followUpDate,
      type: 'follow-up',
      priority: 'normal',
      data: {
        caseTitle,
        daysUntilFollowup,
      },
    });
  }

  /**
   * Add notification listener (backward compatibility)
   * @deprecated Listeners are automatically set up in initialize()
   */
  addCrossPlatformNotificationListener(
    callback: (categoryId: string, data: any) => void
  ): { remove: () => void } {
    const listener = Notifications.addNotificationResponseReceivedListener((response) => {
      const categoryId = response.notification.request.content.categoryIdentifier || 'default';
      const data = response.notification.request.content.data || {};
      callback(categoryId, data);
    });

    return {
      remove: () => listener.remove(),
    };
  }
}

// ==================== EXPORTS ====================

// Singleton instance for direct use
export const notificationService = NotificationService.getInstance();

// Export class for getInstance() pattern (backward compatibility)
export default NotificationService;
