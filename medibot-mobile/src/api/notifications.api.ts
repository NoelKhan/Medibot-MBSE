/**
 * Notifications API
 * ==================
 * Pure API calls to notification endpoints
 * No business logic - just HTTP calls
 */

import httpClient from './client';

// Request Types
export interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendNotificationRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface RegisterDeviceRequest {
  userId: string;
  deviceToken: string;
  platform: 'ios' | 'android';
}

/**
 * Get notifications for user
 */
export async function getNotifications(userId: string): Promise<PushNotification[]> {
  return httpClient.get<PushNotification[]>(`/api/notifications?userId=${userId}`);
}

/**
 * Get single notification
 */
export async function getNotification(notificationId: string): Promise<PushNotification> {
  return httpClient.get<PushNotification>(`/api/notifications/${notificationId}`);
}

/**
 * Send notification
 */
export async function sendNotification(data: SendNotificationRequest): Promise<PushNotification> {
  return httpClient.post<PushNotification>('/api/notifications', data);
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  return httpClient.patch<void>(`/api/notifications/${notificationId}/read`);
}

/**
 * Mark all notifications as read for user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  return httpClient.post<void>(`/api/notifications/read-all`, { userId });
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  return httpClient.delete<void>(`/api/notifications/${notificationId}`);
}

/**
 * Register device token for push notifications
 */
export async function registerDevice(data: RegisterDeviceRequest): Promise<void> {
  return httpClient.post<void>('/api/notifications/register-device', data);
}

/**
 * Unregister device token
 */
export async function unregisterDevice(deviceToken: string): Promise<void> {
  return httpClient.post<void>('/api/notifications/unregister-device', { deviceToken });
}

// Export as object for convenience
export const notificationsApi = {
  getNotifications,
  getNotification,
  sendNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  registerDevice,
  unregisterDevice,
};
