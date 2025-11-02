/**
 * Shared Notification Types
 * Used by notification services to avoid circular dependencies
 */

import * as Notifications from 'expo-notifications';

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  categoryId?: string;
  sound?: boolean;
  badge?: number;
  priority?: 'default' | 'low' | 'high' | 'max';
  channelId?: string;
}

export interface ScheduledNotification extends NotificationData {
  trigger: Notifications.NotificationTriggerInput;
}

export enum NotificationCategory {
  EMERGENCY = 'emergency',
  APPOINTMENT = 'appointment', 
  MEDICATION = 'medication',
  HEALTH_TIP = 'health_tip',
  GENERAL = 'general'
}

export interface WebNotificationOptions {
  icon?: string;
  badgeIcon?: string;  // Renamed from 'badge' to avoid conflict with NotificationData.badge
  silent?: boolean;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}
