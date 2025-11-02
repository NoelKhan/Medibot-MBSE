import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('ai_logs')
export class AILog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  action: string; // 'triage', 'chat', 'symptom_extraction'

  @Column('text')
  input: string;

  @Column('jsonb')
  output: any;

  @Column({ type: 'float', nullable: true })
  processingTimeMs: number;

  @Column({ nullable: true })
  model: string;

  @Column({ default: 'success' })
  status: string; // 'success', 'error', 'timeout'

  @Column('text', { nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
