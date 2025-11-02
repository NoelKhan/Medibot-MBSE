/**
 * Medical Case Entity
 * ====================
 * Tracks patient medical cases for symptom tracking and triaging
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { StaffUser } from './staff-user.entity';
import { CaseNote } from './case-note.entity';
import { TriageAssessment } from './triage-assessment.entity';

@Entity('medical_cases')
@Index(['caseNumber'], { unique: true })
@Index(['patientId', 'status'])
export class MedicalCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  caseNumber: string; // e.g., CASE-2024-001

  @Column({ type: 'uuid' })
  patientId: string;

  @Column()
  chiefComplaint: string;

  @Column({ type: 'simple-json' })
  symptoms: string[];

  @Column({ type: 'int', default: 1 })
  severity: number; // 1-5 scale

  @Column({
    type: 'enum',
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
  })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  assignedStaffId: string;

  @Column({
    type: 'enum',
    enum: ['user', 'bot', 'staff'],
    default: 'bot',
  })
  createdBy: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: {
    sourceConversationId?: string;
    autoCreated?: boolean;
    tags?: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.cases)
  @JoinColumn({ name: 'patientId' })
  patient: User;

  @ManyToOne(() => StaffUser, (staff) => staff.assignedCases, { nullable: true })
  @JoinColumn({ name: 'assignedStaffId' })
  assignedStaff: StaffUser;

  @OneToMany(() => CaseNote, (note) => note.case, { cascade: true })
  notes: CaseNote[];

  @OneToMany(() => TriageAssessment, (triage) => triage.case, { cascade: true })
  triageAssessments: TriageAssessment[];
}
