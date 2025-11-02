import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('ai_interactions')
@Index(['userId', 'createdAt'])
export class AIInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column('text')
  userMessage: string;

  @Column('text')
  assistantResponse: string;

  @Column({ default: 'unknown' })
  severity: string; // unknown, self_care, referral, urgent, emergency

  @Column('float', { default: 0.5 })
  confidence: number;

  @Column('text', { nullable: true })
  carePathway: string; // JSON string

  @Column({ default: false })
  needsEscalation: boolean;

  @Column({ default: false })
  needsMoreInfo: boolean;

  @Column('text', { nullable: true })
  escalationReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
