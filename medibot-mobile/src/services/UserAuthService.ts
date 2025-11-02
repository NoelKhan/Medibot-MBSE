/**
 * USER AUTHENTICATION & PROFILE MANAGEMENT SERVICE
 * 
 * This service provides comprehensive user management including:
 * - User registration and authentication
 * - Guest user handling
 * - Medical profile management
 * - Case tracking and management
 * - Triaging support
 * 
 * Similar architecture to StaffAuthService for consistency
 */

import { PatientUser, MedicalCase, CaseNote, TriageAssessment, MedicalHistory, Medication, Allergy } from '../types/Booking';
import { createLogger } from './Logger';

const logger = createLogger('UserAuthService');

export class UserAuthService {
  private static instance: UserAuthService;
  private currentUser: PatientUser | null = null;
  private users: Map<string, PatientUser> = new Map();
  private cases: Map<string, MedicalCase> = new Map();
  private triageAssessments: Map<string, TriageAssessment> = new Map();

  private constructor() {
    this.initializeDefaultUsers();
  }

  public static getInstance(): UserAuthService {
    if (!UserAuthService.instance) {
      UserAuthService.instance = new UserAuthService();
    }
    return UserAuthService.instance;
  }

  /**
   * USER AUTHENTICATION METHODS
   */

  public async authenticateUser(email: string, password: string): Promise<PatientUser> {
    logger.info('Authenticating user', { email });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find user by email
    for (const user of this.users.values()) {
      if (user.email?.toLowerCase() === email.toLowerCase()) {
        // Update last login
        user.lastLoginAt = new Date();
        user.lastActivity = new Date();
        
        this.currentUser = user;
        logger.info('User authenticated successfully', { userId: user.id, userName: user.name });
        return user;
      }
    }

    throw new Error('Invalid email or password');
  }

  public async createGuestUser(name: string, phone?: string): Promise<PatientUser> {
    logger.info('Creating guest user', { name, hasPhone: !!phone });

    const guestUser: PatientUser = {
      id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userType: 'guest',
      name: name.trim(),
      phone: phone,
      emergencyContacts: [],
      medicalHistory: [],
      currentMedications: [],
      allergies: [],
      activeCases: [],
      caseHistory: [],
      totalCases: 0,
      createdAt: new Date(),
      lastActivity: new Date(),
      accountStatus: 'guest',
      preferences: {
        language: 'en',
        notifications: {
          email: false,
          sms: !!phone,
          push: true,
        },
        privacySettings: {
          shareWithStaff: true,
          shareWithDoctors: true,
          dataRetention: '1-year',
        }
      },
      verification: {
        emailVerified: false,
        phoneVerified: false,
        identityVerified: false,
      }
    };

    this.users.set(guestUser.id, guestUser);
    this.currentUser = guestUser;
    
    logger.info('Guest user created', { guestUserId: guestUser.id });
    return guestUser;
  }

  public async registerUser(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  }): Promise<PatientUser> {
    logger.info('Registering new user', { email: userData.email });

    // Check if email already exists
    for (const user of this.users.values()) {
      if (user.email?.toLowerCase() === userData.email.toLowerCase()) {
        throw new Error('Email already registered');
      }
    }

    const newUser: PatientUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userType: 'registered',
      email: userData.email,
      phone: userData.phone,
      name: userData.name,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      emergencyContacts: [],
      medicalHistory: [],
      currentMedications: [],
      allergies: [],
      activeCases: [],
      caseHistory: [],
      totalCases: 0,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      lastActivity: new Date(),
      accountStatus: 'active',
      preferences: {
        language: 'en',
        notifications: {
          email: true,
          sms: !!userData.phone,
          push: true,
        },
        privacySettings: {
          shareWithStaff: true,
          shareWithDoctors: true,
          dataRetention: '5-years',
        }
      },
      verification: {
        emailVerified: false,
        phoneVerified: false,
        identityVerified: false,
      }
    };

    this.users.set(newUser.id, newUser);
    this.currentUser = newUser;
    
    logger.info('User registered successfully', { userId: newUser.id, email: userData.email });
    return newUser;
  }

  public getCurrentUser(): PatientUser | null {
    return this.currentUser;
  }

  public logout(): void {
    this.currentUser = null;
    logger.info('User logged out');
  }

  /**
   * CASE MANAGEMENT METHODS
   */

  public async createCase(
    userId: string,
    caseData: {
      title: string;
      description: string;
      symptoms: string[];
      severity: 1 | 2 | 3 | 4 | 5;
      category: 'general' | 'emergency' | 'follow-up' | 'prescription' | 'consultation';
    }
  ): Promise<MedicalCase> {
    const ticketNumber = `CASE-${Date.now().toString().slice(-6)}`;
    
    const newCase: MedicalCase = {
      id: `case-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ticketNumber,
      title: caseData.title,
      description: caseData.description,
      symptoms: caseData.symptoms,
      severity: caseData.severity,
      status: 'open',
      priority: this.calculatePriority(caseData.severity, caseData.symptoms),
      category: caseData.category,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date(),
      notes: [{
        id: `note-${Date.now()}`,
        authorId: userId,
        authorName: this.getUserName(userId),
        authorRole: 'user',
        content: `Case created: ${caseData.description}`,
        timestamp: new Date(),
        isPrivate: false,
        type: 'update'
      }],
      followUpRequired: caseData.severity >= 3,
      relatedCases: []
    };

    // Calculate initial triage score
    newCase.triageScore = this.calculateTriageScore(newCase);

    this.cases.set(newCase.id, newCase);

    // Update user's case list
    const user = this.users.get(userId);
    if (user) {
      user.activeCases.push(newCase.id);
      user.totalCases++;
      user.lastActivity = new Date();
    }

    logger.info('Medical case created', { caseId: newCase.id, ticketNumber: newCase.ticketNumber, userId });
    return newCase;
  }

  public async updateCaseStatus(
    caseId: string,
    status: MedicalCase['status'],
    note?: string,
    staffId?: string
  ): Promise<MedicalCase> {
    const medicalCase = this.cases.get(caseId);
    if (!medicalCase) {
      throw new Error('Case not found');
    }

    const previousStatus = medicalCase.status;
    medicalCase.status = status;
    medicalCase.updatedAt = new Date();
    medicalCase.lastActivity = new Date();

    // Add status update note
    if (note || status !== previousStatus) {
      const updateNote: CaseNote = {
        id: `note-${Date.now()}`,
        authorId: staffId || 'system',
        authorName: staffId ? 'Staff Member' : 'System',
        authorRole: staffId ? 'staff' : 'system',
        content: note || `Status changed from ${previousStatus} to ${status}`,
        timestamp: new Date(),
        isPrivate: false,
        type: 'update'
      };
      
      medicalCase.notes.push(updateNote);
    }

    // Update user's active cases if resolved/closed
    if (status === 'resolved' || status === 'closed') {
      const user = this.users.get(medicalCase.userId);
      if (user) {
        user.activeCases = user.activeCases.filter(id => id !== caseId);
        user.caseHistory.push(caseId);
      }
    }

    logger.info('Case status updated', { caseId, ticketNumber: medicalCase.ticketNumber, status });
    return medicalCase;
  }

  public getUserCases(userId: string, includeHistory: boolean = false): MedicalCase[] {
    const userCases: MedicalCase[] = [];
    
    for (const medicalCase of this.cases.values()) {
      if (medicalCase.userId === userId) {
        if (includeHistory || medicalCase.status === 'open' || medicalCase.status === 'in-progress') {
          userCases.push(medicalCase);
        }
      }
    }

    return userCases.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async addCaseNote(
    caseId: string,
    authorId: string,
    content: string,
    isPrivate: boolean = false,
    type: CaseNote['type'] = 'update'
  ): Promise<void> {
    const medicalCase = this.cases.get(caseId);
    if (!medicalCase) {
      throw new Error('Case not found');
    }

    const note: CaseNote = {
      id: `note-${Date.now()}`,
      authorId,
      authorName: this.getUserName(authorId),
      authorRole: this.getUserRole(authorId),
      content,
      timestamp: new Date(),
      isPrivate,
      type
    };

    medicalCase.notes.push(note);
    medicalCase.lastActivity = new Date();
    medicalCase.updatedAt = new Date();
    
    logger.info('Note added to case', { caseId, ticketNumber: medicalCase.ticketNumber, authorId });
  }

  /**
   * TRIAGING METHODS
   */

  public async performTriage(caseId: string, assessorId: string): Promise<TriageAssessment> {
    const medicalCase = this.cases.get(caseId);
    if (!medicalCase) {
      throw new Error('Case not found');
    }

    const assessment: TriageAssessment = {
      caseId,
      assessedBy: assessorId,
      assessedAt: new Date(),
      triageLevel: this.calculateTriageLevel(medicalCase),
      reasoningScore: {
        symptomsScore: this.calculateSymptomsScore(medicalCase.symptoms),
        vitalSignsScore: 3, // Default - would be collected separately
        painLevel: medicalCase.severity,
        mobilityScore: 3, // Default - would be assessed
        mentalStateScore: 3, // Default - would be assessed
      },
      recommendedAction: this.getRecommendedAction(medicalCase),
      estimatedWaitTime: this.calculateWaitTime(medicalCase),
      notes: `Auto-generated triage for case ${medicalCase.ticketNumber}`
    };

    this.triageAssessments.set(caseId, assessment);
    
    // Update case with triage info
    medicalCase.triageScore = assessment.triageLevel;
    
    logger.info('Triage assessment completed', { caseId, triageLevel: assessment.triageLevel });
    return assessment;
  }

  /**
   * MEDICAL PROFILE MANAGEMENT
   */

  public async updateMedicalHistory(userId: string, history: MedicalHistory[]): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.medicalHistory = history;
    user.lastActivity = new Date();
    logger.info('Medical history updated for user', { userId });
  }

  public async updateMedications(userId: string, medications: Medication[]): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.currentMedications = medications;
    user.lastActivity = new Date();
    logger.info('Medications updated for user', { userId, medicationCount: medications.length });
  }

  public async updateAllergies(userId: string, allergies: Allergy[]): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.allergies = allergies;
    user.lastActivity = new Date();
    logger.info('Allergies updated for user', { userId, allergyCount: allergies.length });
  }

  /**
   * HELPER METHODS
   */

  private calculatePriority(severity: number, symptoms: string[]): 'low' | 'medium' | 'high' | 'critical' {
    if (severity >= 4) return 'critical';
    if (severity >= 3) return 'high';
    
    const urgentSymptoms = ['chest pain', 'difficulty breathing', 'severe bleeding', 'loss of consciousness'];
    const hasUrgentSymptoms = symptoms.some(symptom => 
      urgentSymptoms.some(urgent => symptom.toLowerCase().includes(urgent))
    );
    
    if (hasUrgentSymptoms) return 'high';
    if (severity >= 2) return 'medium';
    return 'low';
  }

  private calculateTriageScore(medicalCase: MedicalCase): number {
    let score = medicalCase.severity * 2;
    
    // Add points for urgent symptoms
    const urgentSymptoms = ['chest pain', 'difficulty breathing', 'severe bleeding'];
    medicalCase.symptoms.forEach(symptom => {
      if (urgentSymptoms.some(urgent => symptom.toLowerCase().includes(urgent))) {
        score += 3;
      }
    });
    
    return Math.min(score, 10);
  }

  private calculateTriageLevel(medicalCase: MedicalCase): 1 | 2 | 3 | 4 | 5 {
    const score = this.calculateTriageScore(medicalCase);
    
    if (score >= 9) return 1; // Immediate
    if (score >= 7) return 2; // Emergent
    if (score >= 5) return 3; // Urgent
    if (score >= 3) return 4; // Less urgent
    return 5; // Non-urgent
  }

  private calculateSymptomsScore(symptoms: string[]): number {
    const criticalSymptoms = ['chest pain', 'difficulty breathing', 'severe bleeding', 'loss of consciousness'];
    const moderateSymptoms = ['fever', 'pain', 'nausea', 'dizziness'];
    
    let score = 0;
    symptoms.forEach(symptom => {
      const lowerSymptom = symptom.toLowerCase();
      if (criticalSymptoms.some(critical => lowerSymptom.includes(critical))) {
        score += 3;
      } else if (moderateSymptoms.some(moderate => lowerSymptom.includes(moderate))) {
        score += 2;
      } else {
        score += 1;
      }
    });
    
    return Math.min(score, 5);
  }

  private getRecommendedAction(medicalCase: MedicalCase): TriageAssessment['recommendedAction'] {
    const triageLevel = this.calculateTriageLevel(medicalCase);
    
    switch (triageLevel) {
      case 1: return 'immediate-care';
      case 2: return 'urgent-care';
      case 3: return 'standard-care';
      case 4: return 'advice-only';
      case 5: return 'self-care';
    }
  }

  private calculateWaitTime(medicalCase: MedicalCase): number {
    const triageLevel = this.calculateTriageLevel(medicalCase);
    
    switch (triageLevel) {
      case 1: return 0; // Immediate
      case 2: return 15; // 15 minutes
      case 3: return 60; // 1 hour
      case 4: return 120; // 2 hours
      case 5: return 240; // 4 hours
    }
  }

  private getUserName(userId: string): string {
    const user = this.users.get(userId);
    return user?.name || 'Unknown User';
  }

  private getUserRole(userId: string): CaseNote['authorRole'] {
    if (userId === 'system') return 'system';
    if (userId.startsWith('staff-')) return 'staff';
    if (userId.startsWith('doctor-')) return 'doctor';
    return 'user';
  }

  /**
   * INITIALIZE DEFAULT USERS WITH DIVERSE MEDICAL PROFILES
   */
  private initializeDefaultUsers(): void {
    logger.info('Initializing default user profiles');
    
    // Sample User 1: Young adult with asthma and allergies
    const user1: PatientUser = {
      id: 'user-sample-001',
      userType: 'registered',
      email: 'sarah.johnson@example.com',
      phone: '+1234567890',
      name: 'Sarah Johnson',
      dateOfBirth: new Date('1995-06-15'),
      gender: 'female',
      address: {
        street: '123 Oak Street',
        city: 'Austin',
        state: 'TX',
        postcode: '78701',
        country: 'USA'
      },
      emergencyContacts: [
        {
          id: 'ec-001',
          name: 'Mike Johnson',
          relationship: 'Father',
          phoneNumber: '+1234567891',
          isPrimary: true
        }
      ],
      medicalHistory: [
        {
          id: 'mh-001',
          condition: 'Asthma',
          diagnosedDate: new Date('2010-03-20'),
          status: 'managed',
          severity: 'moderate',
          notes: 'Exercise-induced asthma, well controlled with medication',
          treatingDoctor: 'Dr. Smith'
        },
        {
          id: 'mh-002',
          condition: 'Seasonal Allergies',
          diagnosedDate: new Date('2008-05-10'),
          status: 'active',
          severity: 'mild',
          notes: 'Spring and fall allergies, responds well to antihistamines'
        }
      ],
      currentMedications: [
        {
          id: 'med-001',
          name: 'Albuterol Inhaler',
          dosage: '90mcg',
          frequency: 'As needed',
          startDate: new Date('2020-01-15'),
          prescribedBy: 'Dr. Smith',
          purpose: 'Asthma rescue medication',
          instructions: 'Use before exercise or when experiencing symptoms',
          status: 'active'
        },
        {
          id: 'med-002',
          name: 'Cetirizine',
          dosage: '10mg',
          frequency: 'Once daily during allergy season',
          startDate: new Date('2023-03-01'),
          prescribedBy: 'Dr. Smith',
          purpose: 'Seasonal allergy management',
          status: 'active'
        }
      ],
      allergies: [
        {
          id: 'allergy-001',
          allergen: 'Peanuts',
          severity: 'severe',
          reactions: ['Hives', 'Swelling', 'Difficulty breathing'],
          firstOccurrence: new Date('2005-08-12'),
          treatment: 'EpiPen prescribed',
          verified: true
        },
        {
          id: 'allergy-002',
          allergen: 'Penicillin',
          severity: 'moderate',
          reactions: ['Rash', 'Nausea'],
          firstOccurrence: new Date('2015-12-03'),
          verified: true
        }
      ],
      activeCases: [],
      caseHistory: [],
      totalCases: 0,
      createdAt: new Date('2023-01-15'),
      lastLoginAt: new Date(),
      lastActivity: new Date(),
      accountStatus: 'active',
      preferences: {
        language: 'en',
        notifications: { email: true, sms: true, push: true },
        privacySettings: { shareWithStaff: true, shareWithDoctors: true, dataRetention: '5-years' }
      },
      verification: { emailVerified: true, phoneVerified: true, identityVerified: true }
    };

    // Sample User 2: Middle-aged man with diabetes and hypertension
    const user2: PatientUser = {
      id: 'user-sample-002',
      userType: 'registered',
      email: 'robert.chen@example.com',
      phone: '+1234567892',
      name: 'Robert Chen',
      dateOfBirth: new Date('1975-11-22'),
      gender: 'male',
      address: {
        street: '456 Pine Avenue',
        city: 'San Francisco',
        state: 'CA',
        postcode: '94105',
        country: 'USA'
      },
      emergencyContacts: [
        {
          id: 'ec-002',
          name: 'Lisa Chen',
          relationship: 'Wife',
          phoneNumber: '+1234567893',
          isPrimary: true
        }
      ],
      medicalHistory: [
        {
          id: 'mh-003',
          condition: 'Type 2 Diabetes',
          diagnosedDate: new Date('2018-07-10'),
          status: 'managed',
          severity: 'moderate',
          notes: 'Well controlled with medication and diet',
          treatingDoctor: 'Dr. Patel'
        },
        {
          id: 'mh-004',
          condition: 'Hypertension',
          diagnosedDate: new Date('2020-02-14'),
          status: 'managed',
          severity: 'mild',
          notes: 'Controlled with ACE inhibitor'
        }
      ],
      currentMedications: [
        {
          id: 'med-003',
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily with meals',
          startDate: new Date('2018-07-15'),
          prescribedBy: 'Dr. Patel',
          purpose: 'Type 2 Diabetes management',
          status: 'active'
        },
        {
          id: 'med-004',
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          startDate: new Date('2020-02-20'),
          prescribedBy: 'Dr. Patel',
          purpose: 'Blood pressure control',
          status: 'active'
        }
      ],
      allergies: [
        {
          id: 'allergy-003',
          allergen: 'Shellfish',
          severity: 'moderate',
          reactions: ['Hives', 'Nausea', 'Stomach pain'],
          firstOccurrence: new Date('2010-06-18'),
          verified: true
        }
      ],
      activeCases: [],
      caseHistory: [],
      totalCases: 0,
      createdAt: new Date('2023-02-20'),
      lastLoginAt: new Date(),
      lastActivity: new Date(),
      accountStatus: 'active',
      preferences: {
        language: 'en',
        notifications: { email: true, sms: false, push: true },
        privacySettings: { shareWithStaff: true, shareWithDoctors: true, dataRetention: '5-years' }
      },
      verification: { emailVerified: true, phoneVerified: true, identityVerified: true }
    };

    // Sample User 3: Elderly woman with multiple conditions
    const user3: PatientUser = {
      id: 'user-sample-003',
      userType: 'registered',
      email: 'margaret.williams@example.com',
      phone: '+1234567894',
      name: 'Margaret Williams',
      dateOfBirth: new Date('1945-04-08'),
      gender: 'female',
      address: {
        street: '789 Maple Drive',
        city: 'Miami',
        state: 'FL',
        postcode: '33101',
        country: 'USA'
      },
      emergencyContacts: [
        {
          id: 'ec-003',
          name: 'Jennifer Williams',
          relationship: 'Daughter',
          phoneNumber: '+1234567895',
          isPrimary: true
        }
      ],
      medicalHistory: [
        {
          id: 'mh-005',
          condition: 'Osteoarthritis',
          diagnosedDate: new Date('2015-09-12'),
          status: 'managed',
          severity: 'moderate',
          notes: 'Knee and hip joints affected, managing with medication and physical therapy'
        },
        {
          id: 'mh-006',
          condition: 'Atrial Fibrillation',
          diagnosedDate: new Date('2019-11-05'),
          status: 'managed',
          severity: 'moderate',
          notes: 'On anticoagulation therapy, regular monitoring required'
        },
        {
          id: 'mh-007',
          condition: 'Osteoporosis',
          diagnosedDate: new Date('2020-08-30'),
          status: 'managed',
          severity: 'moderate',
          notes: 'Taking calcium and vitamin D supplements'
        }
      ],
      currentMedications: [
        {
          id: 'med-005',
          name: 'Warfarin',
          dosage: '5mg',
          frequency: 'Once daily',
          startDate: new Date('2019-11-10'),
          prescribedBy: 'Dr. Rodriguez',
          purpose: 'Anticoagulation for atrial fibrillation',
          status: 'active'
        },
        {
          id: 'med-006',
          name: 'Ibuprofen',
          dosage: '400mg',
          frequency: 'As needed for pain',
          startDate: new Date('2015-09-15'),
          prescribedBy: 'Dr. Rodriguez',
          purpose: 'Arthritis pain management',
          status: 'active'
        },
        {
          id: 'med-007',
          name: 'Calcium + Vitamin D',
          dosage: '600mg + 400IU',
          frequency: 'Twice daily',
          startDate: new Date('2020-09-01'),
          prescribedBy: 'Dr. Rodriguez',
          purpose: 'Bone health support',
          status: 'active'
        }
      ],
      allergies: [
        {
          id: 'allergy-004',
          allergen: 'Aspirin',
          severity: 'moderate',
          reactions: ['Stomach irritation', 'Bleeding risk'],
          firstOccurrence: new Date('1995-03-22'),
          verified: true
        }
      ],
      activeCases: [],
      caseHistory: [],
      totalCases: 0,
      createdAt: new Date('2023-03-10'),
      lastLoginAt: new Date(),
      lastActivity: new Date(),
      accountStatus: 'active',
      preferences: {
        language: 'en',
        notifications: { email: true, sms: true, push: false },
        privacySettings: { shareWithStaff: true, shareWithDoctors: true, dataRetention: 'indefinite' }
      },
      verification: { emailVerified: true, phoneVerified: true, identityVerified: true }
    };

    // Add all sample users
    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);
    this.users.set(user3.id, user3);

    logger.info('Default user profiles initialized successfully', { userCount: this.users.size });
  }

  /**
   * DEBUGGING AND ADMIN METHODS
   */
  public getAllUsers(): PatientUser[] {
    return Array.from(this.users.values());
  }

  public getAllCases(): MedicalCase[] {
    return Array.from(this.cases.values());
  }

  public getCaseById(caseId: string): MedicalCase | undefined {
    return this.cases.get(caseId);
  }

  public getUserById(userId: string): PatientUser | undefined {
    return this.users.get(userId);
  }
}

export default UserAuthService;