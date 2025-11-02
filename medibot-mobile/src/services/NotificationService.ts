import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { API_CONFIG } from '../config/api.config';
import { createLogger } from './Logger';

const logger = createLogger('NotificationService');

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Notification types and interfaces
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

  // Initialize notification service
  async initialize(): Promise<void> {
    try {
      await this.loadSettings();
      await this.registerForPushNotificationsAsync();
      this.isInitialized = true;
      logger.info('NotificationService initialized successfully');
    } catch (error) {
      logger.error('Error initializing NotificationService', error);
    }
  }

  /**
   * Register for push notifications and get Expo push token
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) {
      logger.warn('Push notifications only work on physical devices');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn('Permission not granted for push notifications');
        return null;
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.pushToken = token.data;
      logger.info('Expo Push Token obtained', { token: token.data });

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'MediBot Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#667eea',
        });
      }

      return token.data;
    } catch (error) {
      logger.error('Error registering for push notifications', error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  async registerPushTokenWithBackend(userId: string, authToken?: string): Promise<void> {
    if (!this.pushToken) {
      logger.warn('No push token available');
      return;
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_CONFIG.baseURL}/api/notifications/register-token`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pushToken: this.pushToken,
          deviceType: Platform.OS,
          appVersion: Constants.expoConfig?.version || '1.0.0',
        }),
      });

      if (response.ok) {
        logger.info('Push token registered with backend');
      } else {
        logger.error('Failed to register push token with backend', { status: response.status });
      }
    } catch (error) {
      logger.error('Error registering push token with backend', error);
    }
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  // Settings Management
  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  async getSettings(): Promise<NotificationSettings> {
    if (!this.isInitialized) {
      await this.loadSettings();
    }
    return { ...this.settings };
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(this.settings));
    } catch (error) {
      logger.error('Error saving notification settings', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('@medibot_notification_settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      logger.error('Error loading notification settings', error);
    }
  }

  // Push Notifications
  async sendPushNotification(title: string, body: string, data?: any): Promise<string | null> {
    if (!this.settings.pushNotifications) {
      logger.info('Push notifications disabled');
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });

      await this.saveNotificationHistory({
        id: notificationId,
        title,
        body,
        timestamp: new Date(),
        type: 'push',
        read: false,
      });

      return notificationId;
    } catch (error) {
      logger.error('Error sending push notification', error);
      return null;
    }
  }

  async schedulePushNotification(title: string, body: string, date: Date, data?: any): Promise<string | null> {
    if (!this.settings.pushNotifications) {
      logger.info('Push notifications disabled');
      return null;
    }

    try {
      const seconds = Math.max(1, Math.floor((date.getTime() - Date.now()) / 1000));
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: 'timeInterval',
          seconds
        } as Notifications.TimeIntervalTriggerInput,
      });

      logger.info('Push notification scheduled', { date, title });
      return notificationId;
    } catch (error) {
      logger.error('Error scheduling push notification', error);
      return null;
    }
  }

  // Emergency-specific methods for the call system
  async sendEmergencyNotification(title: string, body: string): Promise<void> {
    if (!this.settings.emergencyNotifications) {
      logger.info('Emergency notifications disabled');
      return;
    }

    try {
      // Send push notification
      await this.sendPushNotification(title, body, { type: 'emergency', priority: 'critical' });

      // Show local alert as backup
      Alert.alert(title, body, [
        { text: 'OK', style: 'default' }
      ]);

      logger.info('Emergency notification sent successfully');
    } catch (error) {
      logger.error('Error sending emergency notification', error);
      // Fallback to alert only
      Alert.alert(title, body);
    }
  }

  async showEmergencyCallProgress(countdown: number): Promise<void> {
    const message = `Emergency call will be placed in ${countdown} seconds. Tap to cancel.`;
    
    await this.sendPushNotification(
      '🚨 Emergency Call Starting',
      message,
      { 
        type: 'emergency_countdown', 
        countdown,
        priority: 'critical'
      }
    );
  }

  // Simplified SMS function that opens SMS app
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.settings.smsNotifications) {
      logger.info('SMS notifications disabled');
      return false;
    }

    try {
      const smsUrl = Platform.select({
        ios: `sms:${phoneNumber}&body=${encodeURIComponent(message)}`,
        android: `sms:${phoneNumber}?body=${encodeURIComponent(message)}`,
        web: `sms:${phoneNumber}?body=${encodeURIComponent(message)}`, // Works on mobile browsers
        default: `sms:${phoneNumber}`
      });

      const supported = await Linking.canOpenURL(smsUrl);
      if (supported) {
        await Linking.openURL(smsUrl);
        
        await this.saveNotificationHistory({
          id: `sms_${Date.now()}`,
          title: 'SMS Opened',
          body: `SMS app opened for ${phoneNumber}`,
          timestamp: new Date(),
          type: 'sms',
          read: true,
        });
        return true;
      } else {
        Alert.alert('SMS Not Available', 'SMS is not available on this device');
        return false;
      }
    } catch (error) {
      logger.error('Error opening SMS', error);
      Alert.alert('SMS Error', 'Failed to open SMS app. Please send message manually.');
      return false;
    }
  }

  // Simplified email function that opens email app
  async sendEmail(
    to: string | string[], 
    subject: string, 
    body: string
  ): Promise<boolean> {
    if (!this.settings.emailNotifications) {
      logger.info('Email notifications disabled');
      return false;
    }    try {
      const recipients = Array.isArray(to) ? to.join(',') : to;
      const emailUrl = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      const supported = await Linking.canOpenURL(emailUrl);
      if (supported) {
        await Linking.openURL(emailUrl);
        
        await this.saveNotificationHistory({
          id: `email_${Date.now()}`,
          title: 'Email Opened',
          body: `Email app opened for ${recipients}`,
          timestamp: new Date(),
          type: 'email',
          read: true,
        });
        return true;
      } else {
        Alert.alert('Email Not Available', 'Email is not available on this device');
        return false;
      }
    } catch (error) {
      logger.error('Error opening email', error);
      Alert.alert('Email Error', 'Failed to open email app. Please send email manually.');
      return false;
    }
  }

  // Reminder management
  async scheduleReminder(reminder: ReminderRequest): Promise<string | null> {
    try {
      const reminderId = reminder.id || `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Schedule push notification
      const notificationId = await this.schedulePushNotification(
        reminder.title,
        reminder.body,
        reminder.date,
        { 
          type: 'reminder',
          reminderId,
          priority: reminder.priority
        }
      );

      if (notificationId) {
        // Store reminder details
        this.scheduledReminders.set(reminderId, { ...reminder, id: reminderId });
        await this.saveScheduledReminders();
        
        logger.info('Reminder scheduled', { reminderId });
        return reminderId;
      }
      
      return null;
    } catch (error) {
      logger.error('Error scheduling reminder', error);
      return null;
    }
  }

  // Cancel notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      logger.info('Notification cancelled', { notificationId });
    } catch (error) {
      logger.error('Error cancelling notification', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledReminders.clear();
      logger.info('All notifications cancelled');
    } catch (error) {
      logger.error('Error cancelling all notifications', error);
    }
  }

  // Notification history management
  private async saveNotificationHistory(notification: NotificationHistory): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      history.push(notification);
      
      // Keep only last 100 notifications
      const trimmedHistory = history.slice(-100);
      
      await AsyncStorage.setItem('@medibot_notification_history', JSON.stringify(trimmedHistory));
    } catch (error) {
      logger.error('Error saving notification history', error);
    }
  }

  async getNotificationHistory(): Promise<NotificationHistory[]> {
    try {
      const stored = await AsyncStorage.getItem('@medibot_notification_history');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Error loading notification history', error);
      return [];
    }
  }

  private async saveScheduledReminders(): Promise<void> {
    try {
      const reminders = Array.from(this.scheduledReminders.values());
      await AsyncStorage.setItem('@medibot_scheduled_reminders', JSON.stringify(reminders));
    } catch (error) {
      logger.error('Error saving scheduled reminders', error);
    }
  }

  async getScheduledReminders(): Promise<ReminderRequest[]> {
    try {
      const stored = await AsyncStorage.getItem('@medibot_scheduled_reminders');
      const reminders: ReminderRequest[] = stored ? JSON.parse(stored) : [];
      
      // Rebuild the Map
      this.scheduledReminders.clear();
      reminders.forEach(reminder => {
        if (reminder.id) {
          this.scheduledReminders.set(reminder.id, reminder);
        }
      });
      
      return reminders;
    } catch (error) {
      logger.error('Error loading scheduled reminders', error);
      return [];
    }
  }

  // Emergency contact notification
  async notifyEmergencyContacts(message: string, contacts: Array<{name: string, phone: string, email?: string}>): Promise<void> {
    logger.info('Notifying emergency contacts', { count: contacts.length });
    
    for (const contact of contacts) {
      try {
        // Send SMS if phone available
        if (contact.phone) {
          await this.sendSMS(contact.phone, message);
        }
        
        // Send email if available
        if (contact.email) {
          await this.sendEmail(contact.email, '🚨 Emergency Alert', message);
        }
      } catch (error) {
        logger.error('Error notifying emergency contact', { contact: contact.name, error });
      }
    }
  }
}

export default NotificationService;