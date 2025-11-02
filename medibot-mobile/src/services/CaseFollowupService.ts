import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { MedicalCase } from '../types/Medical';
import { PushNotificationService } from './PushNotificationService';
import { InputValidator } from '../utils/InputValidator';
import { createLogger } from './Logger';

const logger = createLogger('CaseFollowupService');

/**
 * ENHANCED CASE FOLLOW-UP SYSTEM
 * ==============================
 * 
 * Production-ready service for managing medical case follow-ups with:
 * - Timeline-based reminder scheduling
 * - Email integration for guest users
 * - Automated overdue case detection
 * - Escalation workflows for missed follow-ups
 * 
 * ARCHITECTURE NOTES:
 * - Singleton pattern for consistent state management
 * - Email-first approach for guest user engagement
 * - Background task compatibility for automated reminders
 * - Integration with existing notification infrastructure
 */

export interface CaseFollowup {
  id: string;
  caseId: string;
  userId: string;
  userEmail?: string; // For guest users
  type: 'symptom-check' | 'medication-review' | 'recovery-assessment' | 'critical-follow-up';
  scheduledDate: Date;
  timeframeWindow: number; // Days allowed for response
  completed: boolean;
  completedDate?: Date;
  remindersSent: number;
  lastReminderDate?: Date;
  overdueDate?: Date;
  priority: 'low' | 'normal' | 'high' | 'critical';
  message: string;
  responseRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    severity: number;
    symptoms: string[];
    initialAdvice: string;
    expectedOutcome?: string;
    escalationThreshold: number; // Days before escalation
  };
}

export interface FollowupResponse {
  followupId: string;
  userId: string;
  responseDate: Date;
  symptomUpdate: string;
  feelingBetter: boolean;
  newSymptoms: string[];
  medicationCompliance?: boolean;
  additionalConcerns: string;
  requiresFurtherCare: boolean;
}

export interface FollowupStatistics {
  totalCases: number;
  pendingFollowups: number;
  overdueCases: number;
  completedThisWeek: number;
  responseRate: number;
  averageResponseTime: number; // hours
  criticalCasesOverdue: number;
}

class CaseFollowupService {
  private static instance: CaseFollowupService;
  private readonly STORAGE_KEY = 'medibot_case_followups';
  private readonly RESPONSES_KEY = 'medibot_followup_responses';
  private readonly EMAIL_QUEUE_KEY = 'medibot_email_queue';
  
  private pushNotificationService: PushNotificationService;

  constructor() {
    this.pushNotificationService = new PushNotificationService();
  }

  static getInstance(): CaseFollowupService {
    if (!CaseFollowupService.instance) {
      CaseFollowupService.instance = new CaseFollowupService();
    }
    return CaseFollowupService.instance;
  }

  /**
   * Create follow-up schedule based on case severity and type
   */
  async createCaseFollowup(
    medicalCase: MedicalCase,
    userEmail?: string
  ): Promise<CaseFollowup> {
    const followup: CaseFollowup = {
      id: `followup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      caseId: medicalCase.id,
      userId: medicalCase.userId,
      userEmail,
      type: this.determineFollowupType(medicalCase.severity, medicalCase.symptoms),
      scheduledDate: this.calculateFollowupDate(medicalCase.severity, medicalCase.createdAt),
      timeframeWindow: this.getTimeframeWindow(medicalCase.severity),
      completed: false,
      remindersSent: 0,
      priority: this.determinePriority(medicalCase.severity),
      message: this.generateFollowupMessage(medicalCase),
      responseRequired: medicalCase.severity >= 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        severity: medicalCase.severity,
        symptoms: medicalCase.symptoms,
        initialAdvice: medicalCase.diagnosis || 'General health consultation',
        escalationThreshold: medicalCase.severity >= 4 ? 2 : medicalCase.severity >= 3 ? 5 : 7
      }
    };

    // Calculate overdue date
    const overdue = new Date(followup.scheduledDate);
    overdue.setDate(overdue.getDate() + followup.timeframeWindow);
    followup.overdueDate = overdue;

    await this.saveFollowup(followup);
    
    // Schedule initial notification
    await this.scheduleFollowupNotification(followup);
    
    logger.info('Created follow-up for case', {
      caseId: medicalCase.id,
      type: followup.type,
      scheduledDate: followup.scheduledDate.toDateString()
    });
    return followup;
  }

  /**
   * Get all follow-ups for a user (profile or guest by email)
   */
  async getUserFollowups(userId: string, email?: string): Promise<CaseFollowup[]> {
    try {
      const allFollowups = await this.getAllFollowups();
      
      // For registered users and persistent guest users
      if (userId !== 'guest' && !userId.startsWith('guest_')) {
        return allFollowups.filter(f => f.userId === userId);
      }
      
      // For persistent guest users, match by exact userId first
      if (userId.startsWith('guest_')) {
        return allFollowups.filter(f => f.userId === userId);
      }
      
      // For legacy guest users, match by email
      if (email) {
        return allFollowups.filter(f => f.userEmail === email);
      }
      
      return [];
    } catch (error) {
      logger.error('Error loading user follow-ups', error as Error);
      return [];
    }
  }

  /**
   * Get pending follow-ups that need attention
   */
  async getPendingFollowups(userId?: string): Promise<CaseFollowup[]> {
    const allFollowups = await this.getAllFollowups();
    const now = new Date();
    
    let pending = allFollowups.filter(f => 
      !f.completed && f.scheduledDate <= now
    );

    if (userId && userId !== 'guest' && !userId.startsWith('guest_')) {
      pending = pending.filter(f => f.userId === userId);
    } else if (userId && userId.startsWith('guest_')) {
      // Handle persistent guest users
      pending = pending.filter(f => f.userId === userId);
    }

    return pending.sort((a, b) => {
      // Sort by priority first, then by overdue status
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      return a.scheduledDate.getTime() - b.scheduledDate.getTime();
    });
  }

  /**
   * Get overdue follow-ups that require immediate attention
   */
  async getOverdueFollowups(): Promise<CaseFollowup[]> {
    const allFollowups = await this.getAllFollowups();
    const now = new Date();
    
    return allFollowups.filter(f => 
      !f.completed && 
      f.overdueDate && 
      f.overdueDate <= now
    ).sort((a, b) => {
      // Critical cases first, then by how overdue they are
      if (a.priority === 'critical' && b.priority !== 'critical') return -1;
      if (b.priority === 'critical' && a.priority !== 'critical') return 1;
      
      return (a.overdueDate?.getTime() || 0) - (b.overdueDate?.getTime() || 0);
    });
  }

  /**
   * Process follow-up responses from users
   */
  async submitFollowupResponse(response: Omit<FollowupResponse, 'responseDate'>): Promise<void> {
    const fullResponse: FollowupResponse = {
      ...response,
      responseDate: new Date()
    };

    // Mark follow-up as completed
    const followup = await this.getFollowupById(response.followupId);
    if (followup) {
      followup.completed = true;
      followup.completedDate = new Date();
      followup.updatedAt = new Date();
      await this.updateFollowup(followup);
    }

    // Save response
    await this.saveFollowupResponse(fullResponse);

    // Analyze response for further action
    await this.analyzeFollowupResponse(fullResponse);

    logger.info('Follow-up response submitted', { followupId: response.followupId });
  }

  /**
   * Send reminder notifications for pending follow-ups
   */
  async processReminders(): Promise<void> {
    const pendingFollowups = await this.getPendingFollowups();
    const now = new Date();

    for (const followup of pendingFollowups) {
      const hoursSinceScheduled = (now.getTime() - followup.scheduledDate.getTime()) / (1000 * 60 * 60);
      const hoursSinceLastReminder = followup.lastReminderDate 
        ? (now.getTime() - followup.lastReminderDate.getTime()) / (1000 * 60 * 60)
        : Infinity;

      // Send reminder based on priority and time elapsed
      let shouldSendReminder = false;
      
      if (followup.priority === 'critical' && hoursSinceLastReminder >= 4) {
        shouldSendReminder = true;
      } else if (followup.priority === 'high' && hoursSinceLastReminder >= 12) {
        shouldSendReminder = true;
      } else if (followup.priority === 'normal' && hoursSinceLastReminder >= 24) {
        shouldSendReminder = true;
      } else if (followup.priority === 'low' && hoursSinceLastReminder >= 72) {
        shouldSendReminder = true;
      }

      if (shouldSendReminder && followup.remindersSent < 5) {
        await this.sendFollowupReminder(followup);
      }
    }

    // Process escalations for overdue critical cases
    await this.processEscalations();
  }

  /**
   * Get follow-up statistics for dashboard/analytics
   */
  async getFollowupStatistics(userId?: string): Promise<FollowupStatistics> {
    const allFollowups = userId 
      ? await this.getUserFollowups(userId)
      : await this.getAllFollowups();
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalCases = allFollowups.length;
    const pendingFollowups = allFollowups.filter(f => !f.completed).length;
    const overdueCases = allFollowups.filter(f => 
      !f.completed && f.overdueDate && f.overdueDate <= now
    ).length;
    
    const completedThisWeek = allFollowups.filter(f => 
      f.completed && f.completedDate && f.completedDate >= weekAgo
    ).length;

    const completedCases = allFollowups.filter(f => f.completed);
    const responseRate = totalCases > 0 ? (completedCases.length / totalCases) * 100 : 0;

    const responseTimes = completedCases
      .filter(f => f.completedDate)
      .map(f => (f.completedDate!.getTime() - f.scheduledDate.getTime()) / (1000 * 60 * 60));
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const criticalCasesOverdue = allFollowups.filter(f => 
      !f.completed && 
      f.priority === 'critical' && 
      f.overdueDate && 
      f.overdueDate <= now
    ).length;

    return {
      totalCases,
      pendingFollowups,
      overdueCases,
      completedThisWeek,
      responseRate: Math.round(responseRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      criticalCasesOverdue
    };
  }

  // Private helper methods

  private determineFollowupType(severity: number, symptoms: string[]): CaseFollowup['type'] {
    if (severity >= 4) return 'critical-follow-up';
    if (symptoms.some(s => s.toLowerCase().includes('pain') || s.toLowerCase().includes('medication'))) {
      return 'medication-review';
    }
    if (severity >= 3) return 'recovery-assessment';
    return 'symptom-check';
  }

  private calculateFollowupDate(severity: number, caseDate: Date): Date {
    const followupDate = new Date(caseDate);
    
    if (severity >= 4) {
      followupDate.setHours(followupDate.getHours() + 12); // 12 hours for critical
    } else if (severity >= 3) {
      followupDate.setDate(followupDate.getDate() + 2); // 2 days for high severity
    } else if (severity >= 2) {
      followupDate.setDate(followupDate.getDate() + 5); // 5 days for moderate
    } else {
      followupDate.setDate(followupDate.getDate() + 7); // 1 week for low severity
    }
    
    return followupDate;
  }

  private getTimeframeWindow(severity: number): number {
    if (severity >= 4) return 1; // 1 day window for critical
    if (severity >= 3) return 3; // 3 days for high
    if (severity >= 2) return 5; // 5 days for moderate
    return 7; // 7 days for low
  }

  private determinePriority(severity: number): CaseFollowup['priority'] {
    if (severity >= 4) return 'critical';
    if (severity >= 3) return 'high';
    if (severity >= 2) return 'normal';
    return 'low';
  }

  private generateFollowupMessage(medicalCase: MedicalCase): string {
    const severity = medicalCase.severity;
    const symptoms = medicalCase.symptoms.join(', ');
    
    if (severity >= 4) {
      return `Critical follow-up needed for your ${medicalCase.title}. Please update us on your symptoms: ${symptoms}. Have you sought medical attention as advised?`;
    } else if (severity >= 3) {
      return `How are you feeling since our consultation about ${medicalCase.title}? Please let us know if your symptoms (${symptoms}) have improved or worsened.`;
    } else {
      return `Time to check in! How are your symptoms (${symptoms}) progressing? We'd like to know if you're feeling better or if you have any new concerns.`;
    }
  }

  private async scheduleFollowupNotification(followup: CaseFollowup): Promise<void> {
    const notificationTitle = followup.priority === 'critical' 
      ? '🚨 Critical Health Follow-up'
      : '🏥 Health Check-in Reminder';
    
    const notificationBody = `Time to update us on your ${followup.type.replace('-', ' ')}. Tap to respond.`;

    if (followup.userEmail && (followup.userId === 'guest' || followup.userId.startsWith('guest_'))) {
      // For guest users (legacy and persistent), queue email notification
      await this.queueEmailNotification(followup);
    } else {
      // For registered users, use push notifications
      await this.pushNotificationService.scheduleNotification({
        title: notificationTitle,
        body: notificationBody,
        data: { followupId: followup.id, type: 'case-followup' },
        trigger: { 
          type: 'date',
          date: followup.scheduledDate 
        } as Notifications.DateTriggerInput
      });
    }
  }

  private async sendFollowupReminder(followup: CaseFollowup): Promise<void> {
    followup.remindersSent += 1;
    followup.lastReminderDate = new Date();
    followup.updatedAt = new Date();

    const urgencyText = followup.remindersSent >= 3 ? 'URGENT: ' : '';
    const title = `${urgencyText}Follow-up Reminder #${followup.remindersSent}`;
    
    if (followup.userEmail && (followup.userId === 'guest' || followup.userId.startsWith('guest_'))) {
      await this.sendEmailReminder(followup, title);
    } else {
      await this.pushNotificationService.sendLocalNotification({
        title: title,
        body: `${followup.message}\n\nReminder ${followup.remindersSent} of 5.`,
        data: { followupId: followup.id, reminderCount: followup.remindersSent }
      });
    }

    await this.updateFollowup(followup);
    logger.info('Sent reminder for follow-up', {
      followupId: followup.id,
      reminderCount: followup.remindersSent
    });
  }

  private async processEscalations(): Promise<void> {
    const overdueFollowups = await this.getOverdueFollowups();
    const now = new Date();

    for (const followup of overdueFollowups) {
      const daysOverdue = Math.floor((now.getTime() - (followup.overdueDate?.getTime() || 0)) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue >= followup.metadata.escalationThreshold) {
        await this.escalateCase(followup, daysOverdue);
      }
    }
  }

  private async escalateCase(followup: CaseFollowup, daysOverdue: number): Promise<void> {
    const escalationMessage = `ESCALATION ALERT: Case ${followup.caseId} is ${daysOverdue} days overdue for follow-up. Original severity: ${followup.metadata.severity}. Patient has not responded to ${followup.remindersSent} reminders.`;

    // Send escalation notification to healthcare team
    await this.pushNotificationService.sendEmergencyNotification(
      escalationMessage,
      { 
        followupId: followup.id, 
        caseId: followup.caseId, 
        daysOverdue, 
        type: 'case-escalation' 
      }
    );

    // Mark as escalated (could add escalated field to interface)
    followup.priority = 'critical';
    followup.updatedAt = new Date();
    await this.updateFollowup(followup);

    logger.warn('Escalated overdue case', {
      caseId: followup.caseId,
      daysOverdue
    });
  }

  private async queueEmailNotification(followup: CaseFollowup): Promise<void> {
    const emailQueue = await this.getEmailQueue();
    emailQueue.push({
      id: `email_${Date.now()}`,
      followupId: followup.id,
      email: followup.userEmail!,
      subject: `Health Follow-up: ${followup.type.replace('-', ' ')}`,
      body: this.generateEmailBody(followup),
      scheduledDate: followup.scheduledDate,
      sent: false
    });
    
    await AsyncStorage.setItem(this.EMAIL_QUEUE_KEY, JSON.stringify(emailQueue));
  }

  private async sendEmailReminder(followup: CaseFollowup, title: string): Promise<void> {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    logger.info('Sending email reminder', {
      userEmail: followup.userEmail,
      title
    });
    
    // For now, add to email queue for batch processing
    await this.queueEmailNotification({
      ...followup,
      message: `${title}\n\n${followup.message}`
    });
  }

  private generateEmailBody(followup: CaseFollowup): string {
    return `
Dear Patient,

${followup.message}

This is a follow-up for your medical consultation regarding: ${followup.metadata.symptoms.join(', ')}

Please respond by clicking the link below or replying to this email:
[Respond to Follow-up] (This would be a deep link to the app)

If you have any urgent concerns, please seek immediate medical attention.

Best regards,
MediBot Health Team

---
Case ID: ${followup.caseId}
Follow-up ID: ${followup.id}
Scheduled: ${followup.scheduledDate.toLocaleDateString()}
`;
  }

  private async analyzeFollowupResponse(response: FollowupResponse): Promise<void> {
    // Analyze response for concerning patterns
    if (!response.feelingBetter || response.requiresFurtherCare || response.newSymptoms.length > 0) {
      // Create new follow-up or escalate
      const followup = await this.getFollowupById(response.followupId);
      if (followup) {
        logger.warn('Follow-up response indicates need for further care', {
          followupId: response.followupId
        });
        
        // Could create new follow-up or trigger escalation
        await this.pushNotificationService.sendLocalNotification({
          title: 'Follow-up Response Alert',
          body: `Patient response indicates ongoing concerns. Review required.`,
          data: { responseId: response.followupId, requiresReview: true }
        });
      }
    }
  }

  // Storage methods

  private async getAllFollowups(): Promise<CaseFollowup[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      return JSON.parse(stored).map((item: any) => ({
        ...item,
        scheduledDate: new Date(item.scheduledDate),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        completedDate: item.completedDate ? new Date(item.completedDate) : undefined,
        lastReminderDate: item.lastReminderDate ? new Date(item.lastReminderDate) : undefined,
        overdueDate: item.overdueDate ? new Date(item.overdueDate) : undefined
      }));
    } catch (error) {
      logger.error('Error loading all follow-ups', error as Error);
      return [];
    }
  }

  private async saveFollowup(followup: CaseFollowup): Promise<void> {
    const followups = await this.getAllFollowups();
    followups.push(followup);
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(followups));
  }

  private async updateFollowup(updatedFollowup: CaseFollowup): Promise<void> {
    const followups = await this.getAllFollowups();
    const index = followups.findIndex(f => f.id === updatedFollowup.id);
    
    if (index !== -1) {
      followups[index] = updatedFollowup;
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(followups));
    }
  }

  private async getFollowupById(id: string): Promise<CaseFollowup | null> {
    const followups = await this.getAllFollowups();
    return followups.find(f => f.id === id) || null;
  }

  private async saveFollowupResponse(response: FollowupResponse): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.RESPONSES_KEY);
      const responses = stored ? JSON.parse(stored) : [];
      responses.push(response);
      await AsyncStorage.setItem(this.RESPONSES_KEY, JSON.stringify(responses));
    } catch (error) {
      logger.error('Error saving follow-up response', error as Error);
    }
  }

  private async getEmailQueue(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem(this.EMAIL_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Error loading email queue', error as Error);
      return [];
    }
  }
}

export default CaseFollowupService;