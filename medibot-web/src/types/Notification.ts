/**
 * Shared Notification Types
 * Used by notification services to avoid circular dependencies
 */

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

export interface WebNotificationTrigger {
  type: 'date' | 'delay' | 'daily' | 'weekly';
  date?: Date;
  delay?: number; // milliseconds
  hour?: number; // For daily/weekly
  minute?: number;
  weekday?: number; // 0-6 for weekly
}

export interface ScheduledNotification extends NotificationData {
  trigger: WebNotificationTrigger;
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
