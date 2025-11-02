/**
 * Patient Profile Entity
 * =======================
 * Extended medical profile information for patients
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { MedicalHistory } from './medical-history.entity';
import { Medication } from './medication.entity';
import { Allergy } from './allergy.entity';

@Entity('patient_profiles')
export class PatientProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ nullable: true })
  bloodType: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  heightCm: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weightKg: number;

  @Column({ type: 'simple-json', nullable: true })
  chronicConditions: string[];

  @Column({ type: 'text', nullable: true })
  insuranceProvider: string;

  @Column({ type: 'text', nullable: true })
  insurancePolicyNumber: string;

  @Column({ type: 'simple-json', nullable: true })
  preferences: {
    notificationsEnabled: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    language: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => MedicalHistory, (history) => history.patient)
  medicalHistory: MedicalHistory[];

  @OneToMany(() => Medication, (medication) => medication.patient)
  medications: Medication[];

  @OneToMany(() => Allergy, (allergy) => allergy.patient)
  allergies: Allergy[];
}
