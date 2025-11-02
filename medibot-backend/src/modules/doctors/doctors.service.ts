import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { DoctorProfile } from './entities/doctor-profile.entity';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { DoctorTimeOff } from './entities/doctor-time-off.entity';
import { SearchDoctorsDto, GetAvailableSlotsDto } from './dto/doctors.dto';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(DoctorProfile)
    private doctorRepository: Repository<DoctorProfile>,
    @InjectRepository(DoctorSchedule)
    private scheduleRepository: Repository<DoctorSchedule>,
    @InjectRepository(DoctorTimeOff)
    private timeOffRepository: Repository<DoctorTimeOff>,
  ) {}

  /**
   * Search for doctors with filters
   */
  async searchDoctors(dto: SearchDoctorsDto) {
    const {
      specialty,
      name,
      minRating,
      maxFee,
      languages,
      page = 1,
      limit = 20,
    } = dto;

    const query = this.doctorRepository
      .createQueryBuilder('doctor')
      .where('doctor.status = :status', { status: 'active' })
      .orderBy('doctor.rating', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (specialty) {
      query.andWhere('doctor.specialty = :specialty', { specialty });
    }

    if (name) {
      query.andWhere('doctor.fullName ILIKE :name', { name: `%${name}%` });
    }

    if (minRating) {
      query.andWhere('doctor.rating >= :minRating', { minRating });
    }

    if (maxFee) {
      query.andWhere('doctor.consultationFee <= :maxFee', { maxFee });
    }

    if (languages && languages.length > 0) {
      // PostgreSQL array contains operator
      query.andWhere('doctor.languages && ARRAY[:...languages]::varchar[]', {
        languages,
      });
    }

    const [doctors, total] = await query.getManyAndCount();

    return {
      doctors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get doctor by ID with schedules
   */
  async getDoctorById(id: string) {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['schedules'],
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  /**
   * Get available time slots for a doctor within a date range
   */
  async getAvailableSlots(dto: GetAvailableSlotsDto) {
    const { doctorId, startDate, endDate } = dto;

    const doctor = await this.getDoctorById(doctorId);

    // Get doctor's schedules
    const schedules = await this.scheduleRepository.find({
      where: {
        doctorId,
        isActive: true,
      },
    });

    if (schedules.length === 0) {
      return [];
    }

    // Get time-off periods
    const timeOffs = await this.timeOffRepository.find({
      where: {
        doctorId,
        startDate: LessThanOrEqual(new Date(endDate)),
        endDate: MoreThanOrEqual(new Date(startDate)),
      },
    });

    // Generate slots
    const slots = this.generateTimeSlots(
      new Date(startDate),
      new Date(endDate),
      schedules,
      timeOffs,
      doctor.consultationDuration,
    );

    return slots;
  }

  /**
   * Generate time slots for a date range
   */
  private generateTimeSlots(
    startDate: Date,
    endDate: Date,
    schedules: DoctorSchedule[],
    timeOffs: DoctorTimeOff[],
    slotDuration: number,
  ) {
    const slots: { date: string; slots: TimeSlot[] }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = this.getDayOfWeek(currentDate);
      const daySchedule = schedules.find((s) => s.dayOfWeek === dayOfWeek);

      if (daySchedule) {
        const isTimeOff = timeOffs.some(
          (timeOff) =>
            currentDate >= new Date(timeOff.startDate) &&
            currentDate <= new Date(timeOff.endDate),
        );

        if (!isTimeOff) {
          const daySlots = this.generateDaySlots(
            daySchedule.startTime,
            daySchedule.endTime,
            slotDuration,
          );

          slots.push({
            date: currentDate.toISOString().split('T')[0],
            slots: daySlots,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  /**
   * Generate time slots for a single day
   */
  private generateDaySlots(
    startTime: string,
    endTime: string,
    duration: number,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    while (currentMinutes + duration <= endMinutes) {
      const slotStart = this.minutesToTime(currentMinutes);
      const slotEnd = this.minutesToTime(currentMinutes + duration);

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        available: true, // TODO: Check against actual bookings
      });

      currentMinutes += duration;
    }

    return slots;
  }

  /**
   * Convert minutes to HH:mm format
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Get day of week name
   */
  private getDayOfWeek(date: Date): string {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[date.getDay()];
  }

  /**
   * Get all specialties
   */
  async getSpecialties() {
    const specialties = await this.doctorRepository
      .createQueryBuilder('doctor')
      .select('DISTINCT doctor.specialty', 'specialty')
      .where('doctor.status = :status', { status: 'active' })
      .getRawMany();

    return specialties.map((s) => s.specialty);
  }
}
