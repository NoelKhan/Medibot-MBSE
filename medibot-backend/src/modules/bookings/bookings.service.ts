import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../../database/entities/appointment.entity';
import { StaffUser } from '../../database/entities/staff-user.entity';
import { User } from '../../database/entities/user.entity';
import { CreateAppointmentDto, UpdateAppointmentDto, QueryDoctorsDto } from './dto/booking.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { RemindersService } from '../reminders/reminders.service';
import { EmailService, AppointmentEmailData } from '../email/email.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(StaffUser)
    private staffRepository: Repository<StaffUser>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => RemindersService))
    private remindersService: RemindersService,
    private emailService: EmailService,
  ) {}

  async getDoctors(query: QueryDoctorsDto) {
    const whereClause: any = { role: 'doctor' };

    if (query.specialization) {
      whereClause.specialization = query.specialization;
    }

    if (query.availability) {
      whereClause.isAvailable = true;
    }

    return this.staffRepository.find({ where: whereClause });
  }

  async createAppointment(dto: CreateAppointmentDto) {
    // Verify doctor exists
    const doctor = await this.staffRepository.findOne({
      where: { id: dto.doctorId, role: 'doctor' },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Get patient information
    const patient = await this.userRepository.findOne({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Parse the scheduledTime to extract date and time
    const scheduledDateTime = new Date(dto.scheduledTime);
    
    // Extract date components to avoid timezone issues
    const year = scheduledDateTime.getFullYear();
    const month = scheduledDateTime.getMonth();
    const day = scheduledDateTime.getDate();
    const appointmentDate = new Date(year, month, day); // Create date without time/timezone issues
    
    const hours = scheduledDateTime.getHours().toString().padStart(2, '0');
    const minutes = scheduledDateTime.getMinutes().toString().padStart(2, '0');
    const startTime = `${hours}:${minutes}`;

    const appointment = this.appointmentRepository.create({
      userId: dto.patientId,
      doctorId: dto.doctorId,
      appointmentDate,
      startTime,
      endTime: startTime, // You can calculate +30min or +1hr later
      consultationType: dto.appointmentType,
      status: 'scheduled',
      reason: dto.reason || '',
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Send confirmation notification (non-blocking)
    this.sendAppointmentConfirmation(patient, doctor, scheduledDateTime).catch(
      (error) => console.error('Failed to send appointment confirmation:', error),
    );

    // Create reminders (non-blocking)
    this.createAppointmentReminders(
      patient.id,
      savedAppointment.id,
      scheduledDateTime,
      doctor.name,
    ).catch(
      (error) => console.error('Failed to create appointment reminders:', error),
    );

    return savedAppointment;
  }

  async getAppointments(patientId?: string, doctorId?: string) {
    const where: any = {};
    if (patientId) where.userId = patientId;
    if (doctorId) where.doctorId = doctorId;

    return this.appointmentRepository.find({
      where,
      relations: ['user'],
      order: { appointmentDate: 'DESC' },
    });
  }

  async getAppointment(id: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async updateAppointment(id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.getAppointment(id);

    if (dto.status) {
      appointment.status = dto.status;
    }

    if (dto.scheduledTime) {
      const newDateTime = new Date(dto.scheduledTime);
      const newDate = newDateTime.toISOString().split('T')[0];
      const newTime = newDateTime.toTimeString().split(' ')[0].substring(0, 5);
      
      appointment.appointmentDate = new Date(newDate);
      appointment.startTime = newTime;
    }

    if (dto.notes) {
      appointment.notes = dto.notes;
    }

    return this.appointmentRepository.save(appointment);
  }

  async cancelAppointment(id: string) {
    const appointment = await this.getAppointment(id);
    appointment.status = 'cancelled';
    
    // Cancel reminders (non-blocking)
    this.remindersService
      .cancelAppointmentReminders(id, appointment.userId)
      .catch((error) =>
        console.error('Failed to cancel appointment reminders:', error),
      );

    return this.appointmentRepository.save(appointment);
  }

  /**
   * Send appointment confirmation via push notification and email
   */
  private async sendAppointmentConfirmation(
    patient: User,
    doctor: StaffUser,
    appointmentDate: Date,
  ): Promise<void> {
    try {
      // Send push notification
      await this.notificationsService.sendAppointmentConfirmation(
        patient.id,
        doctor.name,
        appointmentDate,
      );

      // Send email confirmation
      const emailData: AppointmentEmailData = {
        patientName: patient.fullName,
        patientEmail: patient.email,
        doctorName: doctor.name,
        appointmentDate,
        appointmentType: 'scheduled',
        reason: '',
      };

      await this.emailService.sendAppointmentConfirmation(emailData);
    } catch (error) {
      console.error('Error sending appointment confirmation:', error);
      // Don't throw - confirmation failure shouldn't block appointment creation
    }
  }

  /**
   * Create appointment reminders
   */
  private async createAppointmentReminders(
    userId: string,
    appointmentId: string,
    appointmentDate: Date,
    doctorName: string,
  ): Promise<void> {
    try {
      await this.remindersService.createAppointmentReminder(
        userId,
        appointmentId,
        appointmentDate,
        doctorName,
      );
    } catch (error) {
      console.error('Error creating appointment reminders:', error);
      // Don't throw - reminder creation failure shouldn't block appointment creation
    }
  }
}
