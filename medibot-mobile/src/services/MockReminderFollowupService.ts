/**
 * MOCK REMINDER SERVICE
 * Provides mock data and endpoints for reminder testing
 * Simulates backend reminder API when backend is unavailable
 */

import { createLogger } from './Logger';

const logger = createLogger('MockReminderFollowupService');

export interface MockReminder {
  id: string;
  userId: string;
  caseId?: string;
  title: string;
  description: string;
  type: 'medication' | 'appointment' | 'followup' | 'test' | 'general';
  scheduledTime: Date;
  status: 'pending' | 'sent' | 'dismissed' | 'completed';
  recurring?: 'daily' | 'weekly' | 'monthly' | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
}

export interface MockFollowup {
  id: string;
  caseId: string;
  userId: string;
  type: 'check_in' | 'test_results' | 'medication_review' | 'symptom_check';
  scheduledDate: Date;
  status: 'pending' | 'sent' | 'completed' | 'cancelled';
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  completedAt?: Date;
}

class MockReminderFollowupService {
  private static instance: MockReminderFollowupService;
  private reminders: MockReminder[] = [];
  private followups: MockFollowup[] = [];
  private initialized = false;

  private constructor() {}

  static getInstance(): MockReminderFollowupService {
    if (!MockReminderFollowupService.instance) {
      MockReminderFollowupService.instance = new MockReminderFollowupService();
    }
    return MockReminderFollowupService.instance;
  }

  /**
   * Initialize with sample data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    logger.info('Initializing Mock Reminder & Followup Service');

    // Sample Reminders
    this.reminders = [
      {
        id: 'reminder_001',
        userId: 'user_test',
        caseId: 'case_001',
        title: 'Take Blood Pressure Medication',
        description: 'Lisinopril 10mg - Take with food',
        type: 'medication',
        scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        status: 'pending',
        recurring: 'daily',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'reminder_002',
        userId: 'user_test',
        title: 'Cardiology Follow-up Appointment',
        description: 'Dr. Smith at Metro Medical Center',
        type: 'appointment',
        scheduledTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: 'pending',
        recurring: null,
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'reminder_003',
        userId: 'user_test',
        caseId: 'case_002',
        title: 'Lab Test Results Available',
        description: 'Check portal for blood work results',
        type: 'test',
        scheduledTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        status: 'pending',
        recurring: null,
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'reminder_004',
        userId: 'user_test',
        title: 'Refill Prescription',
        description: 'Only 3 days of medication remaining',
        type: 'medication',
        scheduledTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'pending',
        recurring: null,
        priority: 'urgent',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Sample Followups
    this.followups = [
      {
        id: 'followup_001',
        caseId: 'case_001',
        userId: 'user_test',
        type: 'check_in',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        status: 'pending',
        message: 'How are you feeling after starting the new medication? Any side effects?',
        priority: 'high',
        createdAt: new Date(),
      },
      {
        id: 'followup_002',
        caseId: 'case_002',
        userId: 'user_test',
        type: 'test_results',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        status: 'pending',
        message: 'Your blood test results should be ready. Please schedule a follow-up to discuss.',
        priority: 'medium',
        createdAt: new Date(),
      },
      {
        id: 'followup_003',
        caseId: 'case_003',
        userId: 'user_test',
        type: 'symptom_check',
        scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
        status: 'pending',
        message: 'Are your headaches improving? Any changes in frequency or intensity?',
        priority: 'medium',
        createdAt: new Date(),
      },
    ];

    this.initialized = true;
    logger.info('Mock service loaded', { 
      reminderCount: this.reminders.length, 
      followupCount: this.followups.length 
    });
  }

  // ==================== REMINDER METHODS ====================

  /**
   * Get all reminders for a user
   */
  async getUserReminders(userId: string): Promise<MockReminder[]> {
    await this.initialize();
    return this.reminders.filter(r => r.userId === userId);
  }

  /**
   * Get pending reminders for a user
   */
  async getPendingReminders(userId: string): Promise<MockReminder[]> {
    await this.initialize();
    return this.reminders.filter(r => r.userId === userId && r.status === 'pending');
  }

  /**
   * Get reminders by priority
   */
  async getRemindersByPriority(userId: string, priority: 'low' | 'medium' | 'high' | 'urgent'): Promise<MockReminder[]> {
    await this.initialize();
    return this.reminders.filter(r => r.userId === userId && r.priority === priority);
  }

  /**
   * Create a new reminder
   */
  async createReminder(data: Omit<MockReminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockReminder> {
    await this.initialize();

    const newReminder: MockReminder = {
      ...data,
      id: `reminder_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.reminders.push(newReminder);
    logger.info('Created reminder', { title: newReminder.title, type: newReminder.type });
    return newReminder;
  }

  /**
   * Update reminder status
   */
  async updateReminderStatus(reminderId: string, status: MockReminder['status']): Promise<MockReminder | null> {
    await this.initialize();

    if (!reminderId || !status) {
      logger.warn('Invalid parameters for updateReminderStatus');
      return null;
    }

    const reminder = this.reminders.find(r => r.id === reminderId);
    if (!reminder) {
      logger.warn('Reminder not found', { reminderId });
      return null;
    }

    reminder.status = status;
    reminder.updatedAt = new Date();
    logger.info('Updated reminder status', { reminderId, status });
    return reminder;
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(reminderId: string): Promise<boolean> {
    await this.initialize();

    const index = this.reminders.findIndex(r => r.id === reminderId);
    if (index === -1) return false;

    this.reminders.splice(index, 1);
    logger.info('Deleted reminder', { reminderId });
    return true;
  }

  /**
   * Get reminders for a specific case
   */
  async getCaseReminders(caseId: string): Promise<MockReminder[]> {
    await this.initialize();
    return this.reminders.filter(r => r.caseId === caseId);
  }

  // ==================== FOLLOWUP METHODS ====================

  /**
   * Get all followups for a user
   */
  async getUserFollowups(userId: string): Promise<MockFollowup[]> {
    await this.initialize();
    return this.followups.filter(f => f.userId === userId);
  }

  /**
   * Get pending followups for a user
   */
  async getPendingFollowups(userId: string): Promise<MockFollowup[]> {
    await this.initialize();
    return this.followups.filter(f => f.userId === userId && f.status === 'pending');
  }

  /**
   * Get followups for a specific case
   */
  async getCaseFollowups(caseId: string): Promise<MockFollowup[]> {
    await this.initialize();
    return this.followups.filter(f => f.caseId === caseId);
  }

  /**
   * Create a new followup
   */
  async createFollowup(data: Omit<MockFollowup, 'id' | 'createdAt'>): Promise<MockFollowup> {
    await this.initialize();

    const newFollowup: MockFollowup = {
      ...data,
      id: `followup_${Date.now()}`,
      createdAt: new Date(),
    };

    this.followups.push(newFollowup);
    logger.info('Created followup', { caseId: newFollowup.caseId, type: newFollowup.type });
    return newFollowup;
  }

  /**
   * Complete a followup
   */
  async completeFollowup(followupId: string): Promise<MockFollowup | null> {
    await this.initialize();

    const followup = this.followups.find(f => f.id === followupId);
    if (!followup) return null;

    followup.status = 'completed';
    followup.completedAt = new Date();
    logger.info('Completed followup', { followupId });
    return followup;
  }

  /**
   * Cancel a followup
   */
  async cancelFollowup(followupId: string): Promise<boolean> {
    await this.initialize();

    const followup = this.followups.find(f => f.id === followupId);
    if (!followup) return false;

    followup.status = 'cancelled';
    logger.info('Cancelled followup', { followupId });
    return true;
  }

  /**
   * Get statistics
   */
  async getStatistics(userId: string): Promise<{
    totalReminders: number;
    pendingReminders: number;
    urgentReminders: number;
    totalFollowups: number;
    pendingFollowups: number;
  }> {
    await this.initialize();

    const userReminders = this.reminders.filter(r => r.userId === userId);
    const userFollowups = this.followups.filter(f => f.userId === userId);

    return {
      totalReminders: userReminders.length,
      pendingReminders: userReminders.filter(r => r.status === 'pending').length,
      urgentReminders: userReminders.filter(r => r.priority === 'urgent').length,
      totalFollowups: userFollowups.length,
      pendingFollowups: userFollowups.filter(f => f.status === 'pending').length,
    };
  }

  /**
   * Clear all data (for testing)
   */
  async clearAll(): Promise<void> {
    this.reminders = [];
    this.followups = [];
    this.initialized = false;
    logger.info('Cleared all reminder and followup data');
  }
}

export default MockReminderFollowupService;
