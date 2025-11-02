/**
 * Reminder Entity
 * ===============
 * Stores scheduled reminders for appointments, medications, etc.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  VersionColumn,
} from 'typeorm';
import { User } from '../../../database/entities/user.entity';

export enum ReminderType {
  APPOINTMENT = 'appointment',
  MEDICATION = 'medication',
  FOLLOWUP = 'followup',
  TEST = 'test',
  GENERAL = 'general',
}

export enum ReminderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DISMISSED = 'dismissed',
  COMPLETED = 'completed',
}

export enum ReminderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('reminders')
@Index(['userId', 'status', 'reminderTime']) // Composite index for common queries
@Index(['appointmentId']) // Index for appointment lookups
@Index(['status', 'reminderTime']) // Index for due reminders cron job
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Optimistic locking for concurrent updates
  @VersionColumn()
  version: number;

  @Column()
  @Index() // Individual index for user queries
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ReminderType,
    default: ReminderType.GENERAL,
  })
  @Index() // Index for filtering by type
  type: ReminderType;

  @Column({ length: 255 }) // Add length constraint
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'timestamp' })
  @Index() // Index for time-based queries (very important for cron jobs)
  reminderTime: Date;

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.PENDING,
  })
  @Index() // Index for status filtering
  status: ReminderStatus;

  @Column({
    type: 'enum',
    enum: ReminderPriority,
    default: ReminderPriority.MEDIUM,
  })
  priority: ReminderPriority;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  recurring: boolean;

  @Column({ type: 'varchar', nullable: true })
  recurringPattern: string; // e.g., 'daily', 'weekly', 'monthly'

  @Column({ type: 'int', nullable: true })
  recurringInterval: number; // e.g., every 2 days

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  // Reference IDs for related entities
  @Column({ nullable: true })
  appointmentId: string;

  @Column({ nullable: true })
  medicationId: string;

  @Column({ nullable: true })
  caseId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
