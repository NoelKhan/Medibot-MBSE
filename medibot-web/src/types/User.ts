export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  PHARMACIST = 'pharmacist',
  EMT = 'emt',
  NURSE = 'nurse',
  ADMIN = 'admin',
  GUEST = 'guest'
}

export enum AuthStatus {
  AUTHENTICATED = 'authenticated',
  GUEST = 'guest',
  UNAUTHENTICATED = 'unauthenticated'
}

export interface UserProfile {
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  medicalHistory?: string[];
  allergies?: string[];
  medications?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  // Medical staff specific
  licenseNumber?: string;
  specialty?: string;
  hospitalAffiliation?: string;
}

export interface User {
  id: string;
  email?: string;
  name: string;
  role: UserRole;
  authStatus: AuthStatus;
  profile?: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}