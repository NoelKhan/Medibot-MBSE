import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from './Logger';

const logger = createLogger('FollowUpService');

export interface FollowUpReminder {
  id: string;
  userId: string;
  conversationId: string;
  message: string;
  scheduledDate: Date;
  completed: boolean;
  createdAt: Date;
  type: 'check-in' | 'medication' | 'appointment' | 'symptom-monitor';
}

class FollowUpService {
  private static instance: FollowUpService;
  private readonly STORAGE_KEY = 'medibot_followups';

  static getInstance(): FollowUpService {
    if (!FollowUpService.instance) {
      FollowUpService.instance = new FollowUpService();
    }
    return FollowUpService.instance;
  }

  async createFollowUp(
    userId: string, 
    conversationId: string, 
    message: string, 
    scheduledDate: Date,
    type: FollowUpReminder['type'] = 'check-in'
  ): Promise<FollowUpReminder> {
    const followUp: FollowUpReminder = {
      id: `followup_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      userId,
      conversationId,
      message,
      scheduledDate,
      completed: false,
      createdAt: new Date(),
      type,
    };

    const followUps = await this.getFollowUps(userId);
    followUps.push(followUp);
    
    await AsyncStorage.setItem(
      `${this.STORAGE_KEY}_${userId}`, 
      JSON.stringify(followUps)
    );

    return followUp;
  }

  async getFollowUps(userId: string): Promise<FollowUpReminder[]> {
    try {
      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        logger.warn('Invalid follow-ups data format, expected array');
        return [];
      }
      
      return parsed.map((item: any) => ({
        ...item,
        scheduledDate: new Date(item.scheduledDate),
        createdAt: new Date(item.createdAt),
      }));
    } catch (error) {
      logger.error('Error loading follow-ups', error);
      return [];
    }
  }

  async getPendingFollowUps(userId: string): Promise<FollowUpReminder[]> {
    const followUps = await this.getFollowUps(userId);
    const now = new Date();
    
    return followUps.filter(
      followUp => !followUp.completed && followUp.scheduledDate <= now
    );
  }

  async completeFollowUp(userId: string, followUpId: string): Promise<void> {
    const followUps = await this.getFollowUps(userId);
    const index = followUps.findIndex(f => f.id === followUpId);
    
    if (index !== -1) {
      followUps[index].completed = true;
      await AsyncStorage.setItem(
        `${this.STORAGE_KEY}_${userId}`, 
        JSON.stringify(followUps)
      );
    }
  }

  async getUpcomingFollowUps(userId: string, days: number = 7): Promise<FollowUpReminder[]> {
    const followUps = await this.getFollowUps(userId);
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    
    return followUps.filter(
      followUp => !followUp.completed && 
      followUp.scheduledDate >= now && 
      followUp.scheduledDate <= futureDate
    ).sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }

  generateFollowUpSuggestions(symptoms: string[], severity: number): FollowUpReminder['type'][] {
    const suggestions: FollowUpReminder['type'][] = ['check-in'];
    
    const emergencySymptoms = [
      'chest pain', 'difficulty breathing', 'severe headache', 
      'high fever', 'severe bleeding'
    ];
    
    const medicationSymptoms = [
      'pain', 'fever', 'infection', 'inflammation'
    ];
    
    const monitoringSymptoms = [
      'headache', 'dizziness', 'fatigue', 'nausea'
    ];

    if (severity >= 7) {
      suggestions.push('appointment');
    }

    if (symptoms.some(s => emergencySymptoms.some(es => s.toLowerCase().includes(es)))) {
      suggestions.push('appointment');
      suggestions.push('symptom-monitor');
    }

    if (symptoms.some(s => medicationSymptoms.some(ms => s.toLowerCase().includes(ms)))) {
      suggestions.push('medication');
    }

    if (symptoms.some(s => monitoringSymptoms.some(ms => s.toLowerCase().includes(ms)))) {
      suggestions.push('symptom-monitor');
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  getFollowUpSchedule(type: FollowUpReminder['type'], severity: number = 5): Date {
    const now = new Date();
    const schedule = new Date(now);

    switch (type) {
      case 'check-in':
        if (severity >= 7) {
          schedule.setHours(now.getHours() + 4); // 4 hours for high severity
        } else if (severity >= 5) {
          schedule.setDate(now.getDate() + 1); // Next day for moderate
        } else {
          schedule.setDate(now.getDate() + 3); // 3 days for low severity
        }
        break;
        
      case 'medication':
        schedule.setHours(now.getHours() + 6); // Check medication effectiveness in 6 hours
        break;
        
      case 'appointment':
        schedule.setDate(now.getDate() + 1); // Next day for appointment follow-up
        break;
        
      case 'symptom-monitor':
        schedule.setHours(now.getHours() + 2); // Monitor symptoms in 2 hours
        break;
        
      default:
        schedule.setDate(now.getDate() + 1);
    }

    return schedule;
  }
}

export default FollowUpService;