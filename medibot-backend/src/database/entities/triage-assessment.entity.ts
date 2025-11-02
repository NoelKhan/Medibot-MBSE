/**
 * Triage Assessment Entity
 * =========================
 * ESI (Emergency Severity Index) triage assessments for cases
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { MedicalCase } from './medical-case.entity';
import { StaffUser } from './staff-user.entity';

@Entity('triage_assessments')
export class TriageAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  caseId: string;

  @Column({ type: 'int' })
  esiLevel: number; // 1-5 (1 = most critical)

  @Column({ type: 'simple-json', nullable: true })
  vitalSigns: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };

  @Column({ type: 'text', nullable: true })
  assessmentNotes: string;

  @Column({ type: 'uuid', nullable: true })
  assessedBy: string; // Staff ID

  @CreateDateColumn()
  assessedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextAssessmentDue: Date;

  // Relations
  @ManyToOne(() => MedicalCase, (medicalCase) => medicalCase.triageAssessments)
  @JoinColumn({ name: 'caseId' })
  case: MedicalCase;

  @ManyToOne(() => StaffUser, { nullable: true })
  @JoinColumn({ name: 'assessedBy' })
  assessor: StaffUser;
}
