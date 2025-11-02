/**
 * Calendar Service
 * ================
 * Cross-platform calendar integration with web fallback
 * Works on iOS, Android, and Web
 */

import { Platform, Alert } from 'react-native';
import * as Calendar from 'expo-calendar';
import { Appointment } from '../types/Booking';
import { createLogger } from './Logger';

const logger = createLogger('CalendarService');

export interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  alarms?: Array<{ relativeOffset: number }>; // minutes before event
}

class CalendarService {
  private static instance: CalendarService;
  private hasPermission: boolean = false;
  private defaultCalendarId: string | null = null;

  private constructor() {}

  public static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  /**
   * Check if calendar is supported on this platform
   */
  public isSupported(): boolean {
    // Calendar is supported on iOS and Android, not on web
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Request calendar permissions (iOS/Android only)
   */
  public async requestPermissions(): Promise<boolean> {
    if (!this.isSupported()) {
      logger.info('Calendar not supported on web platform');
      return false;
    }

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      this.hasPermission = status === 'granted';
      
      if (this.hasPermission) {
        await this.findDefaultCalendar();
        logger.info('Calendar permissions granted');
      } else {
        logger.info('Calendar permissions denied');
      }
      
      return this.hasPermission;
    } catch (error) {
      logger.error('Error requesting calendar permissions', error);
      return false;
    }
  }

  /**
   * Find the default calendar to use
   */
  private async findDefaultCalendar(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      // Find first writable calendar
      const writableCalendar = calendars.find(cal => cal.allowsModifications);
      
      if (writableCalendar) {
        this.defaultCalendarId = writableCalendar.id;
        logger.info('Default calendar found', { title: writableCalendar.title });
      } else {
        logger.warn('No writable calendar found');
      }
    } catch (error) {
      logger.error('Error finding default calendar', error);
    }
  }

  /**
   * Add appointment to device calendar
   * On web, falls back to download .ics file
   */
  public async addAppointmentToCalendar(appointment: {
    doctorName: string;
    doctorSpecialty: string;
    date: Date;
    startTime: string;
    duration?: number; // minutes, default 30
    location?: string;
    consultationFee?: number;
    reason?: string;
  }): Promise<boolean> {
    // Web fallback: Download .ics file
    if (!this.isSupported()) {
      return await this.downloadICSFile(appointment);
    }

    // Request permissions if not already granted
    if (!this.hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        Alert.alert(
          'Calendar Access Required',
          'Please grant calendar permissions to add this appointment to your calendar.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }

    // Check if we have a default calendar
    if (!this.defaultCalendarId) {
      Alert.alert(
        'No Calendar Available',
        'No writable calendar found on your device.',
        [{ text: 'OK' }]
      );
      return false;
    }

    try {
      // Parse start time
      const [hours, minutes] = appointment.startTime.split(':').map(Number);
      const startDate = new Date(appointment.date);
      startDate.setHours(hours, minutes, 0, 0);
      
      // Calculate end time
      const duration = appointment.duration || 30;
      const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

      // Create event
      const eventId = await Calendar.createEventAsync(this.defaultCalendarId, {
        title: `Appointment: Dr. ${appointment.doctorName}`,
        startDate,
        endDate,
        location: appointment.location || `${appointment.doctorSpecialty} Consultation`,
        notes: this.buildEventNotes(appointment),
        alarms: [
          { relativeOffset: -24 * 60 }, // 24 hours before
          { relativeOffset: -60 },      // 1 hour before
          { relativeOffset: -15 }       // 15 minutes before
        ],
      });

      logger.info('Event added to calendar', { eventId, doctorName: appointment.doctorName });
      
      Alert.alert(
        'Added to Calendar',
        '✅ Appointment added to your calendar with reminders:\n• 24 hours before\n• 1 hour before\n• 15 minutes before',
        [{ text: 'OK' }]
      );
      
      return true;
      
    } catch (error) {
      logger.error('Error adding to calendar', error);
      
      Alert.alert(
        'Calendar Error',
        'Failed to add appointment to calendar. Please try again.',
        [{ text: 'OK' }]
      );
      
      return false;
    }
  }

  /**
   * Build event notes from appointment details
   */
  private buildEventNotes(appointment: {
    doctorName: string;
    doctorSpecialty: string;
    reason?: string;
    consultationFee?: number;
  }): string {
    let notes = `Doctor: Dr. ${appointment.doctorName}\n`;
    notes += `Specialty: ${appointment.doctorSpecialty}\n`;
    
    if (appointment.reason) {
      notes += `Reason: ${appointment.reason}\n`;
    }
    
    if (appointment.consultationFee) {
      notes += `Fee: $${appointment.consultationFee}\n`;
    }
    
    notes += '\nGenerated by MediBot';
    
    return notes;
  }

  /**
   * Download .ics file for web platform
   */
  private async downloadICSFile(appointment: {
    doctorName: string;
    doctorSpecialty: string;
    date: Date;
    startTime: string;
    duration?: number;
    location?: string;
    reason?: string;
  }): Promise<boolean> {
    try {
      // Parse start time
      const [hours, minutes] = appointment.startTime.split(':').map(Number);
      const startDate = new Date(appointment.date);
      startDate.setHours(hours, minutes, 0, 0);
      
      // Calculate end time
      const duration = appointment.duration || 30;
      const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

      // Generate .ics file content
      const icsContent = this.generateICS({
        title: `Appointment: Dr. ${appointment.doctorName}`,
        startDate,
        endDate,
        location: appointment.location || `${appointment.doctorSpecialty} Consultation`,
        notes: this.buildEventNotes(appointment),
        alarms: [
          { relativeOffset: -24 * 60 },
          { relativeOffset: -60 },
          { relativeOffset: -15 }
        ]
      });

      // Create blob and download
      if (typeof window !== 'undefined') {
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `medibot-appointment-${startDate.getTime()}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        Alert.alert(
          'Calendar File Downloaded',
          'Calendar file (.ics) downloaded. Open it to add the appointment to your calendar.',
          [{ text: 'OK' }]
        );
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      logger.error('Error downloading calendar file', error);
      
      Alert.alert(
        'Download Error',
        'Failed to download calendar file. Please try again.',
        [{ text: 'OK' }]
      );
      
      return false;
    }
  }

  /**
   * Generate .ics file content (RFC 5545 format)
   */
  private generateICS(event: CalendarEvent): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    let ics = 'BEGIN:VCALENDAR\n';
    ics += 'VERSION:2.0\n';
    ics += 'PRODID:-//MediBot//Healthcare App//EN\n';
    ics += 'CALSCALE:GREGORIAN\n';
    ics += 'METHOD:PUBLISH\n';
    ics += 'BEGIN:VEVENT\n';
    ics += `UID:${Date.now()}@medibot.com\n`;
    ics += `DTSTAMP:${formatDate(new Date())}\n`;
    ics += `DTSTART:${formatDate(event.startDate)}\n`;
    ics += `DTEND:${formatDate(event.endDate)}\n`;
    ics += `SUMMARY:${event.title}\n`;
    
    if (event.location) {
      ics += `LOCATION:${event.location}\n`;
    }
    
    if (event.notes) {
      ics += `DESCRIPTION:${event.notes.replace(/\n/g, '\\n')}\n`;
    }

    // Add alarms
    if (event.alarms) {
      event.alarms.forEach(alarm => {
        ics += 'BEGIN:VALARM\n';
        ics += 'ACTION:DISPLAY\n';
        ics += `TRIGGER:-PT${Math.abs(alarm.relativeOffset)}M\n`;
        ics += 'DESCRIPTION:Reminder\n';
        ics += 'END:VALARM\n';
      });
    }
    
    ics += 'END:VEVENT\n';
    ics += 'END:VCALENDAR\n';
    
    return ics;
  }

  /**
   * Check calendar permissions status
   */
  public async checkPermissions(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      logger.error('Error checking calendar permissions', error);
      return false;
    }
  }
}

export const calendarService = CalendarService.getInstance();
export default CalendarService;
