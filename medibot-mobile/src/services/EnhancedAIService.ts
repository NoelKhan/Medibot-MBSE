/**
 * Enhanced AI Consultation Service with Smart Context Analysis
 * Provides intelligent medical responses with better user input understanding
 */

import { Message, Conversation, MedicalCase } from '../types/Medical';
import { User } from '../types/User';

interface SmartAnalysis {
  symptoms: string[];
  severity: 'low' | 'moderate' | 'high' | 'emergency';
  bodyParts: string[];
  duration: string | null;
  triggers: string[];
  sentiment: 'concerned' | 'anxious' | 'calm' | 'urgent';
  medicalTerms: string[];
}

interface ResponseContext {
  isFollowUp: boolean;
  previousSymptoms: string[];
  userAge?: number;
  userGender?: string;
  conversationLength: number;
}

interface SmartSuggestion {
  type: 'question' | 'advice' | 'clarification' | 'emergency';
  text: string;
  priority: number;
}

export class EnhancedAIService {
  private static instance: EnhancedAIService;
  
  // Medical knowledge base
  private readonly symptoms = {
    pain: ['ache', 'hurt', 'pain', 'sore', 'tender', 'throbbing', 'stabbing', 'burning'],
    respiratory: ['cough', 'breathing', 'shortness of breath', 'wheezing', 'congestion'],
    digestive: ['nausea', 'vomiting', 'stomach', 'belly', 'diarrhea', 'constipation'],
    neurological: ['headache', 'dizzy', 'confusion', 'memory', 'numbness', 'tingling'],
    cardiac: ['chest pain', 'heart', 'palpitations', 'irregular heartbeat'],
    emergency: ['chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious', 'stroke']
  };

  private readonly bodyParts = [
    'head', 'neck', 'chest', 'back', 'arm', 'leg', 'stomach', 'abdomen',
    'shoulder', 'knee', 'ankle', 'wrist', 'throat', 'eye', 'ear', 'nose'
  ];

  private readonly severityIndicators = {
    emergency: ['severe', 'intense', 'unbearable', 'can\'t breathe', 'crushing', 'worst ever'],
    high: ['very', 'really bad', 'terrible', 'awful', 'extreme'],
    moderate: ['moderate', 'noticeable', 'bothering', 'concerning'],
    low: ['mild', 'slight', 'little', 'minor', 'barely']
  };

  public static getInstance(): EnhancedAIService {
    if (!EnhancedAIService.instance) {
      EnhancedAIService.instance = new EnhancedAIService();
    }
    return EnhancedAIService.instance;
  }

  /**
   * Analyze user input for medical context and intent
   */
  public analyzeUserInput(message: string, conversationHistory: Message[]): SmartAnalysis {
    const lowercaseMessage = message.toLowerCase();
    
    // Extract symptoms
    const symptoms: string[] = [];
    Object.values(this.symptoms).flat().forEach(symptom => {
      if (lowercaseMessage.includes(symptom)) {
        symptoms.push(symptom);
      }
    });

    // Identify body parts mentioned
    const bodyParts = this.bodyParts.filter(part => 
      lowercaseMessage.includes(part)
    );

    // Assess severity
    let severity: 'low' | 'moderate' | 'high' | 'emergency' = 'low';
    
    if (this.severityIndicators.emergency.some(indicator => 
      lowercaseMessage.includes(indicator))) {
      severity = 'emergency';
    } else if (this.severityIndicators.high.some(indicator => 
      lowercaseMessage.includes(indicator))) {
      severity = 'high';
    } else if (this.severityIndicators.moderate.some(indicator => 
      lowercaseMessage.includes(indicator))) {
      severity = 'moderate';
    }

    // Extract duration information
    const duration = this.extractDuration(lowercaseMessage);

    // Identify triggers
    const triggers = this.extractTriggers(lowercaseMessage);

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(lowercaseMessage);

    // Extract medical terms
    const medicalTerms = this.extractMedicalTerms(lowercaseMessage);

    return {
      symptoms,
      severity,
      bodyParts,
      duration,
      triggers,
      sentiment,
      medicalTerms
    };
  }

  /**
   * Generate intelligent response based on analysis
   */
  public async generateSmartResponse(
    userInput: string, 
    conversationHistory: Message[],
    user: User
  ): Promise<Message> {
    const analysis = this.analyzeUserInput(userInput, conversationHistory);
    const context = this.buildResponseContext(conversationHistory, user);
    
    // Emergency check
    if (analysis.severity === 'emergency' || this.isEmergencyScenario(analysis)) {
      return this.generateEmergencyResponse(analysis);
    }

    // Generate contextual response
    const response = this.generateContextualResponse(analysis, context, userInput);
    const suggestions = this.generateSmartSuggestions(analysis, context);

    return {
      id: `ai_smart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: response,
      sender: 'bot',
      timestamp: new Date(),
      type: 'text',
      metadata: {
        aiConfidence: this.calculateConfidence(analysis, context),
        requiresFollowUp: analysis.severity !== 'low',
        suggestedActions: this.generateFollowUpQuestions(analysis, context)
      }
    };
  }

  private extractDuration(message: string): string | null {
    const durationPatterns = [
      /(\d+)\s*(day|days|week|weeks|month|months|hour|hours|minute|minutes)/i,
      /(since|for|about|around|over)\s+(\w+)/i,
      /(yesterday|today|this morning|last night|few days|couple weeks)/i
    ];

    for (const pattern of durationPatterns) {
      const match = message.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  private extractTriggers(message: string): string[] {
    const triggers: string[] = [];
    const triggerWords = [
      'after eating', 'when walking', 'during exercise', 'at night',
      'in the morning', 'when stressed', 'after work', 'when lying down'
    ];

    triggerWords.forEach(trigger => {
      if (message.includes(trigger)) {
        triggers.push(trigger);
      }
    });

    return triggers;
  }

  private analyzeSentiment(message: string): 'concerned' | 'anxious' | 'calm' | 'urgent' {
    const anxiousWords = ['worried', 'scared', 'afraid', 'panic', 'anxious'];
    const urgentWords = ['urgent', 'emergency', 'help', 'immediately', 'now'];
    const concernedWords = ['concerned', 'wondering', 'should i', 'what if'];

    if (urgentWords.some(word => message.includes(word))) return 'urgent';
    if (anxiousWords.some(word => message.includes(word))) return 'anxious';
    if (concernedWords.some(word => message.includes(word))) return 'concerned';
    
    return 'calm';
  }

  private extractMedicalTerms(message: string): string[] {
    const medicalTerms = [
      'diagnosis', 'symptoms', 'medication', 'prescription', 'treatment',
      'chronic', 'acute', 'inflammation', 'infection', 'allergy'
    ];

    return medicalTerms.filter(term => message.toLowerCase().includes(term));
  }

  private buildResponseContext(conversationHistory: Message[], user: User): ResponseContext {
    const previousSymptoms: string[] = [];
    
    conversationHistory.forEach(msg => {
      if (msg.sender === 'user') {
        const analysis = this.analyzeUserInput(msg.content, []);
        previousSymptoms.push(...analysis.symptoms);
      }
    });

    return {
      isFollowUp: conversationHistory.length > 2,
      previousSymptoms: [...new Set(previousSymptoms)],
      userAge: (user as any).age,
      userGender: (user as any).gender,
      conversationLength: conversationHistory.length
    };
  }

  private isEmergencyScenario(analysis: SmartAnalysis): boolean {
    const emergencySymptoms = [
      'chest pain', 'difficulty breathing', 'severe bleeding',
      'loss of consciousness', 'severe head injury', 'stroke symptoms'
    ];

    return analysis.symptoms.some(symptom => 
      emergencySymptoms.includes(symptom)
    ) || analysis.severity === 'emergency';
  }

  private generateEmergencyResponse(analysis: SmartAnalysis): Message {
    return {
      id: `emergency_${Date.now()}`,
      content: `⚠️ **URGENT MEDICAL ATTENTION NEEDED**\n\nBased on your symptoms, this may require immediate medical care. Please:\n\n🚨 **Call emergency services (911) immediately**\n🏥 **Go to the nearest emergency room**\n📞 **Contact your doctor right away**\n\nDo not delay seeking professional medical help. This chat cannot replace emergency medical care.`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'text',
      metadata: {
        requiresFollowUp: true,
        suggestedActions: ['Call 911 immediately', 'Go to emergency room', 'Contact doctor']
      }
    };
  }

  private generateContextualResponse(
    analysis: SmartAnalysis, 
    context: ResponseContext,
    originalInput: string
  ): string {
    let response = '';

    // Personalized greeting based on conversation length
    if (context.conversationLength === 0) {
      response += `Hello! I'm here to help you understand your health concerns. `;
    } else if (context.isFollowUp) {
      response += `Thank you for providing more information. `;
    }

    // Address the specific symptoms mentioned
    if (analysis.symptoms.length > 0) {
      const symptomText = analysis.symptoms.join(', ');
      response += `I understand you're experiencing ${symptomText}. `;
      
      if (analysis.bodyParts.length > 0) {
        response += `The ${analysis.bodyParts.join(' and ')} area you mentioned `;
      }
      
      if (analysis.duration) {
        response += `that has been present ${analysis.duration} `;
      }
      
      response += `can have several possible causes.\n\n`;
    }

    // Provide severity-appropriate advice
    switch (analysis.severity) {
      case 'high':
        response += `🔴 **Important**: These symptoms suggest you should seek medical attention soon. `;
        break;
      case 'moderate':
        response += `🟡 **Consider**: It would be wise to monitor these symptoms and consider seeing a healthcare provider. `;
        break;
      case 'low':
        response += `🟢 **Generally**: These symptoms are often manageable with self-care, but monitoring is important. `;
        break;
    }

    // Add contextual medical information
    response += this.getEducationalContent(analysis);

    // Sentiment-based reassurance
    if (analysis.sentiment === 'anxious' || analysis.sentiment === 'concerned') {
      response += `\n\nI understand this can be concerning. Remember that many health issues are treatable, and seeking proper medical care is always the right step when you're worried about your health.`;
    }

    return response;
  }

  private generateSmartSuggestions(
    analysis: SmartAnalysis, 
    context: ResponseContext
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Generate relevant follow-up questions
    if (analysis.symptoms.length > 0 && !analysis.duration) {
      suggestions.push({
        type: 'question',
        text: 'How long have you been experiencing these symptoms?',
        priority: 1
      });
    }

    if (analysis.bodyParts.length > 0 && analysis.severity === 'low') {
      suggestions.push({
        type: 'advice',
        text: 'Consider applying ice or heat to the affected area for comfort.',
        priority: 2
      });
    }

    if (context.conversationLength > 4 && analysis.severity !== 'emergency') {
      suggestions.push({
        type: 'clarification',
        text: 'Would you like me to summarize what we\'ve discussed so far?',
        priority: 3
      });
    }

    return suggestions.sort((a, b) => a.priority - b.priority);
  }

  private generateFollowUpQuestions(
    analysis: SmartAnalysis, 
    context: ResponseContext
  ): string[] {
    const questions: string[] = [];

    if (analysis.symptoms.includes('pain') && !analysis.triggers.length) {
      questions.push('What makes the pain better or worse?');
    }

    if (analysis.bodyParts.length > 0 && !analysis.duration) {
      questions.push('When did this first start?');
    }

    if (analysis.severity === 'moderate' || analysis.severity === 'high') {
      questions.push('Have you taken any medication for this?');
    }

    return questions.slice(0, 3); // Limit to 3 questions
  }

  private calculateConfidence(analysis: SmartAnalysis, context: ResponseContext): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on available information
    if (analysis.symptoms.length > 0) confidence += 0.2;
    if (analysis.duration) confidence += 0.1;
    if (analysis.bodyParts.length > 0) confidence += 0.1;
    if (context.isFollowUp) confidence += 0.1;

    return Math.min(confidence, 0.9); // Cap at 90%
  }

  private getEducationalContent(analysis: SmartAnalysis): string {
    // Return educational content based on symptoms
    if (analysis.symptoms.includes('headache')) {
      return `\n**About Headaches**: Common causes include tension, dehydration, eye strain, or stress. Most headaches are not serious, but persistent or severe headaches should be evaluated by a healthcare provider.`;
    }

    if (analysis.symptoms.includes('cough')) {
      return `\n**About Coughs**: Coughs can be caused by infections, allergies, or irritants. If accompanied by fever, difficulty breathing, or lasting more than 2 weeks, medical evaluation is recommended.`;
    }

    return `\n**General Health Note**: Your body's signals are important. When in doubt, it's always best to consult with a healthcare professional who can provide personalized medical advice.`;
  }
}

export default EnhancedAIService;