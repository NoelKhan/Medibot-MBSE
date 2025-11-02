import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { createLogger } from './Logger';
import { 
  NotificationData, 
  NotificationCategory, 
  ScheduledNotification 
} from '../types/Notification';

const logger = createLogger('PushNotificationService');

// Re-export types for backward compatibility
export { NotificationData, NotificationCategory, ScheduledNotification };

// Configure how notifications are handled when the app is running
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class PushNotificationService {
  private static instance: PushNotificationService;
  private expoPushToken: string | null = null;
  private initialized = false;

  constructor() {
    // Mobile-only push notifications
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialize push notifications and get permission
   */
  public async initialize(): Promise<boolean> {
    try {
      if (this.initialized) {
        return !!this.expoPushToken;
      }

      // Initialize mobile push notifications
      await this.setupNotificationCategories();
      const token = await this.registerForPushNotificationsAsync();
      this.expoPushToken = token;
      this.initialized = true;
      logger.info('Mobile push notifications initialized', { tokenReceived: !!token });
      return !!token;
    } catch (error) {
      logger.error('Failed to initialize notifications', error as Error);
      return false;
    }
  }

  /**
   * Get the Expo push token
   */
  public getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Setup notification categories with actions
   */
  private async setupNotificationCategories(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync(NotificationCategory.EMERGENCY, [
        {
          identifier: 'call_emergency',
          buttonTitle: 'Call 911',
          options: {
            isDestructive: true,
          },
        },
        {
          identifier: 'view_details',
          buttonTitle: 'View Details',
          options: {
            opensAppToForeground: true,
          },
        },
      ]);

      await Notifications.setNotificationCategoryAsync(NotificationCategory.APPOINTMENT, [
        {
          identifier: 'confirm_appointment',
          buttonTitle: 'Confirm',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'reschedule_appointment',
          buttonTitle: 'Reschedule',
          options: {
            opensAppToForeground: true,
          },
        },
      ]);

      await Notifications.setNotificationCategoryAsync(NotificationCategory.MEDICATION, [
        {
          identifier: 'taken_medication',
          buttonTitle: 'Mark as Taken',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'snooze_medication',
          buttonTitle: 'Remind Later',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);

      logger.info('Notification categories set up successfully');
    } catch (error) {
      logger.error('Failed to setup notification categories', error as Error);
    }
  }

  /**
   * Request notification permissions and register for push notifications
   */
  private async registerForPushNotificationsAsync(): Promise<string | null> {
    let token: string | null = null;

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        logger.warn('Failed to get push token - permission not granted');
        return null;
      }
      
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
          logger.warn('Push notifications: No EAS project ID configured - expected in development mode');
          return null;
        }
        
        token = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;
        logger.info('Push token obtained successfully');
      } catch (error) {
        logger.warn('Failed to get push token', { error: (error as Error).message });
        // Return null instead of throwing to prevent crashes
        return null;
      }
    } else {
      logger.warn('Must use physical device for Push Notifications');
    }

    // Android-specific configuration
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      // Emergency channel
      await Notifications.setNotificationChannelAsync('emergency', {
        name: 'Emergency Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0000',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
      });

      // Appointment channel
      await Notifications.setNotificationChannelAsync('appointments', {
        name: 'Appointment Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2196F3',
      });

      // Medication channel
      await Notifications.setNotificationChannelAsync('medications', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
      });
    }

    return token;
  }

  /**
   * Send immediate local notification
   */
  public async sendLocalNotification(notification: NotificationData): Promise<string | null> {
    try {
      // Use Expo notifications for mobile
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
          badge: notification.badge,
          categoryIdentifier: notification.categoryId,
          priority: notification.priority || 'default',
        },
        trigger: null, // Send immediately
      });

      logger.info('Mobile notification sent', { notificationId });
      return notificationId;
    } catch (error) {
      logger.error('Failed to send notification', error as Error);
      return null;
    }
  }

  /**
   * Schedule notification for later
   */
  public async scheduleNotification(notification: ScheduledNotification): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
          badge: notification.badge,
          categoryIdentifier: notification.categoryId,
          priority: notification.priority || 'default',
        },
        trigger: notification.trigger,
      });

      logger.info('Scheduled notification', { notificationId });
      return notificationId;
    } catch (error) {
      logger.error('Failed to schedule notification', error as Error);
      return null;
    }
  }

  /**
   * Send emergency notification
   */
  public async sendEmergencyNotification(message: string, data?: any): Promise<string | null> {
    // Use standard mobile notification
    return this.sendLocalNotification({
      title: '🚨 Medical Emergency Alert',
      body: message,
      data,
      categoryId: NotificationCategory.EMERGENCY,
      priority: 'max',
      channelId: 'emergency',
      sound: true,
    });
  }

  /**
   * Schedule appointment reminder
   */
  public async scheduleAppointmentReminder(
    appointmentDate: Date,
    doctorName: string,
    reminderMinutes: number = 60
  ): Promise<string | null> {
    // For mobile, schedule the notification
    const reminderTime = new Date(appointmentDate.getTime() - reminderMinutes * 60 * 1000);
    
    return this.scheduleNotification({
      title: '👩‍⚕️ Appointment Reminder',
      body: `Your appointment with ${doctorName} is in ${reminderMinutes} minutes`,
      data: { appointmentDate: appointmentDate.toISOString(), doctorName },
      categoryId: NotificationCategory.APPOINTMENT,
      channelId: 'appointments',
      trigger: { date: reminderTime } as Notifications.DateTriggerInput,
    });
  }

  /**
   * Schedule medication reminder
   */
  public async scheduleMedicationReminder(
    medicationName: string,
    dosage: string,
    time: Date
  ): Promise<string | null> {
    // For mobile, schedule the notification
    return this.scheduleNotification({
      title: '💊 Medication Reminder',
      body: `Time to take ${medicationName} - ${dosage}`,
      data: { medicationName, dosage },
      categoryId: NotificationCategory.MEDICATION,
      channelId: 'medications',
      trigger: { date: time } as Notifications.DateTriggerInput,
    });
  }

  /**
   * Schedule daily medication reminders
   */
  public async scheduleDailyMedicationReminder(
    medicationName: string,
    dosage: string,
    times: string[] // Array of times like ['08:00', '20:00']
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    // For mobile, schedule recurring notifications
    for (const time of times) {
      const [hours, minutes] = time.split(':').map(Number);
      
      try {
        const notificationId = await this.scheduleNotification({
          title: '💊 Daily Medication',
          body: `Time to take ${medicationName} - ${dosage}`,
          data: { medicationName, dosage, time },
          categoryId: NotificationCategory.MEDICATION,
          channelId: 'medications',
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
          } as Notifications.CalendarTriggerInput,
        });
        
        if (notificationId) {
          notificationIds.push(notificationId);
        }
      } catch (error) {
        logger.error('Failed to schedule medication reminder', error as Error);
      }
    }
    return notificationIds;
  }

  /**
   * Send health tip notification
   */
  public async sendHealthTip(tip: string): Promise<string | null> {
    // Use standard mobile notification
    return this.sendLocalNotification({
      title: '💡 Health Tip',
      body: tip,
      categoryId: NotificationCategory.HEALTH_TIP,
      priority: 'default',
    });
  }

  /**
   * Cancel a scheduled notification
   */
  public async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      logger.info('Cancelled notification', { notificationId });
    } catch (error) {
      logger.error('Failed to cancel notification', error as Error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  public async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      logger.info('Cancelled all notifications');
    } catch (error) {
      logger.error('Failed to cancel all notifications', error as Error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  public async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      logger.error('Failed to get scheduled notifications', error as Error);
      return [];
    }
  }

  /**
   * Handle notification response (when user taps on notification)
   */
  public addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Handle notification received while app is running
   */
  public addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Add cross-platform notification click listener
   */
  public addCrossPlatformNotificationListener(
    listener: (categoryId: string, data: any) => void
  ): () => void {
    // Use Expo notifications for mobile platforms
    const subscription = this.addNotificationResponseListener((response) => {
      const categoryId = response.notification.request.content.categoryIdentifier || 'general';
      const data = response.notification.request.content.data;
      listener(categoryId, data);
    });
    
    return () => subscription.remove();
  }
}