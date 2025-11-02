import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Doctor, 
  Appointment, 
  BookingRequest, 
  AvailabilitySlot,
  BookingAPI,
  BackendConfig,
  APIResponse 
} from '../types/Booking';
import { bookingsApiService } from './BookingsApiService';
import { remindersApiService } from './RemindersApiService';
import doctorsApiService, { DoctorProfile, DaySlots } from './DoctorsApiService';
import { createLogger } from './Logger';

const logger = createLogger('BookingService');

class BookingService implements BookingAPI {
  private static instance: BookingService;
  private config: BackendConfig;

  constructor() {
    // Configurable backend integration - easily modifiable for real APIs
    this.config = {
      baseURL: process.env.EXPO_PUBLIC_BOOKING_API_URL || 'https://api.healthbooking.com.au',
      apiKey: process.env.EXPO_PUBLIC_BOOKING_API_KEY || 'demo-api-key',
      endpoints: {
        doctors: '/api/v1/doctors',
        appointments: '/api/v1/appointments', 
        emergency: '/api/v1/emergency',
        staff: '/api/v1/staff'
      },
      timeout: 10000,
      retryAttempts: 3
    };
  }

  static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  // Mock data for demonstration - easily replaceable with real API calls
  private async getMockDoctors(): Promise<Doctor[]> {
    return [
      {
        id: 'doc_001',
        name: 'Dr. Sarah Chen',
        specialty: 'General Practice',
        hospital: 'Royal Melbourne Hospital',
        rating: 4.8,
        experience: 12,
        availability: await this.generateAvailability('doc_001'),
        location: {
          address: '300 Grattan Street',
          city: 'Melbourne',
          postcode: '3000',
          state: 'VIC'
        },
        consultationFee: 85,
        qualifications: ['MBBS', 'FRACGP'],
        languages: ['English', 'Mandarin', 'Cantonese']
      },
      {
        id: 'doc_002', 
        name: 'Dr. James Morrison',
        specialty: 'Cardiology',
        hospital: 'St Vincent\'s Hospital',
        rating: 4.9,
        experience: 18,
        availability: await this.generateAvailability('doc_002'),
        location: {
          address: '41 Victoria Parade',
          city: 'Melbourne',
          postcode: '3065',
          state: 'VIC'
        },
        consultationFee: 220,
        qualifications: ['MBBS', 'FRACP', 'PhD'],
        languages: ['English']
      },
      {
        id: 'doc_003',
        name: 'Dr. Priya Patel',
        specialty: 'Dermatology', 
        hospital: 'Alfred Hospital',
        rating: 4.7,
        experience: 10,
        availability: await this.generateAvailability('doc_003'),
        location: {
          address: '55 Commercial Road',
          city: 'Melbourne',
          postcode: '3004',
          state: 'VIC'
        },
        consultationFee: 180,
        qualifications: ['MBBS', 'FACD'],
        languages: ['English', 'Hindi', 'Gujarati']
      },
      {
        id: 'doc_004',
        name: 'Dr. Michael O\'Brien',
        specialty: 'Mental Health',
        hospital: 'Melbourne Clinic',
        rating: 4.6,
        experience: 15,
        availability: await this.generateAvailability('doc_004'),
        location: {
          address: '130 Church Street',
          city: 'Melbourne',
          postcode: '3121',
          state: 'VIC'
        },
        consultationFee: 160,
        qualifications: ['MBBS', 'FRANZCP'],
        languages: ['English']
      }
    ];
  }

  private async generateAvailability(doctorId: string): Promise<AvailabilitySlot[]> {
    try {
      const slots: AvailabilitySlot[] = [];
      const today = new Date();
      
      // Generate next 14 days of availability
      for (let i = 1; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Skip weekends for most specialties
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        // Create date string in ISO format for consistency
        const dateStr = date.toISOString().split('T')[0];
        
        // Morning slots (9 AM - 12 PM)
        for (let hour = 9; hour < 12; hour++) {
          const isAvailable = Math.random() > 0.3; // 70% availability
          slots.push({
            id: `${doctorId}_${dateStr}_${hour}00`,
            date: new Date(date), // Create fresh date object
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
            isAvailable,
            consultationType: 'both'
          });
        }
        
        // Afternoon slots (2 PM - 5 PM)  
        for (let hour = 14; hour < 17; hour++) {
          const isAvailable = Math.random() > 0.4; // 60% availability
          slots.push({
            id: `${doctorId}_${dateStr}_${hour}00`,
            date: new Date(date), // Create fresh date object
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
            isAvailable,
            consultationType: 'both'
          });
        }
      }
      
      return slots.filter(slot => slot.isAvailable);
    } catch (error: any) {
      logger.error('Error generating availability', { error: error.message });
      throw new Error('Failed to generate availability slots');
    }
  }

  // API Methods - Ready for real backend integration
  async searchDoctors(specialty?: string, location?: string, date?: Date): Promise<Doctor[]> {
    try {
      // Try API first (only if backend is configured)
      const hasBackendConfig = process.env.EXPO_PUBLIC_BOOKING_API_URL && 
                               process.env.EXPO_PUBLIC_BOOKING_API_URL !== 'https://api.healthbooking.com.au';
      
      if (hasBackendConfig) {
        try {
          const { apiClient } = await import('./ApiClient');
          const params = new URLSearchParams();
          if (specialty && specialty !== 'All') params.append('specialty', specialty);
          if (location) params.append('location', location);
          if (date) params.append('date', date.toISOString());
          
          const response = await apiClient.get<Doctor[]>(
            `/api/doctors?${params.toString()}`
          );
          logger.info('Loaded doctors from API', { count: response.length });
          return response;
        } catch (apiError) {
          logger.debug('Backend API not available, using mock data');
        }
      }
      
      // Use mock data
      const doctors = await this.getMockDoctors();
      
      // Filter by specialty if provided
      if (specialty && specialty !== 'All') {
        return doctors.filter(doc => 
          doc.specialty.toLowerCase().includes(specialty.toLowerCase())
        );
      }
      
      return doctors;
    } catch (error) {
      logger.error('Error searching doctors', error);
      throw new Error('Failed to search doctors. Please try again.');
    }
  }

  async getDoctorAvailability(doctorId: string, date: Date): Promise<AvailabilitySlot[]> {
    try {
      logger.info('Getting doctor availability', { doctorId, date: date.toISOString() });
      
      // Generate availability slots
      const slots = await this.generateAvailability(doctorId);
      
      // Filter only available slots
      const availableSlots = slots.filter((slot: AvailabilitySlot) => slot.isAvailable);
      
      logger.info('Generated availability slots', { 
        total: slots.length, 
        available: availableSlots.length 
      });
      
      if (availableSlots.length === 0) {
        logger.warn('No available slots found for doctor', { doctorId });
      }
      
      return availableSlots;
      
    } catch (error: any) {
      logger.error('Error getting doctor availability', { 
        error: error.message,
        stack: error.stack,
        doctorId 
      });
      throw new Error(`Failed to get availability: ${error.message || 'Unknown error'}`);
    }
  }

  async createAppointment(request: BookingRequest): Promise<{ appointmentId: string; confirmationCode: string }> {
    try {
      logger.info('Creating appointment via backend API');
      
      // Get current user ID (would come from auth service)
      const userId = await this.getCurrentUserId();
      
      // Create appointment via backend API
      const appointment = await bookingsApiService.createAppointment({
        patientId: userId,
        doctorId: request.doctorId,
        scheduledTime: new Date(
          request.preferredDate.toDateString() + ' ' + request.preferredTime
        ).toISOString(),
        appointmentType: request.consultationType,
        reason: request.reason,
      });

      logger.info('Appointment created', { appointmentId: appointment.id });

      // Backend automatically:
      // 1. Sends push notification (appointment confirmed)
      // 2. Sends email confirmation (if enabled in preferences)
      // 3. Creates reminders (1hr + 24hr before appointment)
      
      // Store locally for offline access
      await this.saveAppointment({
        id: appointment.id,
        userId: appointment.userId,
        doctorId: request.doctorId,
        appointmentDate: request.preferredDate,
        startTime: request.preferredTime,
        endTime: this.calculateEndTime(request.preferredTime),
        consultationType: request.consultationType,
        status: 'scheduled',
        reason: request.reason,
        emergencyLevel: request.urgency === 'urgent' ? 'high' : 'low',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      logger.info('Appointment notifications and reminders created automatically by backend');
      
      // Generate confirmation code (backend should ideally provide this)
      const confirmationCode = `MED${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      return { 
        appointmentId: appointment.id, 
        confirmationCode
      };
      
    } catch (error) {
      logger.error('Error creating appointment', error);
      
      // Fallback to local-only booking if backend fails
      logger.info('Falling back to local booking');
      const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const randomStr = Math.random().toString(36).substring(2, 8);
      const confirmationCode = `MED${randomStr.toUpperCase()}`;
      
      const appointment: Appointment = {
        id: appointmentId,
        userId: 'current_user',
        doctorId: request.doctorId,
        appointmentDate: request.preferredDate,
        startTime: request.preferredTime,
        endTime: this.calculateEndTime(request.preferredTime),
        consultationType: request.consultationType,
        status: 'scheduled',
        reason: request.reason,
        emergencyLevel: request.urgency === 'urgent' ? 'high' : 'low',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await this.saveAppointment(appointment);
      
      return { appointmentId, confirmationCode };
    }
  }

  private async getCurrentUserId(): Promise<string> {
    try {
      const userStr = await AsyncStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && typeof user === 'object') {
          return user.id || user.userId || 'current_user';
        }
      }
      return 'current_user';
    } catch (error) {
      logger.error('Error getting current user', error);
      return 'current_user';
    }
  }

  async cancelAppointment(appointmentId: string, reason: string): Promise<boolean> {
    try {
      logger.info('Cancelling appointment via backend API', { appointmentId });
      
      // Cancel via backend API (also cancels related reminders)
      await bookingsApiService.cancelAppointment(appointmentId);
      
      logger.info('Appointment cancelled, reminders removed automatically');
      
      // Update local storage
      const appointments = await this.getStoredAppointments();
      const updatedAppointments = appointments.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'cancelled' as const, notes: reason, updatedAt: new Date() }
          : apt
      );
      
      await AsyncStorage.setItem('@medibot_appointments', JSON.stringify(updatedAppointments));
      return true;
      
    } catch (error) {
      logger.error('Error cancelling appointment via API', error);
      logger.info('Falling back to local cancellation');
      
      // Fallback: Update locally
      const appointments = await this.getStoredAppointments();
      const updatedAppointments = appointments.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'cancelled' as const, notes: reason, updatedAt: new Date() }
          : apt
      );
      
      await AsyncStorage.setItem('@medibot_appointments', JSON.stringify(updatedAppointments));
      return true;
    }
  }

    async getAppointments(userId: string): Promise<Appointment[]> {
    try {
      logger.info('Fetching appointments from backend API');
      
      // Try backend API first
      const backendAppointments = await bookingsApiService.getAppointments(userId);
      
      // Convert backend format to our format
      // Backend returns: { id, userId, doctorId, appointmentDate, startTime, endTime, consultationType, status, reason, createdAt, updatedAt }
      const formattedAppointments: Appointment[] = backendAppointments.map(apt => ({
        id: apt.id,
        userId: apt.userId,
        doctorId: apt.doctorId,
        appointmentDate: new Date(apt.appointmentDate),
        startTime: apt.startTime,
        endTime: apt.endTime,
        consultationType: apt.consultationType as 'in-person' | 'telehealth',
        status: apt.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled',
        reason: apt.reason || '',
        notes: apt.notes,
        emergencyLevel: apt.status === 'scheduled' ? 'low' : 'medium',
        createdAt: new Date(apt.createdAt),
        updatedAt: new Date(apt.updatedAt)
      }));
      
      // Sync with local storage
      await AsyncStorage.setItem('@medibot_appointments', JSON.stringify(formattedAppointments));
      
      logger.info('Loaded appointments from backend', { count: formattedAppointments.length });
      return formattedAppointments;
      
    } catch (error) {
      logger.error('Error fetching appointments from API', error);
      logger.info('Loading from local storage');
      
      // Fallback to local storage
      return await this.getStoredAppointments();
    }
  }

  // Helper methods
  private calculateEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = hours + 1;
    return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private async saveAppointment(appointment: Appointment): Promise<void> {
    try {
      const appointments = await this.getStoredAppointments();
      appointments.push(appointment);
      await AsyncStorage.setItem('@medibot_appointments', JSON.stringify(appointments));
    } catch (error) {
      logger.error('Error saving appointment', error);
    }
  }

  private async getStoredAppointments(): Promise<Appointment[]> {
    try {
      const stored = await AsyncStorage.getItem('@medibot_appointments');
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        logger.warn('Invalid appointments data format, expected array');
        return [];
      }
      
      return parsed.map((apt: any) => ({
        ...apt,
        appointmentDate: new Date(apt.appointmentDate),
        createdAt: new Date(apt.createdAt),
        updatedAt: new Date(apt.updatedAt)
      }));
    } catch (error) {
      logger.error('Error loading appointments', error);
      return [];
    }
  }

  // Configuration methods for easy backend modification
  updateConfig(newConfig: Partial<BackendConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): BackendConfig {
    return this.config;
  }
}

export default BookingService;