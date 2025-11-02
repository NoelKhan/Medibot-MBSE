/**
 * Enhanced Notification Service with Backend Integration
 * Handles Expo push notifications and syncs with backend API
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationsApiService, type NotificationPreferences } from './NotificationsApiService';
import { createLogger } from './Logger';

const logger = createLogger('EnhancedNotificationService');

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

export interface LocalNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
  trigger?: Notifications.NotificationTriggerInput | null;
}

class EnhancedNotificationService {
  private static instance: EnhancedNotificationService;
  private pushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  private constructor() {}

  public static getInstance(): EnhancedNotificationService {
    if (!EnhancedNotificationService.instance) {
      EnhancedNotificationService.instance = new EnhancedNotificationService();
    }
    return EnhancedNotificationService.instance;
  }

  /**
   * Initialize push notifications
   * Request permissions and register token with backend
   */
  async initialize(): Promise<string | null> {
    try {
      // Check if device supports push notifications
      if (!Device.isDevice) {
        logger.warn('Push notifications only work on physical devices');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn('Failed to get push notification permissions');
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.pushToken = tokenData.data;
      logger.info('Push token obtained', { pushToken: this.pushToken });

      // Register token with backend
      await this.registerWithBackend();

      // Setup notification listeners
      this.setupListeners();

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return this.pushToken;
    } catch (error) {
      logger.error('Error initializing push notifications', error as Error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  private async registerWithBackend(): Promise<void> {
    if (!this.pushToken) return;

    try {
      const deviceType = Platform.OS as 'ios' | 'android' | 'web';
      const appVersion = Constants.expoConfig?.version || '1.0.0';

      await notificationsApiService.registerPushToken({
        pushToken: this.pushToken,
        deviceType,
        appVersion,
      });

      logger.info('Push token registered with backend');
    } catch (error) {
      // Silently fail if backend is offline - token will be registered when backend comes online
      logger.warn('Backend offline - push token registration will be retried later', error as Error);
      // Don't throw error - allow app to continue without backend
    }
  }

  /**
   * Setup notification event listeners
   */
  private setupListeners(): void {
    // Listener for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      logger.info('Notification received', { 
        title: notification.request.content.title,
        id: notification.request.identifier 
      });
      // You can add custom handling here
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      logger.info('Notification tapped', { 
        id: response.notification.request.identifier,
        actionIdentifier: response.actionIdentifier
      });
      // Handle navigation based on notification data
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle notification tap/interaction
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    if (data.type === 'appointment_reminder' && data.appointmentId) {
      // Navigate to appointment detail
      logger.info('Navigate to appointment', { appointmentId: data.appointmentId });
    } else if (data.type === 'case_update' && data.caseId) {
      // Navigate to case detail
      logger.info('Navigate to case', { caseId: data.caseId });
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(notification: LocalNotification): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: notification.trigger || null,
      });

      logger.info('Local notification scheduled', { identifier });
      return identifier;
    } catch (error) {
      logger.error('Error scheduling local notification', error as Error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      logger.info('Notification cancelled', { identifier });
    } catch (error) {
      logger.error('Error cancelling notification', error as Error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      logger.info('All notifications cancelled');
    } catch (error) {
      logger.error('Error cancelling all notifications', error as Error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      logger.error('Error getting scheduled notifications', error as Error);
      return [];
    }
  }

  /**
   * Get notification badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      logger.error('Error getting badge count', error as Error);
      return 0;
    }
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      logger.error('Error setting badge count', error as Error);
    }
  }

  /**
   * Clear all notifications from notification center
   */
  async clearNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);
      logger.info('Notifications cleared');
    } catch (error) {
      logger.error('Error clearing notifications', error as Error);
    }
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Fetch notification preferences from backend
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      return await notificationsApiService.getPreferences();
    } catch (error) {
      logger.error('Error fetching notification preferences', error as Error);
      // Return default preferences
      return {
        pushEnabled: true,
        emailEnabled: true,
        emailAppointmentConfirmation: true,
        emailAppointmentReminder: true,
        emailMedicationReminder: true,
        emailMarketingUpdates: false,
        reminderTimingPrimary: 60, // 1 hour before
        reminderTimingSecondary: 1440, // 24 hours before
        reminderTimingCustom: false,
        quietHoursEnabled: false,
      };
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      return await notificationsApiService.updatePreferences(preferences);
    } catch (error) {
      logger.error('Error updating notification preferences', error as Error);
      throw error;
    }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

export default EnhancedNotificationService;
export const enhancedNotificationService = EnhancedNotificationService.getInstance();
