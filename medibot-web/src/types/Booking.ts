export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  rating: number;
  experience: number;
  availability: AvailabilitySlot[];
  location: {
    address: string;
    city: string;
    postcode: string;
    state: string;
  };
  consultationFee: number;
  profileImage?: string;
  qualifications: string[];
  languages: string[];
}

export interface AvailabilitySlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  consultationType: 'in-person' | 'telehealth' | 'both';
}

export interface Appointment {
  id: string;
  userId: string;
  doctorId: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  consultationType: 'in-person' | 'telehealth';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
  emergencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingRequest {
  doctorId: string;
  preferredDate: Date;
  preferredTime: string;
  consultationType: 'in-person' | 'telehealth';
  reason: string;
  urgency: 'routine' | 'urgent';
  symptoms: string[];
  patientNotes?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  isPrimary: boolean;
}

export interface EmergencyCase {
  id: string;
  userId: string;
  emergencyType: string;
  symptoms: string[];
  severity: 1 | 2 | 3 | 4 | 5; // 1 = low, 5 = critical
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  contactNumber: string;
  emergencyContacts: EmergencyContact[];
  timestamp: Date;
  status: 'pending' | 'responded' | 'resolved' | 'cancelled';
  assignedStaff?: string;
  responseTime?: Date;
  notes?: string;
}

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: 'emergency_operator' | 'paramedic' | 'nurse' | 'doctor' | 'admin';
  badgeNumber: string;
  department: string;
  shift: 'day' | 'evening' | 'night' | 'on-call';
  status: 'available' | 'busy' | 'offline';
  specializations: string[];
  certifications: string[];
  activeCases: string[];
  createdAt: Date;
  lastLoginAt: Date;
}

// USER PROFILE AND CASE MANAGEMENT TYPES

export interface MedicalHistory {
  id: string;
  condition: string;
  diagnosedDate: Date;
  status: 'active' | 'resolved' | 'managed';
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
  treatingDoctor?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  purpose: string;
  sideEffects?: string[];
  instructions?: string;
  status: 'active' | 'discontinued' | 'completed';
}

export interface Allergy {
  id: string;
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  reactions: string[];
  firstOccurrence?: Date;
  treatment?: string;
  notes?: string;
  verified: boolean;
}

export interface MedicalCase {
  id: string;
  userId: string;
  ticketNumber: string;
  title: string;
  description: string;
  symptoms: string[];
  severity: 1 | 2 | 3 | 4 | 5; // 1 = low, 5 = critical
  status: 'open' | 'in-progress' | 'waiting-patient' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'general' | 'emergency' | 'follow-up' | 'prescription' | 'consultation';
  assignedStaff?: string;
  assignedDoctor?: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
  estimatedResolution?: Date;
  notes: CaseNote[];
  attachments?: CaseAttachment[];
  triageScore?: number;
  followUpRequired: boolean;
  relatedCases?: string[];
}

export interface CaseNote {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'user' | 'staff' | 'doctor' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  isPrivate: boolean; // Staff/doctor only notes
  type: 'update' | 'assessment' | 'treatment' | 'follow-up' | 'system';
}

export interface CaseAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  category: 'image' | 'document' | 'lab-result' | 'prescription' | 'other';
  description?: string;
}

export interface PatientUser {
  id: string;
  userType: 'registered' | 'guest';
  
  // Basic Information
  email?: string; // Optional for guest users
  phone?: string;
  name: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  
  // Contact Information
  address?: {
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  
  // Emergency Contacts
  emergencyContacts: EmergencyContact[];
  
  // Medical Information
  medicalHistory: MedicalHistory[];
  currentMedications: Medication[];
  allergies: Allergy[];
  
  // Healthcare Providers
  primaryDoctor?: {
    name: string;
    phone: string;
    specialty: string;
    hospital: string;
  };
  
  // Insurance Information (optional)
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    expiryDate?: Date;
  };
  
  // Case Management
  activeCases: string[];
  caseHistory: string[];
  totalCases: number;
  
  // System Information
  createdAt: Date;
  lastLoginAt?: Date;
  lastActivity: Date;
  accountStatus: 'active' | 'inactive' | 'suspended' | 'guest';
  
  // Preferences
  preferences: {
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    privacySettings: {
      shareWithStaff: boolean;
      shareWithDoctors: boolean;
      dataRetention: '1-year' | '5-years' | 'indefinite';
    };
  };
  
  // Verification Status
  verification: {
    emailVerified: boolean;
    phoneVerified: boolean;
    identityVerified: boolean;
  };
}

export interface TriageAssessment {
  caseId: string;
  assessedBy: string;
  assessedAt: Date;
  triageLevel: 1 | 2 | 3 | 4 | 5; // ESI Scale: 1=Immediate, 5=Non-urgent
  reasoningScore: {
    symptomsScore: number;
    vitalSignsScore: number;
    painLevel: number;
    mobilityScore: number;
    mentalStateScore: number;
  };
  recommendedAction: 'immediate-care' | 'urgent-care' | 'standard-care' | 'advice-only' | 'self-care';
  estimatedWaitTime: number; // in minutes
  specialtyRequired?: string;
  notes?: string;
}

// API Integration Types for real-world systems
export interface BookingAPI {
  searchDoctors: (specialty?: string, location?: string, date?: Date) => Promise<Doctor[]>;
  getDoctorAvailability: (doctorId: string, date: Date) => Promise<AvailabilitySlot[]>;
  createAppointment: (request: BookingRequest) => Promise<{ appointmentId: string; confirmationCode: string }>;
  cancelAppointment: (appointmentId: string, reason: string) => Promise<boolean>;
  getAppointments: (userId: string) => Promise<Appointment[]>;
}

export interface EmergencyAPI {
  initiateEmergencyCall: (emergencyCase: Partial<EmergencyCase>) => Promise<{ caseId: string; estimatedResponse: string }>;
  cancelEmergencyCall: (caseId: string, reason: string) => Promise<boolean>;
  updateCaseStatus: (caseId: string, status: EmergencyCase['status'], notes?: string) => Promise<boolean>;
  getActiveCases: () => Promise<EmergencyCase[]>;
  assignStaff: (caseId: string, staffId: string) => Promise<boolean>;
}

// Backend Integration Interfaces (easily modifiable)
export interface BackendConfig {
  baseURL: string;
  apiKey: string;
  endpoints: {
    doctors: string;
    appointments: string;
    emergency: string;
    staff: string;
  };
  timeout: number;
  retryAttempts: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}