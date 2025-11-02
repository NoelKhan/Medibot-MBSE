/**
 * Emergency Case Entity
 * ======================
 * Emergency calls and incidents
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { StaffUser } from './staff-user.entity';

@Entity('emergency_cases')
@Index(['userId', 'status'])
export class EmergencyCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  emergencyType: string;

  @Column({ type: 'simple-json' })
  symptoms: string[];

  @Column({ type: 'int' })
  severity: number; // 1-5 (1 = low, 5 = critical)

  @Column({ type: 'simple-json', nullable: true })
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };

  @Column()
  contactNumber: string;

  @Column({ type: 'simple-json' })
  emergencyContacts: Array<{
    id: string;
    name: string;
    relationship: string;
    phoneNumber: string;
    isPrimary: boolean;
  }>;

  @Column({
    type: 'enum',
    enum: ['pending', 'responded', 'resolved', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  assignedStaffId: string;

  @Column({ type: 'timestamp', nullable: true })
  responseTime: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  timestamp: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => StaffUser, { nullable: true })
  @JoinColumn({ name: 'assignedStaffId' })
  assignedStaff: StaffUser;
}
