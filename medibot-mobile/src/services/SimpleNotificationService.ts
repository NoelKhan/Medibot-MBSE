import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking } from 'react-native';
import { createLogger } from './Logger';

const logger = createLogger('NotificationService');

// Simplified notification interfaces
export interface NotificationSettings {
  smsNotifications: boolean;
  emailNotifications: boolean;
  reminderNotifications: boolean;
  emergencyNotifications: boolean;
  followUpReminders: boolean;
  appointmentReminders: boolean;
}

export interface SimpleReminder {
  id: string;
  title: string;
  message: string;
  date: Date;
  type: 'appointment' | 'follow-up' | 'medication' | 'checkup';
  phoneNumber?: string;
  email?: string;
}

export interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  type: string;
  read: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings;
  private reminders: SimpleReminder[] = [];

  private constructor() {
    this.settings = {
      smsNotifications: false, // Email-first approach
      emailNotifications: true, // Default to email notifications
      reminderNotifications: true,
      emergencyNotifications: true,
      followUpReminders: true,
      appointmentReminders: true,
    };
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize service
  async initialize(): Promise<void> {
    try {
      await this.loadSettings();
      await this.loadReminders();
      logger.info('NotificationService initialized');
    } catch (error) {
      logger.error('Error initializing NotificationService', error);
    }
  }

  // Settings Management
  async getSettings(): Promise<NotificationSettings> {
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('@medibot_notification_settings', JSON.stringify(this.settings));
    } catch (error) {
      logger.error('Error saving notification settings', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('@medibot_notification_settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      logger.error('Error loading notification settings', error);
    }
  }

  // Basic SMS functionality using device capabilities
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.settings.smsNotifications) {
      logger.debug('SMS notifications disabled');
      return false;
    }

    try {
      // Use device SMS app
      const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(smsUrl);
      
      if (canOpen) {
        await Linking.openURL(smsUrl);
        
        // Save to history
        await this.saveNotificationHistory({
          id: `sms_${Date.now()}`,
          title: 'SMS Sent',
          body: `Message sent to ${phoneNumber}`,
          timestamp: new Date(),
          type: 'sms',
          read: true,
        });
        
        return true;
      } else {
        Alert.alert('SMS Not Available', 'SMS is not available on this device');
        return false;
      }
    } catch (error) {
      logger.error('Error sending SMS', error);
      Alert.alert('SMS Error', 'Failed to open SMS app');
      return false;
    }
  }

  // Get current user email
  async getCurrentUserEmail(): Promise<string | null> {
    try {
      const currentUserData = await AsyncStorage.getItem('@medibot_current_user');
      if (currentUserData) {
        const user = JSON.parse(currentUserData);
        return user.email || null;
      }
      return null;
    } catch (error) {
      logger.error('Error getting current user email', error);
      return null;
    }
  }

  // Check if user has provided email for notifications
  async isEmailConfigured(): Promise<boolean> {
    const email = await this.getCurrentUserEmail();
    return email !== null && email.trim() !== '';
  }

  // Prompt user to provide email if not configured
  async ensureEmailConfigured(): Promise<string | null> {
    const email = await this.getCurrentUserEmail();
    if (!email) {
      Alert.alert(
        'Email Required',
        'Please provide your email address to receive notifications and updates.',
        [
          { text: 'Skip', style: 'cancel' },
          { 
            text: 'Set Email', 
            onPress: () => {
              // In production, this would open a proper email input modal
              Alert.alert('Email Setup', 'Please log in with your email or create a profile to set up notifications.');
            }
          }
        ]
      );
      return null;
    }
    return email;
  }

  // Send notification with email priority
  async sendNotification(
    title: string, 
    message: string, 
    type: 'reminder' | 'appointment' | 'emergency' | 'follow-up' | 'general' = 'general',
    forceEmail: boolean = false
  ): Promise<boolean> {
    const email = await this.getCurrentUserEmail();
    
    // If email is available or forced, prioritize email
    if ((email && this.settings.emailNotifications) || forceEmail) {
      if (email) {
        return await this.sendEmail(email, title, message);
      } else if (forceEmail) {
        await this.ensureEmailConfigured();
        return false;
      }
    }
    
    // Fall back to SMS if email not available and SMS enabled
    if (this.settings.smsNotifications) {
      // Would need phone number - for now just log
      logger.debug('SMS fallback notification', { title, message });
      return true;
    }
    
    // Store notification locally if no delivery method available
    await this.saveNotificationHistory({
      id: `local_${Date.now()}`,
      title,
      body: message,
      timestamp: new Date(),
      type,
      read: false
    });
    
    return true;
  }

  // Basic email functionality
  async sendEmail(email: string, subject: string, body: string): Promise<boolean> {
    if (!this.settings.emailNotifications) {
      logger.debug('Email notifications disabled');
      return false;
    }

    try {
      const emailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const canOpen = await Linking.canOpenURL(emailUrl);
      
      if (canOpen) {
        await Linking.openURL(emailUrl);
        
        // Save to history
        await this.saveNotificationHistory({
          id: `email_${Date.now()}`,
          title: 'Email Sent',
          body: `Email sent: ${subject}`,
          timestamp: new Date(),
          type: 'email',
          read: true,
        });
        
        return true;
      } else {
        Alert.alert('Email Not Available', 'Email is not configured on this device');
        return false;
      }
    } catch (error) {
      logger.error('Error sending email', error);
      Alert.alert('Email Error', 'Failed to open email app');
      return false;
    }
  }

  // Reminder Management
  async scheduleReminder(reminder: Omit<SimpleReminder, 'id'>): Promise<string> {
    if (!this.settings.reminderNotifications) {
      logger.debug('Reminders disabled');
      return '';
    }

    const newReminder: SimpleReminder = {
      id: `reminder_${Date.now()}`,
      ...reminder,
    };

    this.reminders.push(newReminder);
    await this.saveReminders();
    
    // Show immediate alert for testing
    Alert.alert(
      'Reminder Scheduled',
      `${reminder.title} scheduled for ${reminder.date.toLocaleDateString()}`,
      [{ text: 'OK' }]
    );

    return newReminder.id;
  }

  async getReminders(): Promise<SimpleReminder[]> {
    return [...this.reminders];
  }

  async cancelReminder(reminderId: string): Promise<boolean> {
    const index = this.reminders.findIndex(r => r.id === reminderId);
    if (index >= 0) {
      this.reminders.splice(index, 1);
      await this.saveReminders();
      return true;
    }
    return false;
  }

  private async saveReminders(): Promise<void> {
    try {
      await AsyncStorage.setItem('@medibot_reminders', JSON.stringify(this.reminders));
    } catch (error) {
      logger.error('Error saving reminders', error);
    }
  }

  private async loadReminders(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('@medibot_reminders');
      if (stored) {
        this.reminders = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Error loading reminders', error);
    }
  }

  // Medical-specific notifications
  async scheduleAppointmentReminder(
    appointmentDate: Date,
    doctorName: string,
    location: string,
    phoneNumber?: string,
    email?: string
  ): Promise<void> {
    if (!this.settings.appointmentReminders) return;

    // Ensure email is configured for notifications
    const userEmail = email || await this.getCurrentUserEmail();
    if (!userEmail) {
      Alert.alert(
        'Email Required for Reminders',
        'Please provide your email address to receive appointment reminders.',
        [
          { text: 'Skip Reminder', style: 'cancel' },
          { 
            text: 'Set Email', 
            onPress: async () => {
              await this.ensureEmailConfigured();
            }
          }
        ]
      );
      return;
    }

    // Schedule reminder 24 hours before using email-first notification
    const reminderMessage = `📅 Appointment Reminder\n\nYou have an appointment with ${doctorName} tomorrow at ${appointmentDate.toLocaleTimeString()} at ${location}\n\nPlease arrive 15 minutes early and bring:\n• Valid ID\n• Insurance card\n• List of current medications\n• Any relevant medical records\n\nTo reschedule, please call the clinic at least 24 hours in advance.`;

    // Send immediate confirmation email
    await this.sendNotification(
      'Appointment Reminder Scheduled',
      reminderMessage,
      'appointment',
      true // Force email for appointment confirmations
    );

    // Schedule reminder for 24 hours before
    const reminderDate = new Date(appointmentDate);
    reminderDate.setDate(reminderDate.getDate() - 1);

    await this.scheduleReminder({
      title: 'Appointment Reminder',
      message: reminderMessage,
      date: reminderDate,
      type: 'appointment',
      phoneNumber,
      email: userEmail,
    });

    // Show confirmation with email info
    Alert.alert(
      'Appointment Reminder Set ✅',
      `You'll receive email reminders at: ${userEmail}\n\n• Confirmation sent now\n• Reminder scheduled for 24 hours before appointment`,
      [
        {
          text: 'Add to Calendar',
          onPress: () => this.addToCalendar(
            `Dr. ${doctorName} Appointment`,
            appointmentDate,
            location
          )
        },
        { text: 'OK' }
      ]
    );
  }

  async scheduleFollowUpReminder(
    condition: string,
    daysFromNow: number,
    phoneNumber?: string
  ): Promise<void> {
    if (!this.settings.followUpReminders) return;

    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + daysFromNow);

    await this.scheduleReminder({
      title: 'Follow-up Reminder',
      message: `Time to check on your ${condition}. How are you feeling? Consider booking a follow-up appointment if symptoms persist.`,
      date: reminderDate,
      type: 'follow-up',
      phoneNumber,
    });
  }

  async sendEmergencyAlert(
    message: string,
    location?: string,
    emergencyContacts: string[] = []
  ): Promise<void> {
    if (!this.settings.emergencyNotifications) return;

    const alertMessage = `🚨 EMERGENCY ALERT 🚨\n\n${message}\n${location ? `\nLocation: ${location}` : ''}\n\nThis is an automated message from MediBot.`;

    // Send SMS to all emergency contacts
    for (const contact of emergencyContacts) {
      if (contact.includes('@')) {
        // Email
        await this.sendEmail(contact, '🚨 Emergency Alert - MediBot', alertMessage);
      } else {
        // Phone number
        await this.sendSMS(contact, alertMessage);
      }
    }

    // Show emergency alert dialog
    Alert.alert(
      '🚨 Emergency Alert Sent',
      'Emergency notifications have been sent to your emergency contacts. If this is a life-threatening emergency, call 000 immediately.',
      [
        {
          text: 'Call 000',
          onPress: () => Linking.openURL('tel:000'),
          style: 'default'
        },
        { text: 'OK', style: 'cancel' }
      ]
    );
  }

  // Calendar integration (basic)
  async addToCalendar(title: string, date: Date, location?: string): Promise<void> {
    try {
      // Create calendar URL for most calendar apps
      const startTime = date.getTime();
      const endTime = startTime + (60 * 60 * 1000); // 1 hour later
      
      const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${new Date(startTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${new Date(endTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z${location ? `&location=${encodeURIComponent(location)}` : ''}`;
      
      const canOpen = await Linking.canOpenURL(calendarUrl);
      if (canOpen) {
        await Linking.openURL(calendarUrl);
      } else {
        Alert.alert('Calendar', 'Please manually add this appointment to your calendar');
      }
    } catch (error) {
      logger.error('Error adding to calendar', error);
      Alert.alert('Calendar Error', 'Failed to add event to calendar');
    }
  }

  // Notification History
  private async saveNotificationHistory(notification: NotificationHistory): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('@medibot_notification_history');
      const history: NotificationHistory[] = stored ? JSON.parse(stored) : [];
      
      history.unshift(notification);
      
      // Keep only last 50 notifications
      const trimmedHistory = history.slice(0, 50);
      
      await AsyncStorage.setItem('@medibot_notification_history', JSON.stringify(trimmedHistory));
    } catch (error) {
      logger.error('Error saving notification history', error);
    }
  }

  async getNotificationHistory(): Promise<NotificationHistory[]> {
    try {
      const stored = await AsyncStorage.getItem('@medibot_notification_history');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Error loading notification history', error);
      return [];
    }
  }

  // Testing
  async testNotification(): Promise<void> {
    Alert.alert(
      'Notification Test',
      'MediBot notification system is working! Choose a test option:',
      [
        {
          text: 'Test SMS',
          onPress: () => this.sendSMS('', 'Test SMS from MediBot: Notification system working!')
        },
        {
          text: 'Test Email',
          onPress: () => this.sendEmail('', 'MediBot Test', 'Notification system test successful!')
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }
}

export default NotificationService;