/**
 * Push Notification Service (Web Implementation)
 * Uses browser Notification API
 */
import { createLogger } from './Logger';

const logger = createLogger('PushNotificationService');

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  category?: string;
  data?: Record<string, any>;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  private async checkPermission(): Promise<void> {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      logger.warn('Browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      logger.error('Failed to request notification permission', error as Error);
      return false;
    }
  }

  public async showNotification(notification: NotificationData): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: '/icon.png',
        tag: notification.id,
        data: notification.data,
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };
    } catch (error) {
      logger.error('Failed to show notification', error as Error);
    }
  }
}

export default PushNotificationService.getInstance();
