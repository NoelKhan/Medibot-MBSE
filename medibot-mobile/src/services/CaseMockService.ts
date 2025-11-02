/**
 * CASE MOCK SERVICE
 * =================
 * Comprehensive mock system for medical cases with priority levels,
 * patient interactions, and triage tracking.
 * 
 * Supports different views for:
 * - Medical Staff (doctors/nurses): See all cases
 * - Emergency Staff (EMT/operators): See only high-priority cases
 */

import { EmergencyCase } from '../types/Booking';
import { createLogger } from './Logger';

const logger = createLogger('CaseMockService');

export type CasePriority = 'critical' | 'high' | 'medium' | 'low';
export type PatientInteractionType = 'triage' | 'assessment' | 'consultation' | 'follow-up' | 'emergency';

export interface PatientInteraction {
  id: string;
  caseId: string;
  staffId: string;
  staffName: string;
  staffRole: 'doctor' | 'nurse' | 'emt' | 'operator';
  type: PatientInteractionType;
  timestamp: Date;
  notes: string;
  outcome?: string;
}

export interface MedicalCaseFull {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: 'male' | 'female' | 'other';
  contactNumber: string;
  emergencyType: string;
  symptoms: string[];
  priority: CasePriority;
  severity: 1 | 2 | 3 | 4 | 5;
  status: 'pending' | 'responded' | 'resolved' | 'cancelled';
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  interactions: PatientInteraction[];
  assignedStaff?: string[];
  triageNotes?: string;
  vitalSigns?: {
    heartRate?: number;
    bloodPressure?: string;
    temperature?: number;
    oxygenLevel?: number;
  };
  medications?: string[];
  allergies?: string[];
  estimatedWaitTime?: number; // in minutes
  lastUpdated: Date;
}

class CaseMockService {
  private static instance: CaseMockService;
  private cases: MedicalCaseFull[] = [];
  private interactions: PatientInteraction[] = [];

  private constructor() {
    this.initializeMockCases();
  }

  static getInstance(): CaseMockService {
    if (!CaseMockService.instance) {
      CaseMockService.instance = new CaseMockService();
    }
    return CaseMockService.instance;
  }

  /**
   * Initialize mock cases with realistic scenarios
   */
  private initializeMockCases(): void {
    const now = new Date();

    this.cases = [
      // CRITICAL - Emergency Staff Priority
      {
        id: 'case_001',
        patientName: 'Sarah Mitchell',
        patientAge: 42,
        patientGender: 'female' as const,
        contactNumber: '+61 412 345 678',
        emergencyType: 'Cardiac Emergency',
        symptoms: ['Severe chest pain', 'Shortness of breath', 'Radiating pain to left arm', 'Cold sweats'],
        priority: 'critical',
        severity: 5,
        status: 'pending',
        timestamp: new Date(now.getTime() - 5 * 60000), // 5 mins ago
        location: {
          latitude: -37.8136,
          longitude: 144.9631,
          address: '123 Collins St, Melbourne VIC 3000',
        },
        vitalSigns: {
          heartRate: 135,
          bloodPressure: '160/95',
          temperature: 37.8,
          oxygenLevel: 92,
        },
        medications: ['Aspirin (daily)', 'Metoprolol'],
        allergies: ['Penicillin'],
        estimatedWaitTime: 0,
        interactions: [],
        assignedStaff: ['staff_001', 'staff_002'],
        triageNotes: 'Immediate cardiac assessment required. Ambulance dispatched. ETA 3 minutes.',
        lastUpdated: now,
      },

      // CRITICAL - Emergency Staff Priority
      {
        id: 'case_002',
        patientName: 'Michael Thompson',
        patientAge: 68,
        patientGender: 'male' as const,
        contactNumber: '+61 423 987 654',
        emergencyType: 'Stroke Symptoms',
        symptoms: ['Sudden facial drooping', 'Slurred speech', 'Right arm weakness', 'Confusion'],
        priority: 'critical',
        severity: 5,
        status: 'responded',
        timestamp: new Date(now.getTime() - 12 * 60000), // 12 mins ago
        location: {
          latitude: -37.7833,
          longitude: 144.9667,
          address: '45 Royal Parade, Parkville VIC 3052',
        },
        vitalSigns: {
          heartRate: 88,
          bloodPressure: '180/110',
          temperature: 37.2,
          oxygenLevel: 96,
        },
        medications: ['Warfarin', 'Atorvastatin'],
        allergies: [],
        estimatedWaitTime: 0,
        interactions: [],
        assignedStaff: ['staff_003', 'staff_004'],
        triageNotes: 'Code Stroke activated. CT scan ordered. Thrombolysis team on standby.',
        lastUpdated: now,
      },

      // HIGH - Emergency Staff Priority
      {
        id: 'case_003',
        patientName: 'Emma Rodriguez',
        patientAge: 28,
        patientGender: 'female' as const,
        contactNumber: '+61 407 123 456',
        emergencyType: 'Severe Allergic Reaction',
        symptoms: ['Rapid swelling of face and throat', 'Difficulty breathing', 'Hives', 'Dizziness'],
        priority: 'high',
        severity: 4,
        status: 'responded',
        timestamp: new Date(now.getTime() - 20 * 60000), // 20 mins ago
        location: {
          latitude: -37.8200,
          longitude: 144.9750,
          address: '78 Victoria St, Carlton VIC 3053',
        },
        vitalSigns: {
          heartRate: 118,
          bloodPressure: '110/70',
          temperature: 37.5,
          oxygenLevel: 94,
        },
        medications: [],
        allergies: ['Shellfish', 'Latex'],
        estimatedWaitTime: 5,
        interactions: [],
        assignedStaff: ['staff_005'],
        triageNotes: 'EpiPen administered by patient. Antihistamines given. Monitor for anaphylaxis.',
        lastUpdated: now,
      },

      // HIGH - Emergency Staff Priority
      {
        id: 'case_004',
        patientName: 'David Zhang',
        patientAge: 55,
        patientGender: 'male' as const,
        contactNumber: '+61 432 567 890',
        emergencyType: 'Severe Trauma',
        symptoms: ['Industrial accident - laceration to forearm', 'Significant bleeding', 'Possible fracture'],
        priority: 'high',
        severity: 4,
        status: 'pending',
        timestamp: new Date(now.getTime() - 25 * 60000), // 25 mins ago
        location: {
          latitude: -37.8280,
          longitude: 144.9550,
          address: '234 Spencer St, Docklands VIC 3008',
        },
        vitalSigns: {
          heartRate: 102,
          bloodPressure: '125/82',
          temperature: 37.0,
          oxygenLevel: 98,
        },
        medications: [],
        allergies: [],
        estimatedWaitTime: 10,
        interactions: [],
        assignedStaff: ['staff_006'],
        triageNotes: 'Bleeding controlled. X-ray ordered. Tetanus booster required.',
        lastUpdated: now,
      },

      // MEDIUM - Medical Staff Only
      {
        id: 'case_005',
        patientName: 'Olivia Brown',
        patientAge: 34,
        patientGender: 'female' as const,
        contactNumber: '+61 408 234 567',
        emergencyType: 'Respiratory Infection',
        symptoms: ['Persistent cough', 'Fever 38.5°C', 'Chest congestion', 'Fatigue'],
        priority: 'medium',
        severity: 3,
        status: 'pending',
        timestamp: new Date(now.getTime() - 45 * 60000), // 45 mins ago
        location: {
          latitude: -37.8150,
          longitude: 144.9600,
          address: '56 Bourke St, Melbourne VIC 3000',
        },
        vitalSigns: {
          heartRate: 88,
          bloodPressure: '118/76',
          temperature: 38.5,
          oxygenLevel: 97,
        },
        medications: ['Paracetamol (recent)'],
        allergies: [],
        estimatedWaitTime: 30,
        interactions: [],
        triageNotes: 'COVID-19 test pending. Chest X-ray if symptoms worsen.',
        lastUpdated: now,
      },

      // MEDIUM - Medical Staff Only
      {
        id: 'case_006',
        patientName: 'James Wilson',
        patientAge: 45,
        patientGender: 'male' as const,
        contactNumber: '+61 419 876 543',
        emergencyType: 'Gastrointestinal Issue',
        symptoms: ['Severe abdominal pain', 'Nausea', 'Vomiting', 'Possible food poisoning'],
        priority: 'medium',
        severity: 3,
        status: 'responded',
        timestamp: new Date(now.getTime() - 60 * 60000), // 1 hour ago
        location: {
          latitude: -37.8100,
          longitude: 144.9700,
          address: '90 Flinders St, Melbourne VIC 3000',
        },
        vitalSigns: {
          heartRate: 92,
          bloodPressure: '122/80',
          temperature: 37.8,
          oxygenLevel: 99,
        },
        medications: [],
        allergies: [],
        estimatedWaitTime: 20,
        interactions: [],
        assignedStaff: ['staff_007'],
        triageNotes: 'IV fluids started. Blood tests ordered. Monitor for dehydration.',
        lastUpdated: now,
      },

      // LOW - Medical Staff Only
      {
        id: 'case_007',
        patientName: 'Sophia Nguyen',
        patientAge: 22,
        patientGender: 'female' as const,
        contactNumber: '+61 401 234 567',
        emergencyType: 'Minor Injury',
        symptoms: ['Sprained ankle from sports', 'Moderate swelling', 'Difficulty walking'],
        priority: 'low',
        severity: 2,
        status: 'pending',
        timestamp: new Date(now.getTime() - 90 * 60000), // 1.5 hours ago
        location: {
          latitude: -37.8050,
          longitude: 144.9650,
          address: '120 Swanston St, Melbourne VIC 3000',
        },
        vitalSigns: {
          heartRate: 75,
          bloodPressure: '115/72',
          temperature: 36.8,
          oxygenLevel: 99,
        },
        medications: [],
        allergies: [],
        estimatedWaitTime: 45,
        interactions: [],
        triageNotes: 'RICE protocol recommended. X-ray to rule out fracture.',
        lastUpdated: now,
      },

      // LOW - Medical Staff Only
      {
        id: 'case_008',
        patientName: 'Lucas Anderson',
        patientAge: 19,
        patientGender: 'male' as const,
        contactNumber: '+61 412 987 654',
        emergencyType: 'Skin Condition',
        symptoms: ['Severe rash on arms and torso', 'Itching', 'Red patches'],
        priority: 'low',
        severity: 1,
        status: 'pending',
        timestamp: new Date(now.getTime() - 120 * 60000), // 2 hours ago
        location: {
          latitude: -37.8180,
          longitude: 144.9620,
          address: '234 Lonsdale St, Melbourne VIC 3000',
        },
        vitalSigns: {
          heartRate: 72,
          bloodPressure: '118/74',
          temperature: 36.9,
          oxygenLevel: 99,
        },
        medications: [],
        allergies: [],
        estimatedWaitTime: 60,
        interactions: [],
        triageNotes: 'Possible contact dermatitis. Topical treatment may suffice.',
        lastUpdated: now,
      },
    ];

    logger.info('CaseMockService initialized', { caseCount: this.cases.length });
  }

    /**
   * Get all cases (for medical staff - doctors/nurses)
   * Medical staff see severity 1-4 (routine to urgent)
   */
  getAllCases(): MedicalCaseFull[] {
    return this.cases
      .filter(c => c.severity >= 1 && c.severity <= 4)
      .sort((a, b) => {
        // Sort by severity (highest first), then by timestamp (newest first)
        const severityDiff = b.severity - a.severity;
        if (severityDiff !== 0) return severityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
  }

  /**
   * Get high-priority cases only (for emergency staff - operators/paramedics)
   * Emergency staff see severity 4-5 (urgent and critical only)
   */
  getEmergencyCases(): MedicalCaseFull[] {
    return this.cases
      .filter(c => c.severity >= 4 && c.severity <= 5)
      .sort((a, b) => {
        // Sort by severity (highest first), then by timestamp (newest first)
        const severityDiff = b.severity - a.severity;
        if (severityDiff !== 0) return severityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
  }

  /**
   * Get cases by priority level
   */
  getCasesByPriority(priority: CasePriority): MedicalCaseFull[] {
    return this.cases.filter(c => c.priority === priority);
  }

  /**
   * Get case by ID
   */
  getCaseById(caseId: string): MedicalCaseFull | undefined {
    return this.cases.find(c => c.id === caseId);
  }

  /**
   * Add interaction to a case
   */
  addInteraction(
    caseId: string,
    staffId: string,
    staffName: string,
    staffRole: 'doctor' | 'nurse' | 'emt' | 'operator',
    type: PatientInteractionType,
    notes: string,
    outcome?: string
  ): PatientInteraction | null {
    const caseItem = this.cases.find(c => c.id === caseId);
    if (!caseItem) return null;

    const interaction: PatientInteraction = {
      id: `interaction_${Date.now()}`,
      caseId,
      staffId,
      staffName,
      staffRole,
      type,
      timestamp: new Date(),
      notes,
      outcome,
    };

    caseItem.interactions.push(interaction);
    caseItem.lastUpdated = new Date();
    this.interactions.push(interaction);

    return interaction;
  }

  /**
   * Update case status
   */
  updateCaseStatus(caseId: string, status: 'pending' | 'responded' | 'resolved' | 'cancelled'): boolean {
    const caseItem = this.cases.find(c => c.id === caseId);
    if (!caseItem) return false;

    caseItem.status = status;
    caseItem.lastUpdated = new Date();
    return true;
  }

  /**
   * Assign staff to case
   */
  assignStaff(caseId: string, staffId: string, staffName: string, staffRole: string): boolean {
    const caseItem = this.cases.find(c => c.id === caseId);
    if (!caseItem) return false;

    if (!caseItem.assignedStaff) {
      caseItem.assignedStaff = [];
    }

    // Check if staff already assigned
    if (caseItem.assignedStaff.find(s => s === staffId)) {
      return false;
    }

    caseItem.assignedStaff.push(staffId);
    caseItem.lastUpdated = new Date();
    return true;
  }

  /**
   * Get statistics for dashboard
   */
  getStatistics() {
    const total = this.cases.length;
    const critical = this.cases.filter(c => c.priority === 'critical').length;
    const high = this.cases.filter(c => c.priority === 'high').length;
    const medium = this.cases.filter(c => c.priority === 'medium').length;
    const low = this.cases.filter(c => c.priority === 'low').length;

    const pending = this.cases.filter(c => c.status === 'pending').length;
    const responded = this.cases.filter(c => c.status === 'responded').length;
    const resolved = this.cases.filter(c => c.status === 'resolved').length;

    return {
      total,
      byPriority: { critical, high, medium, low },
      byStatus: { pending, responded, resolved },
      emergencyCount: critical + high,
    };
  }

  /**
   * Simulate real-time updates (for demo purposes)
   */
  simulateUpdate(): void {
    // Randomly update a case status or add interaction
    if (this.cases.length === 0) return;

    const randomCase = this.cases[Math.floor(Math.random() * this.cases.length)];
    const statuses: Array<'pending' | 'responded' | 'resolved' | 'cancelled'> = ['pending', 'responded', 'resolved'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    this.updateCaseStatus(randomCase.id, randomStatus);
    logger.info('Simulated case status update', { caseId: randomCase.id, status: randomStatus });
  }
}

export default CaseMockService;
