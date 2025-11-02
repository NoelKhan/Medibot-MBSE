import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { TriageCase } from '../../database/entities/triage-case.entity';
import { AILog } from '../../database/entities/ai-log.entity';
import { User } from '../../database/entities/user.entity';
import { Conversation } from '../../database/entities/conversation.entity';
import { ChatRequestDto, TriageResponseDto } from './dto/ai-agent.dto';
import { EmergencyService } from '../emergency/emergency.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { BookingsService } from '../bookings/bookings.service';
import { RemindersService } from '../reminders/reminders.service';

@Injectable()
export class AIAgentService {
  private readonly logger = new Logger(AIAgentService.name);
  private readonly aiAgentUrl: string;

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(TriageCase)
    private triageCaseRepository: Repository<TriageCase>,
    @InjectRepository(AILog)
    private aiLogRepository: Repository<AILog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    private readonly emergencyService: EmergencyService,
    private readonly notificationsService: NotificationsService,
    private readonly bookingsService: BookingsService,
    private readonly remindersService: RemindersService,
  ) {
    this.aiAgentUrl = process.env.AI_AGENT_URL || 'http://localhost:8000';
  }

  /**
   * Process chat message through AI Agent
   */
  async processChat(dto: ChatRequestDto): Promise<TriageResponseDto> {
    const startTime = Date.now();
    let aiResponse: TriageResponseDto;

    try {
      this.logger.log(`Processing chat for user ${dto.userId}: ${dto.message.substring(0, 50)}...`);

      // Call Python AI Agent
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiAgentUrl}/api/chat`, {
          message: dto.message,
          conversation_id: dto.conversationId,
          user_id: dto.userId,
          include_history: dto.includeHistory,
        }, {
          timeout: 30000, // 30 second timeout
        })
      );

      aiResponse = response.data;

      // Save to database
      const triageCase = await this.saveTriageCase(aiResponse, dto.userId);

      // Handle emergency escalation for RED severity cases
      if (aiResponse.triage.severity_level === 'RED') {
        await this.handleEmergencyEscalation(triageCase, aiResponse, dto.userId);
      }

      // Handle booking suggestions for AMBER severity cases
      if (aiResponse.triage.severity_level === 'AMBER') {
        const bookingSuggestions = await this.handleBookingSuggestion(triageCase, aiResponse, dto.userId);
        // Attach booking suggestions to response
        aiResponse['bookingSuggestions'] = bookingSuggestions;
      }

      // Handle self-care notifications for GREEN severity cases
      if (aiResponse.triage.severity_level === 'GREEN') {
        await this.handleSelfCareNotification(triageCase, aiResponse, dto.userId);
      }

      // Create follow-up reminder for all non-emergency cases
      if (aiResponse.triage.severity_level !== 'RED') {
        await this.createFollowUpReminder(triageCase, aiResponse, dto.userId);
      }

      // Log AI interaction
      await this.logAIInteraction(
        dto.userId,
        'chat',
        dto.message,
        aiResponse,
        Date.now() - startTime,
        'success'
      );

      this.logger.log(`AI processing completed in ${Date.now() - startTime}ms - Severity: ${aiResponse.triage.severity_level}`);

      return aiResponse;

    } catch (error) {
      this.logger.error(`AI Agent error: ${error.message}`, error.stack);

      // Log error
      await this.logAIInteraction(
        dto.userId,
        'chat',
        dto.message,
        null,
        Date.now() - startTime,
        'error',
        error.message
      );

      throw new HttpException(
        'AI processing failed. Please try again.',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Quick triage assessment
   */
  async quickTriage(message: string, userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiAgentUrl}/api/triage`, {
          message,
          user_id: userId,
        }, {
          timeout: 15000,
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Quick triage error: ${error.message}`);
      throw new HttpException('Triage failed', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  /**
   * Save triage case to database
   */
  private async saveTriageCase(aiResponse: TriageResponseDto, userId: string): Promise<TriageCase> {
    const triageCase = this.triageCaseRepository.create({
      userId,
      conversationId: aiResponse.case_id,
      symptoms: aiResponse.symptoms,
      triage: aiResponse.triage,
      action: aiResponse.action,
      patientSummary: aiResponse.summary.patient_summary,
      clinicianSummary: aiResponse.summary.clinician_summary,
      status: 'active',
    });

    return await this.triageCaseRepository.save(triageCase);
  }

  /**
   * Log AI interaction for monitoring
   */
  private async logAIInteraction(
    userId: string,
    action: string,
    input: string,
    output: any,
    processingTimeMs: number,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const log = this.aiLogRepository.create({
        userId,
        action,
        input,
        output,
        processingTimeMs,
        model: process.env.OLLAMA_MODEL || 'medllama2',
        status,
        errorMessage,
      });

      await this.aiLogRepository.save(log);
    } catch (error) {
      this.logger.warn(`Failed to save AI log: ${error.message}`);
    }
  }

  /**
   * Get triage cases for user
   */
  async getTriageCases(userId: string, status?: string): Promise<TriageCase[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return await this.triageCaseRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get triage case by ID
   */
  async getTriageCase(id: string): Promise<TriageCase> {
    const triageCase = await this.triageCaseRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!triageCase) {
      throw new HttpException('Triage case not found', HttpStatus.NOT_FOUND);
    }

    return triageCase;
  }

  /**
   * Get all RED severity cases (for monitoring)
   */
  async getEmergencyCases(): Promise<TriageCase[]> {
    return await this.triageCaseRepository
      .createQueryBuilder('triage')
      .where("triage.triage->>'severity_level' = :severity", { severity: 'RED' })
      .andWhere('triage.status = :status', { status: 'active' })
      .orderBy('triage.createdAt', 'DESC')
      .limit(50)
      .getMany();
  }

  /**
   * Check AI Agent health
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiAgentUrl}/health`, {
          timeout: 5000,
        })
      );
      return response.data;
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  /**
   * Handle emergency escalation for RED severity cases
   * Creates emergency case and notifies medical staff
   */
  private async handleEmergencyEscalation(
    triageCase: TriageCase,
    aiResponse: TriageResponseDto,
    userId: string
  ): Promise<void> {
    try {
      this.logger.warn(`🚨 RED SEVERITY CASE DETECTED - User: ${userId}, Case: ${triageCase.id}`);

      // Get user details
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        this.logger.error(`User not found for emergency escalation: ${userId}`);
        return;
      }

      // Create emergency case using EmergencyService
      // Note: EmergencyService.create expects specific DTO, adjust as needed
      const emergencyCaseData = {
        userId: userId,
        triageCaseId: triageCase.id,
        symptoms: aiResponse.symptoms.chief_complaint || 'Unknown symptoms',
        description: triageCase.clinicianSummary,
        severity: this.mapTriageSeverityToEmergency(aiResponse.triage.severity_level),
        redFlags: aiResponse.triage.red_flags_triggered || [],
        status: 'active',
      };

      // TODO: Call actual EmergencyService.create method when available
      this.logger.log(`Emergency case data prepared:`, emergencyCaseData);

      // Notify medical staff about the emergency
      await this.notifyMedicalStaff(aiResponse, user.id);

      // Send push notification to patient
      try {
        await this.notificationsService.sendPushNotification({
          userId: userId,
          title: '🚨 Urgent Medical Attention Required',
          body: 'Based on your symptoms, you need immediate medical attention. Medical staff have been notified.',
          type: NotificationType.EMERGENCY_ALERT,
          data: {
            triageCaseId: triageCase.id,
            severity: 'RED',
          },
        });
      } catch (notifError) {
        this.logger.error(`Failed to send patient notification: ${notifError.message}`);
      }

      this.logger.log(`Emergency escalation completed for case: ${triageCase.id}`);
    } catch (error) {
      this.logger.error(`Failed to handle emergency escalation: ${error.message}`, error.stack);
      // Don't throw - we don't want to block the main flow
    }
  }

  /**
   * Notify medical staff about emergency case
   */
  private async notifyMedicalStaff(
    aiResponse: TriageResponseDto,
    patientId: string
  ): Promise<void> {
    try {
      // Get all users with medical staff roles
      // Note: Update query based on actual User entity schema
      const medicalStaff = await this.userRepository
        .createQueryBuilder('user')
        .where("user.email LIKE '%@staff.medibot.com'") // Temporary filter for staff
        .orWhere("user.email LIKE '%doctor%'")
        .orWhere("user.email LIKE '%nurse%'")
        .getMany();

      this.logger.log(`Notifying ${medicalStaff.length} medical staff members`);

      // Send notifications to all medical staff
      const notifications = medicalStaff.map(async (staff) => {
        try {
          await this.notificationsService.sendPushNotification({
            userId: staff.id,
            title: '🚨 New Emergency Case - RED ALERT',
            body: `Patient requires immediate attention. Symptoms: ${aiResponse.symptoms.chief_complaint || 'Unknown'}`,
            type: NotificationType.EMERGENCY_ALERT,
            data: {
              patientId: patientId,
              severity: 'RED',
              redFlags: aiResponse.triage.red_flags_triggered,
              symptoms: aiResponse.symptoms.chief_complaint,
            },
          });
        } catch (error) {
          this.logger.error(`Failed to notify staff ${staff.id}: ${error.message}`);
        }
      });

      await Promise.allSettled(notifications);

      this.logger.log(`Successfully processed notifications for ${medicalStaff.length} staff members`);
    } catch (error) {
      this.logger.error(`Failed to notify medical staff: ${error.message}`);
    }
  }

  /**
   * Map triage severity to emergency severity levels
   */
  private mapTriageSeverityToEmergency(triageSeverity: string): number {
    switch (triageSeverity) {
      case 'RED':
        return 4; // Critical
      case 'AMBER':
        return 3; // High
      case 'GREEN':
        return 2; // Medium
      default:
        return 1; // Low
    }
  }

  /**
   * Handle booking suggestions for AMBER severity cases
   * Provides recommended doctors and available appointment slots
   */
  private async handleBookingSuggestion(
    triageCase: TriageCase,
    aiResponse: TriageResponseDto,
    userId: string
  ): Promise<any> {
    try {
      this.logger.log(`🟡 AMBER SEVERITY CASE - Generating booking suggestions for User: ${userId}`);

      // Extract specialization from AI response
      const specialization = aiResponse.action?.specialization || 'general_practitioner';
      
      this.logger.log(`Recommended specialization: ${specialization}`);

      // Get available doctors for the specialization
      const doctors = await this.bookingsService.getDoctors({
        specialization,
        availability: true,
      });

      if (doctors.length === 0) {
        this.logger.warn(`No doctors found for specialization: ${specialization}`);
        return {
          message: 'No available doctors found at the moment. Please try again later.',
          doctors: [],
        };
      }

      // Format booking suggestions
      const bookingSuggestions = {
        message: `Based on your symptoms, we recommend booking an appointment with a ${specialization.replace(/_/g, ' ')}.`,
        urgency: 'within_24_48_hours',
        recommendedSpecialization: specialization,
        availableDoctors: doctors.map(doctor => ({
          id: doctor.id,
          name: doctor.name,
          specializations: doctor.specializations || [],
          status: doctor.status,
          role: doctor.role,
          // Note: Add availability slots when DoctorSchedule is integrated
        })),
        triageCaseId: triageCase.id,
      };

      // Send notification about booking recommendation
      try {
        await this.notificationsService.sendPushNotification({
          userId: userId,
          title: '📅 Appointment Recommended',
          body: `Based on your symptoms, we recommend booking an appointment within 24-48 hours.`,
          type: NotificationType.APPOINTMENT_REMINDER,
          data: {
            triageCaseId: triageCase.id,
            severity: 'AMBER',
            specialization: specialization,
            recommendedAction: 'book_appointment',
          },
        });
      } catch (notifError) {
        this.logger.error(`Failed to send booking notification: ${notifError.message}`);
      }

      this.logger.log(`Generated booking suggestions for ${doctors.length} doctors`);
      return bookingSuggestions;

    } catch (error) {
      this.logger.error(`Failed to generate booking suggestions: ${error.message}`, error.stack);
      return {
        message: 'Unable to generate booking suggestions at this time.',
        doctors: [],
      };
    }
  }

  /**
   * Handle self-care notifications for GREEN severity cases
   * Sends care instructions and self-management tips
   */
  private async handleSelfCareNotification(
    triageCase: TriageCase,
    aiResponse: TriageResponseDto,
    userId: string
  ): Promise<void> {
    try {
      this.logger.log(`🟢 GREEN SEVERITY CASE - Sending self-care notification for User: ${userId}`);

      // Send notification with self-care instructions
      await this.notificationsService.sendPushNotification({
        userId: userId,
        title: '✅ Self-Care Recommended',
        body: 'Based on your symptoms, self-care measures should help. Check your care instructions.',
        type: NotificationType.CASE_UPDATE,
        data: {
          triageCaseId: triageCase.id,
          severity: 'GREEN',
          careInstructions: aiResponse.triage.care_instructions,
          recommendedAction: 'self_care',
        },
      });

      this.logger.log(`Self-care notification sent for case: ${triageCase.id}`);
    } catch (error) {
      this.logger.error(`Failed to send self-care notification: ${error.message}`);
    }
  }

  /**
   * Create follow-up reminder for non-emergency cases
   * Schedules a reminder to check on symptom progress
   */
  private async createFollowUpReminder(
    triageCase: TriageCase,
    aiResponse: TriageResponseDto,
    userId: string
  ): Promise<void> {
    try {
      this.logger.log(`Creating follow-up reminder for User: ${userId}, Case: ${triageCase.id}`);

      // Calculate reminder time based on severity
      const reminderTime = new Date();
      
      if (aiResponse.triage.severity_level === 'AMBER') {
        // Follow up in 24 hours for AMBER cases
        reminderTime.setHours(reminderTime.getHours() + 24);
      } else {
        // Follow up in 48 hours for GREEN cases
        reminderTime.setHours(reminderTime.getHours() + 48);
      }

      // Create reminder using RemindersService
      await this.remindersService.createReminder(userId, {
        type: 'triage_followup' as any, // May need to add this type to ReminderType enum
        title: 'Symptom Check-In',
        description: `How are your symptoms? Let's check if your condition has improved.`,
        reminderTime: reminderTime,
        metadata: {
          triageCaseId: triageCase.id,
          severity: aiResponse.triage.severity_level,
          chiefComplaint: aiResponse.symptoms.chief_complaint,
          createdAt: new Date().toISOString(),
        },
      });

      this.logger.log(
        `Follow-up reminder created for ${aiResponse.triage.severity_level} case at ${reminderTime.toISOString()}`
      );

    } catch (error) {
      this.logger.error(`Failed to create follow-up reminder: ${error.message}`);
      // Don't throw - reminder creation failure shouldn't block triage
    }
  }
}
