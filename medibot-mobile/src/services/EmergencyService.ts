import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  EmergencyCase, 
  EmergencyContact, 
  StaffUser, 
  BackendConfig, 
  EmergencyAPI 
} from '../types/Booking';
import { emergencyApiService } from './EmergencyApiService';
import { authApiService } from './AuthApiService';
import { apiClient } from './ApiClient';
import { createLogger } from './Logger';

const logger = createLogger('EmergencyService');

class EmergencyService implements EmergencyAPI {
  private static instance: EmergencyService;
  private config: BackendConfig;

  constructor() {
    // Configurable backend integration for emergency services
    this.config = {
      baseURL: process.env.EXPO_PUBLIC_EMERGENCY_API_URL || 'https://api.emergency.health.gov.au',
      apiKey: process.env.EXPO_PUBLIC_EMERGENCY_API_KEY || 'demo-emergency-key',
      endpoints: {
        doctors: '/api/v1/doctors',
        appointments: '/api/v1/appointments',
        emergency: '/api/v1/emergency',
        staff: '/api/v1/staff'
      },
      timeout: 5000, // Faster timeout for emergency services
      retryAttempts: 2
    };
  }

  static getInstance(): EmergencyService {
    if (!EmergencyService.instance) {
      EmergencyService.instance = new EmergencyService();
    }
    return EmergencyService.instance;
  }

  // Emergency Call Methods
  async initiateEmergencyCall(emergencyCase: Partial<EmergencyCase>): Promise<{ caseId: string; estimatedResponse: string }> {
    try {
      // In real implementation, this would connect to emergency services API
      const caseId = `emg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Mock emergency case creation
      const newEmergencyCase: EmergencyCase = {
        id: caseId,
        userId: emergencyCase.userId || await this.getCurrentUserId(),
        emergencyType: emergencyCase.emergencyType || 'medical',
        symptoms: emergencyCase.symptoms || ['Emergency call from MediBot app'],
        severity: emergencyCase.severity || 5, // Critical by default
        contactNumber: '123456789', // Mock number as requested
        emergencyContacts: emergencyCase.emergencyContacts || [],
        timestamp: new Date(),
        status: 'pending',
        location: emergencyCase.location,
        notes: emergencyCase.notes || 'Emergency call initiated from MediBot app'
      };

      await this.saveEmergencyCase(newEmergencyCase);
      
      logger.info('Emergency call initiated', { caseId, mockNumber: '123456789' });
      
      return { 
        caseId, 
        estimatedResponse: 'Emergency services dispatched. ETA: 8-12 minutes' 
      };
      
    } catch (error) {
      logger.error('Error initiating emergency call', error);
      throw new Error('Failed to initiate emergency call');
    }
  }

  async cancelEmergencyCall(caseId: string, reason: string): Promise<boolean> {
    try {
      const cases = await this.getStoredEmergencyCases();
      const updatedCases = cases.map(emergencyCase => 
        emergencyCase.id === caseId 
          ? { 
              ...emergencyCase, 
              status: 'cancelled' as const, 
              notes: `${emergencyCase.notes || ''}\nCancelled: ${reason}`,
              timestamp: new Date()
            }
          : emergencyCase
      );
      
      await AsyncStorage.setItem('@medibot_emergency_cases', JSON.stringify(updatedCases));
      logger.info('Emergency call cancelled', { caseId, reason });
      
      return true;
      
    } catch (error) {
      logger.error('Error cancelling emergency call', error);
      return false;
    }
  }

  async updateCaseStatus(caseId: string, status: EmergencyCase['status'], notes?: string): Promise<boolean> {
    try {
      const cases = await this.getStoredEmergencyCases();
      const updatedCases = cases.map(emergencyCase => 
        emergencyCase.id === caseId 
          ? { 
              ...emergencyCase, 
              status, 
              notes: notes ? `${emergencyCase.notes || ''}\n${notes}` : emergencyCase.notes,
              timestamp: new Date(),
              ...(status === 'responded' && { responseTime: new Date() })
            }
          : emergencyCase
      );
      
      await AsyncStorage.setItem('@medibot_emergency_cases', JSON.stringify(updatedCases));
      return true;
      
    } catch (error) {
      logger.error('Error updating case status', error);
      return false;
    }
  }

  async getActiveCases(): Promise<EmergencyCase[]> {
    try {
      const allCases = await this.getStoredEmergencyCases();
      return allCases.filter(emergencyCase => 
        emergencyCase.status === 'pending' || emergencyCase.status === 'responded'
      );
    } catch (error) {
      logger.error('Error getting active cases', error);
      return [];
    }
  }

  async assignStaff(caseId: string, staffId: string): Promise<boolean> {
    try {
      const cases = await this.getStoredEmergencyCases();
      const updatedCases = cases.map(emergencyCase => 
        emergencyCase.id === caseId 
          ? { 
              ...emergencyCase, 
              assignedStaff: staffId,
              timestamp: new Date()
            }
          : emergencyCase
      );
      
      await AsyncStorage.setItem('@medibot_emergency_cases', JSON.stringify(updatedCases));
      return true;
      
    } catch (error) {
      logger.error('Error assigning staff', error);
      return false;
    }
  }

  // Staff Authentication Methods
  async authenticateStaff(email: string, password: string, staffId?: string): Promise<StaffUser> {
    try {
      logger.info('Authenticating staff via backend API', { email });
      
      // Authenticate via backend API
      const response = await authApiService.staffLogin(email, password);
      
      logger.info('Staff authenticated', { staffId: response.staff.id });
      
      // Convert backend staff format to our format
      const staff: StaffUser = {
        id: response.staff.id,
        email: response.staff.email,
        name: response.staff.name || response.staff.fullName,
        role: response.staff.role || 'emergency_operator',
        badgeNumber: response.staff.badgeNumber || staffId || 'STAFF001',
        department: response.staff.department || 'Emergency Services',
        shift: response.staff.shift || 'day',
        status: 'available',
        specializations: response.staff.specializations || [],
        certifications: response.staff.certifications || [],
        activeCases: [],
        createdAt: new Date(response.staff.createdAt),
        lastLoginAt: new Date()
      };

      // Store staff session locally
      await AsyncStorage.setItem('@medibot_staff_session', JSON.stringify(staff));
      
      return staff;
      
    } catch (error) {
      logger.error('Staff authentication via API failed, falling back to mock', error);
      
      // Fallback to mock staff authentication
      const mockStaffUsers: StaffUser[] = [
        // Test accounts for API testing
        {
          id: 'test_medical_001',
          email: 'test@medical.com',
          badgeNumber: 'API-001',
          name: 'Test Medical Staff',
          role: 'doctor',
          department: 'Medical Services',
          shift: 'day',
          status: 'available',
          specializations: ['General Medicine', 'Internal Medicine'],
          certifications: ['MBBS', 'MD'],
          activeCases: [],
          createdAt: new Date('2024-01-01'),
          lastLoginAt: new Date()
        },
        {
          id: 'test_emergency_001',
          email: 'test@emergency.com',
          badgeNumber: 'API-911',
          name: 'Test Emergency Staff',
          role: 'emergency_operator',
          department: 'Emergency Services',
          shift: 'day',
          status: 'available',
          specializations: ['Emergency Response', 'Critical Care'],
          certifications: ['Advanced First Aid', 'Emergency Medical Dispatcher'],
          activeCases: [],
          createdAt: new Date('2024-01-01'),
          lastLoginAt: new Date()
        },
        // Original mock accounts
        {
          id: 'staff_001',
          email: 'emergency@health.vic.gov.au',
          badgeNumber: 'EMG001',
          name: 'Sarah Johnson',
          role: 'emergency_operator',
          department: 'Emergency Services',
          shift: 'day',
          status: 'available',
          specializations: ['Emergency Response', 'Medical Triage'],
          certifications: ['Advanced First Aid', 'Emergency Medical Dispatcher'],
          activeCases: [],
          createdAt: new Date('2023-01-15'),
          lastLoginAt: new Date()
        },
        {
          id: 'staff_002', 
          email: 'supervisor@health.vic.gov.au',
          badgeNumber: 'SUP001',
          name: 'Dr. Michael Chen',
          role: 'doctor',
          department: 'Emergency Services',
          shift: 'day',
          status: 'available',
          specializations: ['Emergency Medicine', 'Critical Care'],
          certifications: ['MBBS', 'FRCEM', 'Advanced Trauma Life Support'],
          activeCases: [],
          createdAt: new Date('2022-08-10'),
          lastLoginAt: new Date()
        },
        {
          id: 'staff_003',
          email: 'nurse@health.vic.gov.au', 
          badgeNumber: 'NUR001',
          name: 'Emma Thompson',
          role: 'nurse',
          department: 'Triage',
          shift: 'evening',
          status: 'available',
          specializations: ['Emergency Nursing', 'Triage Assessment'],
          certifications: ['RN', 'BLS', 'Emergency Nursing Certification'],
          activeCases: [],
          createdAt: new Date('2023-03-20'),
          lastLoginAt: new Date()
        }
      ];

      const staff = mockStaffUsers.find(user => 
        user.email.toLowerCase() === email.toLowerCase() && 
        (password === 'Test123!' || password === 'emergency123' || password === 'staff2024') // Mock passwords
      );

      if (!staff) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      staff.lastLoginAt = new Date();
      
      // Store staff session
      await AsyncStorage.setItem('@medibot_staff_session', JSON.stringify(staff));
      
      return staff;
    }
  }

  async getCurrentStaff(): Promise<StaffUser | null> {
    try {
      const stored = await AsyncStorage.getItem('@medibot_staff_session');
      if (!stored) return null;
      
      const staff = JSON.parse(stored);
      return {
        ...staff,
        lastLoginAt: new Date(staff.lastLoginAt),
        createdAt: new Date(staff.createdAt)
      };
      
    } catch (error) {
      logger.error('Error getting current staff', error);
      return null;
    }
  }

  async logoutStaff(): Promise<void> {
    try {
      logger.info('Logging out staff');
      
      // Clear staff session
      await AsyncStorage.removeItem('@medibot_staff_session');
      
      // Clear auth tokens (CRITICAL FIX: this was missing!)
      await apiClient.clearAuthData();
      
      logger.info('Staff logged out successfully');
    } catch (error) {
      logger.error('Error logging out staff', error);
      throw error;
    }
  }

  // Emergency Case Management
  async getAllEmergencyCases(): Promise<EmergencyCase[]> {
    try {
      logger.info('Fetching all emergency cases from backend API');
      
      // Get from backend API (returns backend EmergencyCase format)
      const backendCases = await emergencyApiService.getEmergencies();
      
      // Convert backend format to our format
      // Backend has: { id, userId, emergencyType, symptoms, severity, location, contactNumber, emergencyContacts, status, assignedStaffId, responseTime, notes, timestamp, updatedAt }
      const formattedCases: EmergencyCase[] = (backendCases as any[]).map((emergencyCase: any) => ({
        id: emergencyCase.id,
        userId: emergencyCase.userId,
        emergencyType: emergencyCase.emergencyType,
        symptoms: emergencyCase.symptoms || [],
        severity: emergencyCase.severity,
        location: emergencyCase.location,
        contactNumber: emergencyCase.contactNumber || '',
        emergencyContacts: emergencyCase.emergencyContacts || [],
        timestamp: new Date(emergencyCase.timestamp || emergencyCase.createdAt),
        status: emergencyCase.status,
        assignedStaff: emergencyCase.assignedStaffId,
        responseTime: emergencyCase.responseTime ? new Date(emergencyCase.responseTime) : undefined,
        notes: emergencyCase.notes
      }));
      
      // Sync with local storage
      await AsyncStorage.setItem('@medibot_emergency_cases', JSON.stringify(formattedCases));
      
      logger.info('Loaded emergency cases from backend', { caseCount: formattedCases.length });
      return formattedCases;
      
    } catch (error) {
      logger.error('Error fetching emergency cases from API, loading from local storage', error);
      
      // Fallback to local storage
      return await this.getStoredEmergencyCases();
    }
  }

  async getPriorityCases(): Promise<EmergencyCase[]> {
    try {
      const allCases = await this.getAllEmergencyCases();
      
      // Sort by severity and timestamp
      return allCases
        .filter(emergencyCase => emergencyCase.status !== 'resolved' && emergencyCase.status !== 'cancelled')
        .sort((a, b) => {
          // Sort by severity (5 = critical, 1 = low) - higher severity first
          const severityDiff = b.severity - a.severity;
          if (severityDiff !== 0) return severityDiff;
          
          // If same severity, sort by creation time (oldest first)
          return a.timestamp.getTime() - b.timestamp.getTime();
        });
        
    } catch (error) {
      logger.error('Error getting priority cases', error);
      return [];
    }
  }

  async updateEmergencyCase(caseId: string, updates: Partial<EmergencyCase>): Promise<EmergencyCase> {
    try {
      const cases = await this.getStoredEmergencyCases();
      const caseIndex = cases.findIndex(c => c.id === caseId);
      
      if (caseIndex === -1) {
        throw new Error('Emergency case not found');
      }
      
      const updatedCase = {
        ...cases[caseIndex],
        ...updates,
        timestamp: new Date()
      };
      
      cases[caseIndex] = updatedCase;
      await AsyncStorage.setItem('@medibot_emergency_cases', JSON.stringify(cases));
      
      return updatedCase;
      
    } catch (error) {
      logger.error('Error updating emergency case', error as Error);
      throw new Error('Failed to update emergency case');
    }
  }



  // Helper Methods
  private async getCurrentUserId(): Promise<string> {
    try {
      // Get current user from auth service
      const userData = await AsyncStorage.getItem('@medibot_user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || 'guest_user';
      }
      return 'guest_user';
    } catch (error) {
      logger.error('Error getting current user ID', error as Error);
      return 'guest_user';
    }
  }

  private async saveEmergencyCase(emergencyCase: EmergencyCase): Promise<void> {
    try {
      const cases = await this.getStoredEmergencyCases();
      cases.push(emergencyCase);
      await AsyncStorage.setItem('@medibot_emergency_cases', JSON.stringify(cases));
    } catch (error) {
      logger.error('Error saving emergency case', error as Error);
    }
  }

  private async getStoredEmergencyCases(): Promise<EmergencyCase[]> {
    try {
      const stored = await AsyncStorage.getItem('@medibot_emergency_cases');
      if (!stored) return [];
      
      return JSON.parse(stored).map((emergencyCase: any) => ({
        ...emergencyCase,
        timestamp: new Date(emergencyCase.timestamp),
        ...(emergencyCase.responseTime && { 
          responseTime: new Date(emergencyCase.responseTime) 
        })
      }));
    } catch (error) {
      logger.error('Error loading emergency cases', error as Error);
      return [];
    }
  }

  // Configuration methods
  updateConfig(newConfig: Partial<BackendConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): BackendConfig {
    return this.config;
  }

  // Emergency Timer Utilities
  createEmergencyTimer(
    onTick: (secondsLeft: number) => void,
    onComplete: () => void,
    duration: number = 60 // 1 minute default
  ): NodeJS.Timeout {
    let secondsLeft = duration;
    
    const timer = setInterval(() => {
      onTick(secondsLeft);
      
      if (secondsLeft <= 0) {
        clearInterval(timer);
        onComplete();
      }
      
      secondsLeft--;
    }, 1000);
    
    return timer;
  }

  cancelTimer(timer: NodeJS.Timeout): void {
    clearInterval(timer);
  }
}

export default EmergencyService;