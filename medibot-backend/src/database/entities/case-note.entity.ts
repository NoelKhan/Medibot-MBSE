/**
 * Case Note Entity
 * =================
 * Notes and updates on medical cases
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { MedicalCase } from './medical-case.entity';

@Entity('case_notes')
@Index(['caseId', 'createdAt'])
export class CaseNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  caseId: string;

  @Column({ type: 'uuid' })
  authorId: string; // Can be user ID or staff ID

  @Column({
    type: 'enum',
    enum: ['patient', 'staff', 'system'],
  })
  authorType: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: ['general', 'clinical', 'administrative'],
    default: 'general',
  })
  noteType: string;

  @Column({ default: true })
  isVisibleToPatient: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => MedicalCase, (medicalCase) => medicalCase.notes)
  @JoinColumn({ name: 'caseId' })
  case: MedicalCase;
}
