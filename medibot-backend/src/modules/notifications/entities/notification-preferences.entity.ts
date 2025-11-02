/**
 * User Notification Preferences Entity
 * =====================================
 * Stores user preferences for notifications and reminders
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../database/entities/user.entity';

@Entity('notification_preferences')
export class NotificationPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Push Notification Preferences
  @Column({ type: 'boolean', default: true })
  pushEnabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  pushToken: string;

  // Email Notification Preferences
  @Column({ type: 'boolean', default: true })
  emailEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  emailAppointmentConfirmation: boolean;

  @Column({ type: 'boolean', default: true })
  emailAppointmentReminder: boolean;

  @Column({ type: 'boolean', default: true })
  emailMedicationReminder: boolean;

  @Column({ type: 'boolean', default: false })
  emailMarketingUpdates: boolean;

  // Reminder Timing Preferences
  @Column({ type: 'int', default: 60 }) // minutes before appointment
  reminderTimingPrimary: number;

  @Column({ type: 'int', default: 1440, nullable: true }) // 24 hours = 1440 minutes
  reminderTimingSecondary: number;

  @Column({ type: 'boolean', default: false })
  reminderTimingCustom: boolean;

  // Quiet Hours
  @Column({ type: 'boolean', default: false })
  quietHoursEnabled: boolean;

  @Column({ type: 'time', nullable: true })
  quietHoursStart: string; // e.g., '22:00'

  @Column({ type: 'time', nullable: true })
  quietHoursEnd: string; // e.g., '08:00'

  // Device & Platform
  @Column({ type: 'varchar', nullable: true })
  deviceType: string; // 'ios', 'android', 'web'

  @Column({ type: 'varchar', nullable: true })
  appVersion: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
