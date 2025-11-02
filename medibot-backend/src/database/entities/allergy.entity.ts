/**
 * Allergy Entity
 * ===============
 * Tracks patient allergies
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PatientProfile } from './patient-profile.entity';

@Entity('allergies')
export class Allergy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  patientId: string;

  @Column()
  allergen: string;

  @Column({
    type: 'enum',
    enum: ['mild', 'moderate', 'severe'],
  })
  severity: string;

  @Column()
  reaction: string;

  @Column({ type: 'date', nullable: true })
  diagnosedDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => PatientProfile, (profile) => profile.allergies)
  @JoinColumn({ name: 'patientId' })
  patient: PatientProfile;
}
