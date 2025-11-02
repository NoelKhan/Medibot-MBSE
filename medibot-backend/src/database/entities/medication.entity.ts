/**
 * Medication Entity
 * ==================
 * Tracks patient medications
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
} from 'typeorm';
import { PatientProfile } from './patient-profile.entity';

@Entity('medications')
@Index(['patientId', 'isCurrent'])
export class Medication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  patientId: string;

  @Column()
  medicationName: string;

  @Column()
  dosage: string;

  @Column()
  frequency: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  prescribingDoctor: string;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ default: true })
  isCurrent: boolean;

  @Column({ type: 'text', nullable: true })
  sideEffects: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => PatientProfile, (profile) => profile.medications)
  @JoinColumn({ name: 'patientId' })
  patient: PatientProfile;
}
