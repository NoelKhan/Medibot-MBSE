/**
 * Medical History Entity
 * =======================
 * Tracks patient's medical conditions and history
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

@Entity('medical_history')
@Index(['patientId', 'status'])
export class MedicalHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  patientId: string;

  @Column()
  conditionName: string;

  @Column({ type: 'date', nullable: true })
  diagnosedDate: Date;

  @Column({
    type: 'enum',
    enum: ['active', 'resolved', 'chronic', 'monitoring'],
    default: 'active',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  diagnosedBy: string; // Doctor name

  @Column({ type: 'text', nullable: true })
  treatment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => PatientProfile, (profile) => profile.medicalHistory)
  @JoinColumn({ name: 'patientId' })
  patient: PatientProfile;
}
