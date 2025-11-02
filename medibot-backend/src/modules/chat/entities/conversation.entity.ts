/**
 * Conversation Entity
 * ===================
 * Stores chat conversations between users and AI/staff
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Message } from './message.entity';

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  CLOSED = 'closed',
}

@Entity('conversations')
@Index(['userId', 'status']) // Composite index for user queries
@Index(['lastMessageAt']) // Index for sorting by recent activity
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // userId can be either a UUID (for registered users) or a string like "anonymous-{timestamp}" for web users
  @Column({ type: 'varchar', length: 255 })
  userId: string;

  @Column({ length: 255, nullable: true })
  title: string;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  status: ConversationStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date;

  @OneToMany(() => Message, (message) => message.conversation, {
    cascade: true,
  })
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
