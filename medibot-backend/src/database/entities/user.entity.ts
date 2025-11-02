/**
 * User Entity (Patient Users)
 * ============================
 * Represents patient users in the system
 * Maps to the PatientUser interface in frontend
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { PatientProfile } from './patient-profile.entity';
import { MedicalCase } from './medical-case.entity';
import { Appointment } from './appointment.entity';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude() // Don't send password in API responses
  passwordHash: string;

  @Column()
  fullName: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ default: false })
  isGuest: boolean;

  @Column({ type: 'simple-json', nullable: true })
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phoneNumber: string;
    isPrimary: boolean;
  }>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date; // Soft delete for HIPAA compliance

  // Relations
  @OneToOne(() => PatientProfile, (profile) => profile.user, { cascade: true })
  profile: PatientProfile;

  @OneToMany(() => MedicalCase, (medicalCase) => medicalCase.patient)
  cases: MedicalCase[];

  @OneToMany(() => Appointment, (appointment) => appointment.user)
  appointments: Appointment[];
}
