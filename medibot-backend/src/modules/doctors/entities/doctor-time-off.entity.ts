import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DoctorProfile } from './doctor-profile.entity';

export type TimeOffReason = 'vacation' | 'sick_leave' | 'conference' | 'personal' | 'other';

@Entity('doctor_time_offs')
@Index(['doctorId', 'startDate', 'endDate'])
export class DoctorTimeOff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  doctorId: string;

  @ManyToOne(() => DoctorProfile, (doctor) => doctor.timeOffs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doctorId' })
  doctor: DoctorProfile;

  @Column({ type: 'date' })
  @Index()
  startDate: Date;

  @Column({ type: 'date' })
  @Index()
  endDate: Date;

  @Column({ type: 'varchar', length: 50 })
  reason: TimeOffReason;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
