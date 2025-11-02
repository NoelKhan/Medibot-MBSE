import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // userId can be either a UUID (registered users) or a string (anonymous web users like "anonymous-{timestamp}")
  @Column({ type: 'varchar', length: 255 })
  userId: string;

  @Column('jsonb', { default: [] })
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;

  @Column({ default: 'active' })
  status: string; // 'active', 'closed', 'escalated'

  @Column({ nullable: true })
  triageCaseId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
