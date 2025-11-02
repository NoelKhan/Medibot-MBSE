/**
 * Audit Log Entity
 * =================
 * Tracks all system actions for compliance and debugging
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['staffId', 'createdAt'])
@Index(['entityType', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  staffId: string;

  @Column({
    type: 'enum',
    enum: ['create', 'read', 'update', 'delete', 'login', 'logout'],
  })
  action: string;

  @Column()
  entityType: string; // user, case, appointment, etc.

  @Column({ type: 'uuid', nullable: true })
  entityId: string;

  @Column({ type: 'simple-json', nullable: true })
  changes: Record<string, unknown>; // Before/after for updates

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
