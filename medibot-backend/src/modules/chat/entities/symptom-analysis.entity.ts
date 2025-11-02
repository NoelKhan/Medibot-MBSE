/**
 * Symptom Analysis Entity
 * ========================
 * Stores AI-generated symptom analysis for medical messages
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Message } from './message.entity';

export enum SeverityLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  EMERGENCY = 'emergency',
}

export enum SentimentType {
  CONCERNED = 'concerned',
  ANXIOUS = 'anxious',
  CALM = 'calm',
  URGENT = 'urgent',
}

@Entity('symptom_analyses')
export class SymptomAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index() // Index for message lookups
  messageId: string;

  @OneToOne(() => Message, (message) => message.symptomAnalysis, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'messageId' })
  message: Message;

  @Column('text', { array: true, default: '{}' })
  symptoms: string[];

  @Column({
    type: 'enum',
    enum: SeverityLevel,
    default: SeverityLevel.LOW,
  })
  @Index() // Index for filtering
  severity: SeverityLevel;

  @Column('text', { array: true, default: '{}' })
  bodyParts: string[];

  @Column({ length: 100, nullable: true })
  duration: string;

  @Column('text', { array: true, default: '{}' })
  triggers: string[];

  @Column({
    type: 'enum',
    enum: SentimentType,
    default: SentimentType.CALM,
  })
  sentiment: SentimentType;

  @Column('text', { array: true, default: '{}' })
  medicalTerms: string[];

  @CreateDateColumn()
  createdAt: Date;
}
