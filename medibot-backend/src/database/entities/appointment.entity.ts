/**
 * Appointment Entity
 * ===================
 * Doctor appointments and bookings
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  VersionColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('appointments')
@Index(['userId', 'appointmentDate'])
@Index(['doctorId', 'appointmentDate'])
@Index(['status', 'appointmentDate']) // For querying by status and date
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Optimistic locking for preventing double-booking
  @VersionColumn()
  version: number;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  doctorId: string;

  @Column({ type: 'date' })
  appointmentDate: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({
    type: 'enum',
    enum: ['in-person', 'telehealth'],
  })
  consultationType: string;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
    default: 'scheduled',
  })
  status: string;

  @Column()
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
    nullable: true,
  })
  emergencyLevel: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.appointments)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Note: Doctor entity would be created later
  // For now, doctorId is just a UUID reference
}
