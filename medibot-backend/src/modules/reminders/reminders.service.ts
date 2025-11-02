/**
 * Reminders Service
 * =================
 * Handles scheduled reminders for appointments, medications, and custom reminders
 * Integrates with NotificationsService and EmailService
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Reminder,
  ReminderType,
  ReminderStatus,
} from './entities/reminder.entity';
import { CreateReminderDto, UpdateReminderDto } from './dto/reminder.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectRepository(Reminder)
    private reminderRepository: Repository<Reminder>,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}

  /**
   * Create a new reminder
   */
  async createReminder(
    userId: string,
    dto: CreateReminderDto,
  ): Promise<Reminder> {
    const reminder = this.reminderRepository.create({
      userId,
      ...dto,
    });

    const savedReminder = await this.reminderRepository.save(reminder);
    this.logger.log(`Reminder created for user ${userId}: ${reminder.title}`);

    return savedReminder;
  }

  /**
   * Create appointment reminder (1 hour before)
   */
  async createAppointmentReminder(
    userId: string,
    appointmentId: string,
    appointmentDate: Date,
    doctorName: string,
    reminderMinutesBefore: number = 60,
  ): Promise<Reminder[]> {
    const reminders: Reminder[] = [];

    // Get user preferences for reminder timing
    const preferences = await this.notificationsService.getPreferences(userId);
    
    // Primary reminder (default 1 hour before or user's preference)
    const primaryReminderTime = new Date(appointmentDate);
    primaryReminderTime.setMinutes(
      primaryReminderTime.getMinutes() - (preferences.reminderTimingPrimary || reminderMinutesBefore),
    );

    const primaryReminder = await this.createReminder(userId, {
      type: ReminderType.APPOINTMENT,
      title: 'Upcoming Appointment',
      description: `Appointment with ${doctorName} in ${preferences.reminderTimingPrimary || reminderMinutesBefore} minutes`,
      reminderTime: primaryReminderTime,
      appointmentId,
      metadata: {
        doctorName,
        appointmentDate: appointmentDate.toISOString(),
        minutesBefore: preferences.reminderTimingPrimary || reminderMinutesBefore,
      },
    });
    reminders.push(primaryReminder);

    // Secondary reminder (24 hours before if enabled)
    if (preferences.reminderTimingSecondary) {
      const secondaryReminderTime = new Date(appointmentDate);
      secondaryReminderTime.setMinutes(
        secondaryReminderTime.getMinutes() - preferences.reminderTimingSecondary,
      );

      // Only create if the reminder time is in the future
      if (secondaryReminderTime > new Date()) {
        const secondaryReminder = await this.createReminder(userId, {
          type: ReminderType.APPOINTMENT,
          title: 'Appointment Tomorrow',
          description: `Don't forget your appointment with ${doctorName}`,
          reminderTime: secondaryReminderTime,
          appointmentId,
          metadata: {
            doctorName,
            appointmentDate: appointmentDate.toISOString(),
            minutesBefore: preferences.reminderTimingSecondary,
          },
        });
        reminders.push(secondaryReminder);
      }
    }

    this.logger.log(
      `Created ${reminders.length} appointment reminder(s) for user ${userId}`,
    );
    return reminders;
  }

  /**
   * Get user reminders
   */
  async getUserReminders(
    userId: string,
    includeCompleted: boolean = false,
  ): Promise<Reminder[]> {
    const query: any = { userId };

    if (!includeCompleted) {
      query.status = ReminderStatus.PENDING;
    }

    return this.reminderRepository.find({
      where: query,
      order: { reminderTime: 'ASC' },
    });
  }

  /**
   * Get upcoming reminders (next 7 days)
   */
  async getUpcomingReminders(userId: string): Promise<Reminder[]> {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return this.reminderRepository.find({
      where: {
        userId,
        status: ReminderStatus.PENDING,
        reminderTime: MoreThan(now),
      },
      order: { reminderTime: 'ASC' },
      take: 20,
    });
  }

  /**
   * Update reminder
   */
  async updateReminder(
    id: string,
    userId: string,
    dto: UpdateReminderDto,
  ): Promise<Reminder> {
    const reminder = await this.reminderRepository.findOne({
      where: { id, userId },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    Object.assign(reminder, dto);
    return this.reminderRepository.save(reminder);
  }

  /**
   * Cancel reminder
   */
  async cancelReminder(id: string, userId: string): Promise<void> {
    const reminder = await this.reminderRepository.findOne({
      where: { id, userId },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    reminder.status = ReminderStatus.DISMISSED;
    await this.reminderRepository.save(reminder);

    this.logger.log(`Reminder ${id} cancelled by user ${userId}`);
  }

  /**
   * Cancel all appointment reminders
   */
  async cancelAppointmentReminders(
    appointmentId: string,
    userId: string,
  ): Promise<void> {
    await this.reminderRepository.update(
      { appointmentId, userId, status: ReminderStatus.PENDING },
      { status: ReminderStatus.DISMISSED },
    );

    this.logger.log(
      `All reminders for appointment ${appointmentId} cancelled`,
    );
  }

  /**
   * Process due reminders (runs every minute)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processDueReminders(): Promise<void> {
    const now = new Date();
    const dueReminders = await this.reminderRepository.find({
      where: {
        status: ReminderStatus.PENDING,
        reminderTime: LessThan(now),
      },
      take: 100, // Process max 100 at a time
    });

    if (dueReminders.length === 0) {
      return;
    }

    this.logger.log(`Processing ${dueReminders.length} due reminders`);

    for (const reminder of dueReminders) {
      try {
        await this.sendReminder(reminder);
      } catch (error) {
        this.logger.error(
          `Failed to send reminder ${reminder.id}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Send individual reminder via push notification and email
   */
  private async sendReminder(reminder: Reminder): Promise<void> {
    try {
      // Send push notification
      await this.notificationsService.sendPushNotification({
        userId: reminder.userId,
        type: this.mapReminderTypeToNotificationType(reminder.type),
        title: reminder.title,
        body: reminder.description || '',
        data: {
          reminderId: reminder.id,
          ...(reminder.metadata || {}),
        },
      });

      // Send email for appointment reminders
      if (reminder.type === ReminderType.APPOINTMENT && reminder.metadata) {
        const preferences = await this.notificationsService.getPreferences(
          reminder.userId,
        );

        if (preferences.emailEnabled && preferences.emailAppointmentReminder) {
          // Get user email (would need to query User entity)
          // For now, we'll skip email or implement when User module is available
          this.logger.debug(
            `Email reminder sending not yet implemented for reminder ${reminder.id}`,
          );
        }
      }

      // Mark as sent
      reminder.status = ReminderStatus.SENT;
      reminder.sentAt = new Date();
      await this.reminderRepository.save(reminder);

      this.logger.log(`Reminder ${reminder.id} sent successfully`);

      // Handle recurring reminders
      if (reminder.recurring) {
        await this.scheduleNextRecurring(reminder);
      }
    } catch (error) {
      reminder.status = ReminderStatus.DISMISSED;
      reminder.errorMessage = error.message;
      await this.reminderRepository.save(reminder);
      throw error;
    }
  }

  /**
   * Schedule next occurrence of recurring reminder
   */
  private async scheduleNextRecurring(reminder: Reminder): Promise<void> {
    if (!reminder.recurringPattern || !reminder.recurringInterval) {
      return;
    }

    const nextTime = new Date(reminder.reminderTime);

    switch (reminder.recurringPattern) {
      case 'daily':
        nextTime.setDate(nextTime.getDate() + reminder.recurringInterval);
        break;
      case 'weekly':
        nextTime.setDate(nextTime.getDate() + 7 * reminder.recurringInterval);
        break;
      case 'monthly':
        nextTime.setMonth(nextTime.getMonth() + reminder.recurringInterval);
        break;
      default:
        this.logger.warn(
          `Unknown recurring pattern: ${reminder.recurringPattern}`,
        );
        return;
    }

    // Create new reminder for next occurrence
    await this.createReminder(reminder.userId, {
      type: reminder.type,
      title: reminder.title,
      description: reminder.description,
      reminderTime: nextTime,
      recurring: true,
      recurringPattern: reminder.recurringPattern,
      recurringInterval: reminder.recurringInterval,
      metadata: reminder.metadata,
      appointmentId: reminder.appointmentId,
      medicationId: reminder.medicationId,
      caseId: reminder.caseId,
    });

    this.logger.log(
      `Next recurring reminder scheduled for ${nextTime.toISOString()}`,
    );
  }

  /**
   * Map reminder type to notification type
   */
  private mapReminderTypeToNotificationType(
    type: ReminderType,
  ): NotificationType {
    switch (type) {
      case ReminderType.APPOINTMENT:
        return NotificationType.APPOINTMENT_REMINDER;
      case ReminderType.MEDICATION:
        return NotificationType.MEDICATION_REMINDER;
      case ReminderType.FOLLOWUP:
        return NotificationType.CASE_UPDATE;
      default:
        return NotificationType.GENERAL;
    }
  }

  /**
   * Delete old completed reminders (cleanup job)
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldReminders(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days

    await this.reminderRepository
      .createQueryBuilder()
      .delete()
      .where('status IN (:...statuses)', {
        statuses: [ReminderStatus.SENT, ReminderStatus.DISMISSED, ReminderStatus.COMPLETED],
      })
      .andWhere('updatedAt < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log('Old reminders cleaned up');
  }
}
