import { Message } from '../types/Medical';

export interface EmergencyAnalysis {
  severity: 1 | 2 | 3 | 4 | 5;
  keywords: string[];
  recommendation: 'doctor_booking' | 'emergency_call' | 'immediate_emergency';
  urgency: 'low' | 'medium' | 'high' | 'critical' | 'immediate';
  reasoning: string;
}

export class EmergencyDetectionService {
  private static instance: EmergencyDetectionService;

  private emergencyKeywords = {
    immediate: [
      'chest pain', 'heart attack', 'can\'t breathe', 'cannot breathe', 'choking',
      'severe bleeding', 'unconscious', 'stopped breathing', 'overdose', 'suicide',
      'stroke', 'seizure', 'severe head injury', 'severe burns', 'poisoning',
      'anaphylaxis', 'severe allergic reaction', 'cardiac arrest', 'drowning'
    ],
    critical: [
      'severe pain', 'difficulty breathing', 'heavy bleeding', 'broken bone',
      'severe headache', 'high fever', 'vomiting blood', 'severe abdominal pain',
      'loss of consciousness', 'severe dizziness', 'severe allergic',
      'can\'t move', 'paralyzed', 'severe injury'
    ],
    high: [
      'chest discomfort', 'shortness of breath', 'bleeding', 'severe nausea',
      'persistent vomiting', 'high temperature', 'severe cough', 'intense headache',
      'dizzy', 'faint', 'allergic reaction', 'injured', 'pain level 8', 'pain level 9', 'pain level 10'
    ],
    medium: [
      'moderate pain', 'persistent headache', 'fever', 'nausea', 'vomiting',
      'cough', 'sore throat', 'muscle ache', 'joint pain', 'rash',
      'pain level 5', 'pain level 6', 'pain level 7'
    ],
    low: [
      'mild pain', 'slight headache', 'minor cough', 'runny nose', 'tired',
      'fatigue', 'stress', 'anxiety', 'insomnia', 'minor cut',
      'pain level 1', 'pain level 2', 'pain level 3', 'pain level 4'
    ]
  };

  private vitalSignKeywords = [
    'blood pressure', 'heart rate', 'pulse', 'temperature', 'oxygen',
    'breathing rate', 'respiratory rate'
  ];

  public static getInstance(): EmergencyDetectionService {
    if (!EmergencyDetectionService.instance) {
      EmergencyDetectionService.instance = new EmergencyDetectionService();
    }
    return EmergencyDetectionService.instance;
  }

  public analyzeMessage(message: string): EmergencyAnalysis {
    const lowerMessage = message.toLowerCase();
    const foundKeywords: string[] = [];
    let maxSeverity = 1;
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' | 'immediate' = 'low';

    // Check for immediate emergency keywords
    for (const keyword of this.emergencyKeywords.immediate) {
      if (lowerMessage.includes(keyword)) {
        foundKeywords.push(keyword);
        maxSeverity = Math.max(maxSeverity, 5);
        urgencyLevel = 'immediate';
      }
    }

    // Check for critical keywords
    for (const keyword of this.emergencyKeywords.critical) {
      if (lowerMessage.includes(keyword)) {
        foundKeywords.push(keyword);
        maxSeverity = Math.max(maxSeverity, 4);
        if (urgencyLevel !== 'immediate') urgencyLevel = 'critical';
      }
    }

    // Check for high urgency keywords
    for (const keyword of this.emergencyKeywords.high) {
      if (lowerMessage.includes(keyword)) {
        foundKeywords.push(keyword);
        maxSeverity = Math.max(maxSeverity, 3);
        if (!['immediate', 'critical'].includes(urgencyLevel)) urgencyLevel = 'high';
      }
    }

    // Check for medium urgency keywords
    for (const keyword of this.emergencyKeywords.medium) {
      if (lowerMessage.includes(keyword)) {
        foundKeywords.push(keyword);
        maxSeverity = Math.max(maxSeverity, 2);
        if (!['immediate', 'critical', 'high'].includes(urgencyLevel)) urgencyLevel = 'medium';
      }
    }

    // Check for low urgency keywords
    for (const keyword of this.emergencyKeywords.low) {
      if (lowerMessage.includes(keyword)) {
        foundKeywords.push(keyword);
        maxSeverity = Math.max(maxSeverity, 1);
      }
    }

    // Determine recommendation based on severity
    let recommendation: 'doctor_booking' | 'emergency_call' | 'immediate_emergency';
    let reasoning: string;

    if (maxSeverity >= 4) {
      recommendation = maxSeverity === 5 ? 'immediate_emergency' : 'emergency_call';
      reasoning = maxSeverity === 5 
        ? 'Immediate emergency detected. Call emergency services now!'
        : 'Critical symptoms detected. Emergency medical attention recommended.';
    } else {
      recommendation = 'doctor_booking';
      reasoning = 'Symptoms suggest medical consultation needed. Book an appointment with a doctor.';
    }

    return {
      severity: maxSeverity as 1 | 2 | 3 | 4 | 5,
      keywords: foundKeywords,
      recommendation,
      urgency: urgencyLevel,
      reasoning
    };
  }

  public analyzeChatHistory(messages: Message[]): EmergencyAnalysis {
    let overallSeverity = 1;
    const allKeywords: string[] = [];
    let latestAnalysis: EmergencyAnalysis | null = null;

    // Analyze recent user messages (last 5)
    const recentUserMessages = messages
      .filter(msg => msg.sender === 'user')
      .slice(-5)
      .map(msg => msg.content);

    for (const message of recentUserMessages) {
      const analysis = this.analyzeMessage(message);
      allKeywords.push(...analysis.keywords);
      overallSeverity = Math.max(overallSeverity, analysis.severity);
      latestAnalysis = analysis;
    }

    // If no analysis available, return low severity
    if (!latestAnalysis) {
      return {
        severity: 1,
        keywords: [],
        recommendation: 'doctor_booking',
        urgency: 'low',
        reasoning: 'No emergency indicators detected.'
      };
    }

    // Check for escalating pattern
    const severityPattern = recentUserMessages.map(msg => this.analyzeMessage(msg).severity);
    const isEscalating = severityPattern.length >= 2 && 
      severityPattern[severityPattern.length - 1] > severityPattern[severityPattern.length - 2];

    if (isEscalating && overallSeverity >= 3) {
      overallSeverity = Math.min(overallSeverity + 1, 5);
    }

    let recommendation: 'doctor_booking' | 'emergency_call' | 'immediate_emergency';
    let urgency: 'low' | 'medium' | 'high' | 'critical' | 'immediate';
    let reasoning: string;

    if (overallSeverity >= 5) {
      recommendation = 'immediate_emergency';
      urgency = 'immediate';
      reasoning = 'Multiple severe symptoms detected with escalating pattern. Immediate emergency response required!';
    } else if (overallSeverity >= 4) {
      recommendation = 'emergency_call';
      urgency = 'critical';
      reasoning = 'Critical symptoms detected in conversation. Emergency medical attention strongly recommended.';
    } else {
      recommendation = 'doctor_booking';
      urgency = overallSeverity >= 3 ? 'high' : overallSeverity >= 2 ? 'medium' : 'low';
      reasoning = overallSeverity >= 3 
        ? 'Concerning symptoms detected. Medical consultation recommended soon.'
        : 'Symptoms suggest routine medical care may be helpful.';
    }

    return {
      severity: overallSeverity as 1 | 2 | 3 | 4 | 5,
      keywords: [...new Set(allKeywords)], // Remove duplicates
      recommendation,
      urgency,
      reasoning
    };
  }

  public getEmergencyResponse(analysis: EmergencyAnalysis): {
    title: string;
    message: string;
    actions: Array<{
      label: string;
      action: 'call_emergency' | 'book_doctor' | 'continue_chat' | 'emergency_page';
      priority: 'primary' | 'secondary' | 'danger';
    }>;
  } {
    if (analysis.recommendation === 'immediate_emergency') {
      return {
        title: '🚨 IMMEDIATE EMERGENCY',
        message: `${analysis.reasoning}\n\nKeywords detected: ${analysis.keywords.join(', ')}\n\nIf this is a true emergency, call emergency services immediately.`,
        actions: [
          {
            label: 'Call Emergency (000)',
            action: 'call_emergency',
            priority: 'danger'
          },
          {
            label: 'Emergency Page',
            action: 'emergency_page',
            priority: 'primary'
          },
          {
            label: 'Continue Chat',
            action: 'continue_chat',
            priority: 'secondary'
          }
        ]
      };
    } else if (analysis.recommendation === 'emergency_call') {
      return {
        title: '⚠️ URGENT MEDICAL ATTENTION',
        message: `${analysis.reasoning}\n\nSymptoms detected: ${analysis.keywords.join(', ')}\n\nConsider seeking immediate medical care.`,
        actions: [
          {
            label: 'Emergency Services',
            action: 'emergency_page',
            priority: 'danger'
          },
          {
            label: 'Book Doctor Urgently',
            action: 'book_doctor',
            priority: 'primary'
          },
          {
            label: 'Continue Chat',
            action: 'continue_chat',
            priority: 'secondary'
          }
        ]
      };
    } else {
      return {
        title: '🏥 Medical Consultation Recommended',
        message: `${analysis.reasoning}\n\nSymptoms mentioned: ${analysis.keywords.join(', ')}\n\nA healthcare professional can provide proper assessment.`,
        actions: [
          {
            label: 'Book Doctor Appointment',
            action: 'book_doctor',
            priority: 'primary'
          },
          {
            label: 'Continue Chat',
            action: 'continue_chat',
            priority: 'secondary'
          }
        ]
      };
    }
  }
}