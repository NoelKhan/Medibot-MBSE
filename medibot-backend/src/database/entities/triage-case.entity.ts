import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('triage_cases')
export class TriageCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  conversationId: string;

  @Column('jsonb')
  symptoms: {
    chief_complaint: string;
    duration: string;
    severity_self: string;
    age_band?: string;
    associated_symptoms: string[];
  };

  @Column('jsonb')
  triage: {
    severity_level: 'GREEN' | 'AMBER' | 'RED';
    rationale: string;
    recommended_action: string;
    red_flags_triggered: string[];
    care_instructions: string[];
    confidence?: number;
  };

  @Column('jsonb')
  action: {
    type: string;
    specialization?: string;
    urgency: string;
    instructions: string[];
    resources: string[];
  };

  @Column('text')
  patientSummary: string;

  @Column('text')
  clinicianSummary: string;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
