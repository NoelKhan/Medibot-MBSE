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

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

@Entity('doctor_schedules')
@Index(['doctorId', 'dayOfWeek'])
@Index(['isActive'])
export class DoctorSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  doctorId: string;

  @ManyToOne(() => DoctorProfile, (doctor) => doctor.schedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doctorId' })
  doctor: DoctorProfile;

  @Column({ type: 'varchar', length: 20 })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'time' })
  startTime: string; // Format: 'HH:mm'

  @Column({ type: 'time' })
  endTime: string; // Format: 'HH:mm'

  @Column({ type: 'int', default: 30 })
  slotDuration: number; // in minutes

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
