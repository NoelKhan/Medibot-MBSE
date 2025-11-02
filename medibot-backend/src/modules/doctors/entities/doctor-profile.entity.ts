import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { DoctorSchedule } from './doctor-schedule.entity';
import { DoctorTimeOff } from './doctor-time-off.entity';

export type DoctorSpecialty =
  | 'General Practitioner'
  | 'Cardiologist'
  | 'Dermatologist'
  | 'Pediatrician'
  | 'Psychiatrist'
  | 'Orthopedist'
  | 'Neurologist'
  | 'Gastroenterologist'
  | 'Ophthalmologist'
  | 'ENT Specialist';

export type DoctorStatus = 'active' | 'inactive' | 'on_leave';

@Entity('doctor_profiles')
@Index(['specialty', 'status'])
@Index(['yearsOfExperience'])
@Index(['rating'])
export class DoctorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  fullName: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  specialty: DoctorSpecialty;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'int' })
  yearsOfExperience: number;

  @Column({ type: 'text', nullable: true })
  education: string;

  @Column({ type: 'text', nullable: true })
  certifications: string;

  @Column({ type: 'simple-array', nullable: true })
  languages: string[];

  @Column({ type: 'varchar', length: 20 })
  status: DoctorStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  consultationFee: number;

  @Column({ type: 'int', default: 30 })
  consultationDuration: number; // in minutes

  @Column({ type: 'text', nullable: true })
  profileImageUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  hospitalAffiliation: string;

  @Column({ type: 'text', nullable: true })
  officeAddress: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @OneToMany(() => DoctorSchedule, (schedule) => schedule.doctor)
  schedules: DoctorSchedule[];

  @OneToMany(() => DoctorTimeOff, (timeOff) => timeOff.doctor)
  timeOffs: DoctorTimeOff[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
