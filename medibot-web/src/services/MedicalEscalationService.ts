/**
 * Medical Escalation Service
 * Handles different escalation scenarios with color-coded severity levels
 */

import { createLogger } from './Logger';

const logger = createLogger('MedicalEscalationService');

export enum EscalationType {
  EMERGENCY = 'emergency',
  HIGH_SEVERITY = 'high_severity', 
  RECOMMENDATION = 'recommendation',
  SELF_CARE = 'self_care',
  INFO = 'info'
}

export interface EscalationAction {
  id: string;
  type: EscalationType;
  title: string;
  description: string;
  icon: string;
  color: string;
  backgroundColor: string;
  urgency: number; // 1-5 (5 being most urgent)
  action: () => void;
  requiresAuth?: boolean;
  phoneNumber?: string;
  estimatedTime?: string;
}

export interface EscalationScenario {
  triggers: string[];
  actions: EscalationAction[];
  message: string;
  priority: number;
}

export class MedicalEscalationService {
  private static instance: MedicalEscalationService;
  
  public static getInstance(): MedicalEscalationService {
    if (!MedicalEscalationService.instance) {
      MedicalEscalationService.instance = new MedicalEscalationService();
    }
    return MedicalEscalationService.instance;
  }

  // Emergency keywords that trigger immediate escalation
  private emergencyTriggers = [
    'chest pain', 'heart attack', 'stroke', 'difficulty breathing', 
    'severe bleeding', 'unconscious', 'suicide', 'overdose',
    'severe allergic reaction', 'anaphylaxis', 'can\'t breathe',
    'severe head injury', 'poisoning', 'emergency', 'urgent help',
    'dying', 'critical', 'severe pain', 'blood loss'
  ];

  // High severity keywords
  private highSeverityTriggers = [
    'fever over 39', 'severe headache', 'persistent vomiting',
    'severe abdominal pain', 'vision problems', 'hearing loss',
    'severe dizziness', 'fainting', 'irregular heartbeat',
    'severe rash', 'difficulty swallowing', 'severe cough'
  ];

  // Medicine/pharmacy recommendation triggers
  private medicineRecommendationTriggers = [
    'medication', 'prescription', 'pharmacy', 'dosage', 'drug interaction',
    'side effects', 'over the counter', 'otc', 'pain relief',
    'antibiotic', 'vitamin', 'supplement', 'allergy medicine'
  ];

  // Self-care triggers
  private selfCareTriggers = [
    'mild headache', 'common cold', 'minor cut', 'bruise',
    'dry skin', 'mild rash', 'insomnia', 'stress', 'exercise',
    'nutrition', 'wellness', 'prevention', 'healthy habits'
  ];

  // Doctor booking triggers
  private doctorBookingTriggers = [
    'appointment', 'see doctor', 'checkup', 'consultation',
    'specialist', 'follow up', 'test results', 'diagnosis',
    'chronic condition', 'ongoing symptoms', 'regular visit'
  ];

  /**
   * Analyzes user input and determines appropriate escalation actions
   */
  public analyzeInput(message: string, navigation: any): EscalationAction[] {
    const lowerMessage = message.toLowerCase();
    const actions: EscalationAction[] = [];

    // Check for emergency triggers first
    if (this.containsKeywords(lowerMessage, this.emergencyTriggers)) {
      actions.push(this.createEmergencyAction());
    }

    // Check for high severity
    if (this.containsKeywords(lowerMessage, this.highSeverityTriggers)) {
      actions.push(this.createUrgentCareAction());
      actions.push(this.createTelehealthAction());
    }

    // Check for medicine recommendations
    if (this.containsKeywords(lowerMessage, this.medicineRecommendationTriggers)) {
      actions.push(this.createPharmacyAction());
      actions.push(this.createMedicationGuideAction());
    }

    // Check for doctor booking
    if (this.containsKeywords(lowerMessage, this.doctorBookingTriggers)) {
      actions.push(this.createBookDoctorAction(navigation));
      actions.push(this.createSpecialistAction());
    }

    // Check for self-care
    if (this.containsKeywords(lowerMessage, this.selfCareTriggers)) {
      actions.push(this.createSelfCareAction());
      actions.push(this.createWellnessAction());
    }

    // Always provide info action
    actions.push(this.createInfoAction());

    // Remove duplicates and sort by urgency
    const uniqueActions = this.removeDuplicateActions(actions);
    return uniqueActions.sort((a, b) => b.urgency - a.urgency);
  }

  private containsKeywords(message: string, keywords: string[]): boolean {
    return keywords.some(keyword => message.includes(keyword));
  }

  private createEmergencyAction(): EscalationAction {
    return {
      id: 'emergency',
      type: EscalationType.EMERGENCY,
      title: '🚨 Emergency Services',
      description: 'Call emergency services immediately',
      icon: 'emergency',
      color: '#FFFFFF',
      backgroundColor: '#FF4444',
      urgency: 5,
      phoneNumber: '911',
      estimatedTime: 'Immediate',
      action: () => {
        // Open phone dialer to 911
        const phoneUrl = 'tel:911';
        if (typeof window !== 'undefined') {
          window.open(phoneUrl);
        }
      }
    };
  }

  private createUrgentCareAction(): EscalationAction {
    return {
      id: 'urgent_care',
      type: EscalationType.HIGH_SEVERITY,
      title: '🏥 Urgent Care',
      description: 'Visit urgent care center within 2-4 hours',
      icon: 'local-hospital',
      color: '#FFFFFF',
      backgroundColor: '#FF8800',
      urgency: 4,
      estimatedTime: '2-4 hours wait',
      action: () => {
        // Open maps to find nearest urgent care
        const mapsUrl = 'https://maps.google.com/?q=urgent+care+near+me';
        if (typeof window !== 'undefined') {
          window.open(mapsUrl);
        }
      }
    };
  }

  private createTelehealthAction(): EscalationAction {
    return {
      id: 'telehealth',
      type: EscalationType.HIGH_SEVERITY,
      title: '📱 Telehealth Consultation',
      description: 'Speak with a doctor online now',
      icon: 'video-call',
      color: '#FFFFFF',
      backgroundColor: '#FF8800',
      urgency: 4,
      estimatedTime: '5-15 minutes',
      requiresAuth: true,
      action: () => {
        // Navigate to telehealth service
        logger.info('Starting telehealth consultation');
      }
    };
  }

  private createPharmacyAction(): EscalationAction {
    return {
      id: 'pharmacy',
      type: EscalationType.RECOMMENDATION,
      title: '💊 Pharmacy Consultation',
      description: 'Consult with pharmacist about medications',
      icon: 'medical-services',
      color: '#000000',
      backgroundColor: '#FFD700',
      urgency: 3,
      estimatedTime: '10-20 minutes',
      action: () => {
        // Find nearby pharmacies
        const mapsUrl = 'https://maps.google.com/?q=pharmacy+near+me';
        if (typeof window !== 'undefined') {
          window.open(mapsUrl);
        }
      }
    };
  }

  private createMedicationGuideAction(): EscalationAction {
    return {
      id: 'medication_guide',
      type: EscalationType.RECOMMENDATION,
      title: '📋 Medication Guide',
      description: 'View medication information and interactions',
      icon: 'info',
      color: '#000000',
      backgroundColor: '#FFD700',
      urgency: 2,
      action: () => {
        logger.info('Opening medication guide');
      }
    };
  }

  private createBookDoctorAction(navigation: any): EscalationAction {
    return {
      id: 'book_doctor',
      type: EscalationType.RECOMMENDATION,
      title: '👩‍⚕️ Book Doctor Appointment',
      description: 'Schedule appointment with your doctor',
      icon: 'event',
      color: '#000000',
      backgroundColor: '#FFD700',
      urgency: 3,
      estimatedTime: '1-7 days',
      requiresAuth: true,
      action: () => {
        navigation.navigate('DoctorServices', { initialTab: 'scheduled' });
      }
    };
  }

  private createSpecialistAction(): EscalationAction {
    return {
      id: 'specialist',
      type: EscalationType.RECOMMENDATION,
      title: '🔬 Specialist Referral',
      description: 'Get referral to medical specialist',
      icon: 'person-search',
      color: '#000000',
      backgroundColor: '#FFD700',
      urgency: 3,
      requiresAuth: true,
      action: () => {
        logger.info('Opening specialist booking');
      }
    };
  }

  private createSelfCareAction(): EscalationAction {
    return {
      id: 'self_care',
      type: EscalationType.SELF_CARE,
      title: '🏠 Self Care Guide',
      description: 'Home remedies and self-care tips',
      icon: 'healing',
      color: '#FFFFFF',
      backgroundColor: '#4CAF50',
      urgency: 2,
      action: () => {
        logger.info('Opening self-care guide');
      }
    };
  }

  private createWellnessAction(): EscalationAction {
    return {
      id: 'wellness',
      type: EscalationType.SELF_CARE,
      title: '🧘 Wellness Tips',
      description: 'Prevention and wellness advice',
      icon: 'spa',
      color: '#FFFFFF',
      backgroundColor: '#4CAF50',
      urgency: 1,
      action: () => {
        logger.info('Opening wellness guide');
      }
    };
  }

  private createInfoAction(): EscalationAction {
    return {
      id: 'info',
      type: EscalationType.INFO,
      title: 'ℹ️ Health Information',
      description: 'Learn more about your symptoms',
      icon: 'info',
      color: '#FFFFFF',
      backgroundColor: '#2196F3',
      urgency: 1,
      action: () => {
        logger.info('Opening health information');
      }
    };
  }

  private removeDuplicateActions(actions: EscalationAction[]): EscalationAction[] {
    const seen = new Set<string>();
    return actions.filter(action => {
      if (seen.has(action.id)) {
        return false;
      }
      seen.add(action.id);
      return true;
    });
  }

  /**
   * Gets appropriate message based on escalation level
   */
  public getEscalationMessage(actions: EscalationAction[]): string {
    const maxUrgency = Math.max(...actions.map(a => a.urgency));
    
    if (maxUrgency === 5) {
      return "⚠️ This sounds like a medical emergency. Please call emergency services immediately if you're experiencing severe symptoms.";
    } else if (maxUrgency === 4) {
      return "⚠️ Your symptoms may need prompt medical attention. Consider contacting healthcare services soon.";
    } else if (maxUrgency === 3) {
      return "💡 I recommend speaking with a healthcare professional about these symptoms.";
    } else if (maxUrgency === 2) {
      return "🏠 Here are some self-care options that might help with your symptoms.";
    } else {
      return "ℹ️ I can provide some general health information about your concern.";
    }
  }
}