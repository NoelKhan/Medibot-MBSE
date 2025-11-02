/**
 * Shared Type Definitions
 * ========================
 * Common types used across mobile and web applications
 */

// Chat & Conversation Types
export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai' | 'staff';
  content: string;
  messageType: 'text' | 'image' | 'audio';
  metadata?: any;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  status: 'active' | 'archived' | 'closed';
  lastMessageAt: Date | null;
  messages?: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageRequest {
  conversationId?: string;
  content: string;
  messageType?: 'text' | 'image' | 'audio';
  metadata?: any;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
}

export interface SymptomAnalysis {
  symptoms: string[];
  severity: 'low' | 'moderate' | 'high' | 'emergency';
  bodyParts: string[];
  duration: string | null;
  triggers: string[];
  recommendations: string[];
  redFlags: string[];
  possibleConditions: string[];
  urgencyLevel: string;
  requiresImmediateAttention: boolean;
}

// Doctor Types
export interface DoctorProfile {
  id: string;
  fullName: string;
  specialty: string;
  bio: string | null;
  yearsOfExperience: number;
  education: string | null;
  certifications: string | null;
  languages: string[];
  status: 'active' | 'inactive' | 'on_leave';
  rating: number;
  totalReviews: number;
  consultationFee: number;
  consultationDuration: number;
  profileImageUrl: string | null;
  hospitalAffiliation: string | null;
  officeAddress: string | null;
  phoneNumber: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface DaySlots {
  date: string;
  slots: TimeSlot[];
}

export interface SearchDoctorsParams {
  specialty?: string;
  name?: string;
  minRating?: number;
  maxFee?: number;
  languages?: string[];
  page?: number;
  limit?: number;
}

export interface SearchDoctorsResponse {
  doctors: DoctorProfile[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DoctorSpecialty {
  id: string;
  name: string;
  description: string | null;
  iconName: string | null;
  doctorCount: number;
}

// Appointment Types
export interface Appointment {
  id: string;
  userId: string;
  doctorId: string;
  scheduledAt: Date;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  type: 'in_person' | 'video' | 'phone';
  reason: string | null;
  notes: string | null;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
  doctor?: DoctorProfile;
}

export interface CreateAppointmentRequest {
  doctorId: string;
  scheduledAt: string;
  type: 'in_person' | 'video' | 'phone';
  reason?: string;
  notes?: string;
}

// Medical Case Types
export interface MedicalCase {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string | null;
  symptoms: string[];
  diagnosis: string | null;
  treatment: string | null;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCaseRequest {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  symptoms?: string[];
}

export interface CaseFollowup {
  id: string;
  caseId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
}

// User & Auth Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor' | 'admin' | 'staff';
  phoneNumber?: string;
  dateOfBirth?: Date;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Reminder Types
export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  reminderTime: Date;
  type: 'medication' | 'appointment' | 'checkup' | 'other';
  isRecurring: boolean;
  recurringPattern: string | null;
  status: 'active' | 'completed' | 'cancelled';
  notificationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReminderRequest {
  title: string;
  description?: string;
  reminderTime: string;
  type: 'medication' | 'appointment' | 'checkup' | 'other';
  isRecurring?: boolean;
  recurringPattern?: string;
}

// API Response Types
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
