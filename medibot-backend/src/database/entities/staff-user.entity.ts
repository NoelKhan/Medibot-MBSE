/**
 * Staff User Entity
 * ==================
 * Healthcare staff (doctors, nurses, paramedics, admins)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { MedicalCase } from './medical-case.entity';

@Entity('staff_users')
@Index(['email'], { unique: true })
@Index(['badgeNumber'], { unique: true })
export class StaffUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  passwordHash: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['emergency_operator', 'paramedic', 'nurse', 'doctor', 'admin'],
  })
  role: string;

  @Column({ unique: true })
  badgeNumber: string;

  @Column()
  department: string;

  @Column({
    type: 'enum',
    enum: ['day', 'evening', 'night', 'on-call'],
    default: 'day',
  })
  shift: string;

  @Column({
    type: 'enum',
    enum: ['available', 'busy', 'offline'],
    default: 'offline',
  })
  status: string;

  @Column({ type: 'simple-array', nullable: true })
  specializations: string[];

  @Column({ type: 'simple-json', nullable: true })
  certifications: Array<{
    name: string;
    issuedDate: Date;
    expiryDate?: Date;
  }>;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => MedicalCase, (medicalCase) => medicalCase.assignedStaff)
  assignedCases: MedicalCase[];
}
