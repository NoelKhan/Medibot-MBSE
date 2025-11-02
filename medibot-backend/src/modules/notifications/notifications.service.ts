/**
 * Notifications Service
 * =====================
 * Handles push notifications via Expo Push Notification service
 * and manages notification preferences
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from './entities/notification.entity';
import { NotificationPreferences } from './entities/notification-preferences.entity';
import {
  SendNotificationDto,
  UpdateNotificationPreferencesDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private expo: Expo;

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreferences)
    private preferencesRepository: Repository<NotificationPreferences>,
  ) {
    this.expo = new Expo();
  }

  /**
   * Send push notification to user
   */
  async sendPushNotification(dto: SendNotificationDto): Promise<Notification> {
    // Get user preferences
    const preferences = await this.getOrCreatePreferences(dto.userId);

    // Check if push notifications are enabled
    if (!preferences.pushEnabled) {
      this.logger.debug(
        `Push notifications disabled for user ${dto.userId}`,
      );
      return this.createNotificationRecord(dto, NotificationStatus.FAILED, 'Push notifications disabled');
    }

    const pushToken = dto.pushToken || preferences.pushToken;

    if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
      this.logger.warn(`Invalid push token for user ${dto.userId}`);
      return this.createNotificationRecord(dto, NotificationStatus.FAILED, 'Invalid push token');
    }

    // Check quiet hours
    if (this.isQuietHours(preferences)) {
      this.logger.debug(
        `Quiet hours active for user ${dto.userId}, notification delayed`,
      );
      return this.createNotificationRecord(dto, NotificationStatus.PENDING, 'Quiet hours active');
    }

    try {
      const message: ExpoPushMessage = {
        to: pushToken,
        sound: 'default',
        title: dto.title,
        body: dto.body,
        data: dto.data || {},
        priority: 'high',
      };

      const ticketChunk = await this.expo.sendPushNotificationsAsync([
        message,
      ]);
      const ticket = ticketChunk[0] as ExpoPushTicket;

      if (ticket.status === 'error') {
        this.logger.error(
          `Error sending notification: ${ticket.message}`,
        );
        return this.createNotificationRecord(
          dto,
          NotificationStatus.FAILED,
          ticket.message,
        );
      }

      this.logger.log(
        `Notification sent successfully to user ${dto.userId}`,
      );
      return this.createNotificationRecord(dto, NotificationStatus.SENT);
    } catch (error) {
      this.logger.error(
        `Failed to send push notification: ${error.message}`,
        error.stack,
      );
      return this.createNotificationRecord(
        dto,
        NotificationStatus.FAILED,
        error.message,
      );
    }
  }

  /**
   * Create notification record in database
   */
  private async createNotificationRecord(
    dto: SendNotificationDto,
    status: NotificationStatus,
    errorMessage?: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data,
      status,
      pushToken: dto.pushToken,
      sentAt: status === NotificationStatus.SENT ? new Date() : null,
      errorMessage,
    });

    return this.notificationRepository.save(notification);
  }

  /**
   * Get user notification history
   */
  async getUserNotifications(
    userId: string,
    limit: number = 50,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.read = true;
    notification.readAt = new Date();
    notification.status = NotificationStatus.READ;

    return this.notificationRepository.save(notification);
  }

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true, readAt: new Date(), status: NotificationStatus.READ },
    );
  }

  /**
   * Get or create user notification preferences
   */
  async getOrCreatePreferences(
    userId: string,
  ): Promise<NotificationPreferences> {
    let preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      preferences = this.preferencesRepository.create({ userId });
      preferences = await this.preferencesRepository.save(preferences);
    }

    return preferences;
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    return this.getOrCreatePreferences(userId);
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferences> {
    const preferences = await this.getOrCreatePreferences(userId);

    // Update preferences
    Object.assign(preferences, dto);

    return this.preferencesRepository.save(preferences);
  }

  /**
   * Register device push token
   */
  async registerPushToken(
    userId: string,
    pushToken: string,
    deviceType?: string,
    appVersion?: string,
  ): Promise<NotificationPreferences> {
    if (!Expo.isExpoPushToken(pushToken)) {
      throw new Error('Invalid Expo push token');
    }

    return this.updatePreferences(userId, {
      pushToken,
      pushEnabled: true,
      deviceType,
      appVersion,
    });
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHoursEnabled || !preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Send appointment reminder notification
   */
  async sendAppointmentReminder(
    userId: string,
    doctorName: string,
    appointmentDate: Date,
    timeUntil: string,
  ): Promise<Notification> {
    return this.sendPushNotification({
      userId,
      type: NotificationType.APPOINTMENT_REMINDER,
      title: '⏰ Appointment Reminder',
      body: `Your appointment with Dr. ${doctorName} is ${timeUntil}`,
      data: {
        appointmentDate: appointmentDate.toISOString(),
        doctorName,
      },
    });
  }

  /**
   * Send appointment confirmation notification
   */
  async sendAppointmentConfirmation(
    userId: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<Notification> {
    return this.sendPushNotification({
      userId,
      type: NotificationType.APPOINTMENT_CONFIRMATION,
      title: '✅ Appointment Confirmed',
      body: `Your appointment with Dr. ${doctorName} is confirmed for ${appointmentDate.toLocaleString()}`,
      data: {
        appointmentDate: appointmentDate.toISOString(),
        doctorName,
      },
    });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async deleteOldNotifications(daysOld: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Deleted notifications older than ${daysOld} days`);
  }
}
