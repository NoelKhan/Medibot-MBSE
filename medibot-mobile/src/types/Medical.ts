// Standardized 1-5 severity scale as requested
export type SeverityScale = 1 | 2 | 3 | 4 | 5;

export interface SeverityLevelInfo {
  level: SeverityScale;
  label: string;
  description: string;
  color: string;
}

export const SEVERITY_LEVELS: Record<SeverityScale, SeverityLevelInfo> = {
  1: { level: 1, label: 'Mild', description: 'Minor symptoms, routine care', color: '#34C759' },
  2: { level: 2, label: 'Low', description: 'Mild discomfort, non-urgent', color: '#FFCC02' },
  3: { level: 3, label: 'Moderate', description: 'Noticeable symptoms, attention needed', color: '#FF9500' },
  4: { level: 4, label: 'High', description: 'Significant symptoms, urgent care', color: '#FF3B30' },
  5: { level: 5, label: 'Critical', description: 'Severe symptoms, immediate care', color: '#8B0000' }
};

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'provider';
  timestamp: Date;
  type: 'text' | 'image' | 'voice' | 'file';
  metadata?: {
    severity?: SeverityScale;
    suggestedActions?: string[];
    aiConfidence?: number;
    requiresFollowUp?: boolean;
  };
}

export interface MedicalCase {
  id: string;
  userId: string;
  conversationId: string;
  title: string;
  symptoms: string[];
  severity: SeverityScale;
  diagnosis?: string;
  recommendations: string[];
  followUpRequired: boolean;
  followUpDate?: Date;
  status: 'active' | 'completed' | 'escalated' | 'follow_up';
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  notes?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  caseId?: string;
  messages: Message[];
  status: 'active' | 'completed' | 'escalated' | 'discarded';
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
  summary?: string;
  aiAssessment?: {
    severity: SeverityScale;
    symptoms: string[];
    suggestedServices: ('doctor' | 'emergency' | 'follow_up')[];
    confidence: number;
  };
  shouldSave?: boolean;
  saveReason?: string;
}

export interface ConsultationEndPrompt {
  trigger: 'user_intent' | 'ai_detection' | 'time_based';
  questions: string[];
  saveDecisionLogic: (responses: string[]) => boolean;
}

export interface ServiceSuggestion {
  type: 'doctor' | 'emergency' | 'follow_up';
  reason: string;
  confidence: number;
  urgency: SeverityScale;
  suggestedAction: string;
}