/**
 * Message Entity
 * ==============
 * Stores individual messages within conversations
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { SymptomAnalysis } from './symptom-analysis.entity';

export enum MessageSender {
  USER = 'user',
  AI = 'ai',
  STAFF = 'staff',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
}

@Entity('messages')
@Index(['conversationId', 'createdAt']) // Composite index for conversation queries
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column({
    type: 'enum',
    enum: MessageSender,
  })
  @Index() // Index for filtering by sender
  sender: MessageSender;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  messageType: MessageType;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @OneToOne(() => SymptomAnalysis, (analysis) => analysis.message, {
    nullable: true,
  })
  symptomAnalysis: SymptomAnalysis;

  @CreateDateColumn()
  createdAt: Date;
}
