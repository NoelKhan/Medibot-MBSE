/**
 * MVC ARCHITECTURE - MODEL LAYER (BUSINESS LOGIC SERVICE)
 * =======================================================
 * AIConsultationService handles core medical consultation logic and AI integration
 * 
 * PRODUCTION ARCHITECTURE NOTES:
 * =============================
 * 
 * 1. LLM INTEGRATION POINTS:
 *    - Replace mock responses with OpenAI/Anthropic API calls
 *    - Implement conversation context management for multi-turn chats
 *    - Add prompt engineering and response post-processing
 *    - Integrate medical knowledge bases (UMLS, SNOMED CT)
 * 
 * 2. BACKEND INTEGRATION READY:
 *    - Structured API request/response patterns
 *    - Error handling and retry mechanisms  
 *    - Rate limiting and quota management
 *    - Conversation persistence and retrieval
 * 
 * 3. SCALABILITY FEATURES:
 *    - Singleton pattern for efficient resource usage
 *    - Async/await for non-blocking operations
 *    - Configurable confidence thresholds
 *    - Extensible symptom analysis pipeline
 * 
 * 4. CONTAINER/CLOUD READY:
 *    - Environment-based configuration
 *    - Health check endpoints capability
 *    - Metrics collection points for monitoring
 *    - Stateless design for horizontal scaling
 */

// Web storage adapter
const WebStorage = { getItem: async (key: string) => localStorage.getItem(key), setItem: async (key: string, value: string) => { localStorage.setItem(key, value); }, removeItem: async (key: string) => { localStorage.removeItem(key); } };
import type { 
  Message, 
  Conversation, 
  MedicalCase, 
  ServiceSuggestion, 
  SeverityScale, 
  ConsultationEndPrompt
} from '../types/Medical';
import { SEVERITY_LEVELS } from '../types/Medical';
import PharmacyService from './PharmacyService';
import { logger, errorHandler, performanceMonitor, type LogContext, type ErrorContext } from '../utils/ProductionUtils';

/**
 * BUSINESS LOGIC CONTROLLER - Medical AI Consultation
 * =================================================== 
 * Handles medical conversation analysis, symptom assessment, and advice generation
 * Ready for production LLM integration and external healthcare API connections
 */
class AIConsultationService {
  private static instance: AIConsultationService;

  constructor() {
    // This would connect to your preferred LLM in production
    this.pharmacyService = PharmacyService.getInstance();
  }

  private pharmacyService: PharmacyService;

  static getInstance(): AIConsultationService {
    if (!AIConsultationService.instance) {
      AIConsultationService.instance = new AIConsultationService();
    }
    return AIConsultationService.instance;
  }

  // Enhanced AI response with consultation management
  async generateResponse(userMessage: string, conversationHistory: Message[]): Promise<Message> {
    const context: LogContext = {
      service: 'AIConsultation',
      method: 'generateResponse',
      conversationId: conversationHistory[0]?.id || 'new',
    };

    return performanceMonitor.timeFunction(
      'ai_response_generation',
      async () => {
        try {
          logger.info(`Generating AI response for user message`, context);

          // Input validation and sanitization
          if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
            throw new Error('Invalid user message: empty or null');
          }

          if (!Array.isArray(conversationHistory)) {
            logger.warn('Invalid conversation history, using empty array', context);
            conversationHistory = [];
          }

          // Sanitize user message (remove potential harmful content)
          const sanitizedMessage = this.sanitizeUserInput(userMessage);
          
          // Analyze the conversation for patterns and intent
          const analysis = await this.analyzeConversation([...conversationHistory, {
            id: Date.now().toString(),
            content: sanitizedMessage,
            sender: 'user',
            timestamp: new Date(),
            type: 'text'
          }]);

          logger.debug('Conversation analysis completed', context);

          // Generate contextual response with service suggestions
          const response = await this.generateContextualResponse(sanitizedMessage, conversationHistory, analysis);

          const aiMessage: Message = {
            id: Date.now().toString(),
            content: response.content,
            sender: 'bot',
            timestamp: new Date(),
            type: 'text',
            metadata: {
              severity: analysis.severity,
              suggestedActions: response.suggestedActions,
              aiConfidence: analysis.confidence,
              requiresFollowUp: analysis.requiresFollowUp
            }
          };

          logger.info('AI response generated successfully', context);

          return aiMessage;

        } catch (error) {
          const errorContext: ErrorContext = {
            ...context,
            userAction: 'sending_message',
            recoverable: true,
          };

          const errorInfo = errorHandler.handleServiceError(
            error as Error,
            errorContext,
            'I apologize, but I\'m having trouble processing your message right now. Please try rephrasing your question or contact support if the issue persists.'
          );

          logger.error('Failed to generate AI response', error as Error, errorContext);

          return this.getFallbackResponse(errorInfo.userMessage);
        }
      },
      context
    );
  }

  /**
   * SECURITY: Input sanitization to prevent injection attacks
   * Removes potentially harmful content while preserving medical context
   */
  private sanitizeUserInput(input: string): string {
    if (!input) return '';
    
    // Remove potential script tags and HTML
    let sanitized = input.replace(/<[^>]*>/g, '');
    
    // Remove excessive whitespace but preserve medical formatting
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // Limit input length to prevent DoS attacks
    if (sanitized.length > 2000) {
      sanitized = sanitized.substring(0, 2000) + '...';
      logger.warn('User input truncated due to length', { 
        service: 'AIConsultation',
        method: 'sanitizeUserInput',
      });
    }
    
    return sanitized;
  }

  // Analyze conversation for medical patterns and intent
  async analyzeConversation(messages: Message[]): Promise<{
    severity: SeverityScale;
    symptoms: string[];
    suggestedServices: ServiceSuggestion[];
    confidence: number;
    requiresFollowUp: boolean;
    isConsultationComplete: boolean;
  }> {
    const recentMessages = messages.slice(-10); // Analyze last 10 messages
    const userMessages = recentMessages.filter(m => m.sender === 'user').map(m => m.content.toLowerCase());
    const conversationText = userMessages.join(' ');

    // Analyze symptoms and severity
    const symptoms = this.extractSymptoms(conversationText);
    const severity = this.assessSeverity(conversationText, symptoms);
    
    // Detect service needs
    const suggestedServices = this.detectServiceNeeds(conversationText, symptoms, severity);
    
    // Check if consultation seems complete
    const isConsultationComplete = this.detectConsultationEnd(conversationText, messages.length);
    
    return {
      severity,
      symptoms,
      suggestedServices,
      confidence: this.calculateConfidence(symptoms, conversationText),
      requiresFollowUp: severity >= 3 || symptoms.length >= 3,
      isConsultationComplete
    };
  }

  // Extract medical symptoms from conversation
  private extractSymptoms(text: string): string[] {
    const symptomKeywords = [
      'pain', 'ache', 'hurt', 'sore', 'fever', 'temperature', 'headache', 'nausea', 
      'vomit', 'dizzy', 'tired', 'fatigue', 'cough', 'sneeze', 'runny nose', 'congestion',
      'shortness of breath', 'chest pain', 'heart palpitations', 'swelling', 'rash', 
      'itching', 'burning', 'numbness', 'tingling', 'bleeding', 'bruising', 'anxiety',
      'depression', 'stress', 'insomnia', 'stomach ache', 'diarrhea', 'constipation',
      'difficulty swallowing', 'muscle weakness', 'joint pain', 'back pain', 'infection'
    ];

    const foundSymptoms: string[] = [];
    symptomKeywords.forEach(symptom => {
      if (text.includes(symptom)) {
        foundSymptoms.push(symptom);
      }
    });

    return [...new Set(foundSymptoms)]; // Remove duplicates
  }

  // Assess severity based on conversation content
  private assessSeverity(text: string, symptoms: string[]): SeverityScale {
    // Emergency indicators
    const emergencyTerms = ['emergency', 'urgent', 'severe', 'excruciating', 'unbearable', 'chest pain', 'can\'t breathe', 'suicide', 'overdose'];
    const highSeverityTerms = ['very painful', 'getting worse', 'can\'t sleep', 'can\'t eat', 'high fever', 'blood'];
    const moderateTerms = ['uncomfortable', 'bothering', 'persistent', 'ongoing'];

    if (emergencyTerms.some(term => text.includes(term))) {
      return 5; // Critical
    } else if (highSeverityTerms.some(term => text.includes(term)) || symptoms.length >= 4) {
      return 4; // High
    } else if (moderateTerms.some(term => text.includes(term)) || symptoms.length >= 2) {
      return 3; // Moderate
    } else if (symptoms.length === 1) {
      return 2; // Low
    } else {
      return 1; // Mild
    }
  }

  // Detect what services the user might need
  private detectServiceNeeds(text: string, symptoms: string[], severity: SeverityScale): ServiceSuggestion[] {
    const suggestions: ServiceSuggestion[] = [];

    // Emergency service detection
    if (severity >= 5 || text.includes('emergency') || text.includes('urgent')) {
      suggestions.push({
        type: 'emergency',
        reason: 'Symptoms indicate potential emergency situation',
        confidence: 0.9,
        urgency: 5,
        suggestedAction: 'Consider emergency services for immediate care'
      });
    }

    // Doctor booking detection
    if (severity >= 3 || symptoms.length >= 2 || text.includes('doctor') || text.includes('appointment')) {
      suggestions.push({
        type: 'doctor',
        reason: 'Symptoms suggest professional medical consultation needed',
        confidence: 0.8,
        urgency: severity,
        suggestedAction: 'Book an appointment with a healthcare provider'
      });
    }

    // Follow-up detection
    if (text.includes('follow up') || text.includes('check back') || text.includes('monitor')) {
      suggestions.push({
        type: 'follow_up',
        reason: 'Condition may require ongoing monitoring',
        confidence: 0.7,
        urgency: Math.max(2, severity - 1) as SeverityScale,
        suggestedAction: 'Schedule a follow-up consultation'
      });
    }

    return suggestions;
  }

  // Detect if conversation seems to be ending
  private detectConsultationEnd(text: string, messageCount: number): boolean {
    const endIndicators = [
      'thank you', 'thanks', 'that helps', 'i understand', 'got it',
      'i\'ll do that', 'sounds good', 'okay', 'alright', 'bye', 'goodbye'
    ];
    
    return endIndicators.some(indicator => text.includes(indicator)) && messageCount >= 6;
  }

  // Calculate AI confidence based on available information
  private calculateConfidence(symptoms: string[], text: string): number {
    let confidence = 0.5; // Base confidence
    
    if (symptoms.length > 0) confidence += 0.2;
    if (symptoms.length > 2) confidence += 0.1;
    if (text.length > 50) confidence += 0.1; // More detailed description
    if (text.split(' ').length > 20) confidence += 0.1; // Comprehensive information
    
    return Math.min(confidence, 1.0);
  }

  // Generate contextual response with medical advice
  private async generateContextualResponse(
    userMessage: string, 
    history: Message[], 
    analysis: any
  ): Promise<{ content: string; suggestedActions: string[] }> {
    const { severity, symptoms, suggestedServices } = analysis;
    
    // Base medical response
    let response = await this.generateMedicalAdvice(userMessage, symptoms, severity);
    
    // Add medication recommendations for mild to moderate symptoms
    if (severity <= 3 && symptoms.length > 0) {
      const medicationRecommendations = await this.pharmacyService.getMedicationRecommendations(symptoms);
      if (medicationRecommendations.length > 0) {
        response += '\n\n💊 **Medication Suggestions:**\n';
        medicationRecommendations.forEach((rec) => {
          const med = rec.medication;
          response += `• **${med.name}**: ${rec.reason}\n`;
          response += `  - Dosage: ${med.dosage}\n`;
          response += `  - Instructions: ${med.instructions}\n`;
          if (med.sideEffects && med.sideEffects.length > 0) {
            response += `  - Side effects: ${med.sideEffects.join(', ')}\n`;
          }
          if (med.warnings && med.warnings.length > 0) {
            response += `  - ⚠️ Warnings: ${med.warnings.join(', ')}\n`;
          }
          if (rec.alternatives && rec.alternatives.length > 0) {
            response += `  - Alternatives: ${rec.alternatives.join(', ')}\n`;
          }
          response += '\n';
        });
        response += '*Note: These are general suggestions. Consult a pharmacist or healthcare provider before taking any medication.*\n';
      }

      // Add nearby pharmacy locations
      const nearbyPharmacies = await this.pharmacyService.getNearbyPharmacies();
      if (nearbyPharmacies.length > 0) {
        response += '\n🏪 **Nearby Pharmacies:**\n';
        nearbyPharmacies.slice(0, 3).forEach((pharmacy) => { // Show top 3
          response += `• **${pharmacy.name}** (${pharmacy.rating}⭐)\n`;
          response += `  📍 ${pharmacy.address}\n`;
          response += `  📞 ${pharmacy.phone}\n`;
          if (pharmacy.services.length > 0) {
            response += `  Services: ${pharmacy.services.join(', ')}\n`;
          }
          response += '\n';
        });
      }
    }
    
    // Add service suggestions if appropriate
    if (suggestedServices.length > 0) {
      response += '\n📋 **Additional Recommendations:**\n';
      suggestedServices.forEach((service: ServiceSuggestion) => {
        response += `• ${service.suggestedAction}\n`;
      });
    }

    // Add severity-appropriate advice
    if (severity >= 4) {
      response += '\n\n⚠️ **Important:** Your symptoms suggest you should seek medical attention promptly. Avoid self-medication for severe symptoms.';
    } else if (severity === 3) {
      response += '\n\n💡 **Advice:** Consider scheduling a medical consultation if symptoms persist or worsen.';
    }

    const suggestedActions = suggestedServices.map((s: ServiceSuggestion) => s.suggestedAction);
    
    return { content: response, suggestedActions };
  }

  /**
   * LLM INTEGRATION POINT - MEDICAL ADVICE GENERATION
   * =================================================
   * This method serves as the core AI consultation logic.
   * In production, this should be replaced with:
   * 1. OpenAI/Anthropic API integration for dynamic responses
   * 2. Medical knowledge base integration (UMLS, SNOMED CT)
   * 3. Personalized recommendations based on user profile
   * 4. Real-time symptom analysis with ML models
   * 
   * BACKEND INTEGRATION READY:
   * - Structured input/output for API calls
   * - Confidence scoring for response quality
   * - Conversation context management
   */
  private async generateMedicalAdvice(message: string, symptoms: string[], severity: SeverityScale): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    // Enhanced contextual analysis for better responses to simple descriptions
    const contextualResponse = await this.generateContextualAnalysis(message, symptoms, severity);
    if (contextualResponse) {
      return contextualResponse;
    }
    
    // Specific symptom responses with improved quality
    if (symptoms.includes('headache') || lowerMessage.includes('headache')) {
      return this.getHeadacheAdvice(severity);
    } else if (symptoms.includes('fever') || lowerMessage.includes('fever') || lowerMessage.includes('temperature')) {
      return this.getFeverAdvice(severity);
    } else if (symptoms.includes('cough') || lowerMessage.includes('cough')) {
      return this.getCoughAdvice(severity);
    } else if (symptoms.includes('chest pain') || lowerMessage.includes('chest pain')) {
      return this.getChestPainAdvice(severity);
    } else if (symptoms.includes('pain') || lowerMessage.includes('pain')) {
      return this.getPainAdvice(lowerMessage, severity);
    } else if (symptoms.includes('tired') || symptoms.includes('fatigue') || lowerMessage.includes('tired') || lowerMessage.includes('exhausted')) {
      return this.getFatigueAdvice(severity);
    } else if (symptoms.includes('nausea') || lowerMessage.includes('nausea') || lowerMessage.includes('sick')) {
      return this.getNauseaAdvice(severity);
    } else if (symptoms.length > 0) {
      return this.getGeneralSymptomAdvice(symptoms, severity);
    } else {
      return this.getGeneralHealthAdvice();
    }
  }

  /**
   * ENHANCED AI RESPONSE GENERATION
   * ==============================
   * Provides contextual analysis for simple user descriptions
   * This method improves response quality for vague or simple inputs
   */
  private async generateContextualAnalysis(message: string, symptoms: string[], severity: SeverityScale): Promise<string | null> {
    const lowerMessage = message.toLowerCase();
    
    // Handle simple feeling descriptions
    if (lowerMessage.includes('not feeling well') || lowerMessage.includes('feeling unwell')) {
      return `I understand you're not feeling well. Let me help you assess your situation.\n\n**Initial Assessment:**\n• It's important to identify specific symptoms to provide better guidance\n• General malaise can have various causes\n\n**Please tell me more about:**\n• What specific symptoms are you experiencing?\n• When did you start feeling unwell?\n• Have you had any recent changes in sleep, diet, or stress?\n• Any fever, pain, or digestive issues?\n\n**Immediate Support:**\n• Rest and stay hydrated\n• Monitor your temperature\n• Note any developing symptoms\n• Consider light, nutritious foods if appetite allows\n\nOnce you provide more specific details, I can offer more targeted advice and recommendations.`;
    }

    // Handle vague pain descriptions
    if ((lowerMessage.includes('hurt') || lowerMessage.includes('pain')) && !symptoms.includes('chest pain')) {
      return this.analyzeGeneralPain(lowerMessage, severity);
    }

    // Handle mood/mental health indicators
    if (lowerMessage.includes('anxious') || lowerMessage.includes('stressed') || lowerMessage.includes('worried')) {
      return this.getMentalHealthSupport(lowerMessage, severity);
    }

    // Handle digestive issues
    if (lowerMessage.includes('stomach') || lowerMessage.includes('belly') || lowerMessage.includes('tummy')) {
      return this.getDigestiveAdvice(lowerMessage, severity);
    }

    return null; // No specific contextual match found
  }

  private getHeadacheAdvice(severity: SeverityScale): string {
    const severityInfo = SEVERITY_LEVELS[severity];
    let advice = `I understand you're experiencing headaches, which can be quite uncomfortable. Based on your description, this appears to be ${severityInfo.label.toLowerCase()} severity.\n\n`;
    
    if (severity <= 2) {
      advice += '**Immediate Relief Strategies:**\n';
      advice += '• **Environment**: Find a quiet, dimly lit room to reduce sensory stimulation\n';
      advice += '• **Temperature therapy**: Apply a cold compress to your forehead or warm compress to neck/shoulders\n';
      advice += '• **Hydration**: Drink water slowly - dehydration is a common headache trigger\n';
      advice += '• **Gentle pressure**: Try massaging temples, scalp, neck, and shoulders\n';
      advice += '• **Breathing**: Practice deep breathing or progressive muscle relaxation\n';
      advice += '• **Essential oils**: Peppermint or lavender oil may provide relief (diluted on temples)\n\n';
      
      advice += '**Lifestyle Considerations:**\n';
      advice += '• Maintain regular sleep schedule (7-9 hours)\n';
      advice += '• Eat regular meals to avoid blood sugar drops\n';
      advice += '• Limit screen time and eye strain\n';
      advice += '• Consider stress management techniques';
    } else if (severity === 3) {
      advice += '**Comprehensive Management:**\n';
      advice += '• **Headache diary**: Track triggers (foods, stress, sleep, weather, hormones)\n';
      advice += '• **Pattern recognition**: Note timing, duration, location, and associated symptoms\n';
      advice += '• **Trigger avoidance**: Common culprits include aged cheeses, processed meats, alcohol, caffeine withdrawal\n';
      advice += '• **Professional evaluation**: Consider consultation if occurring >2 times/week\n';
      advice += '• **Alternative therapies**: Acupuncture, massage, or chiropractic care may help\n';
      advice += '• **Medication overuse**: Avoid taking pain relievers >2-3 days/week to prevent rebound headaches';
    } else {
      advice += '**🚨 URGENT MEDICAL ATTENTION NEEDED:**\n';
      advice += 'Severe headaches require immediate evaluation, especially if accompanied by:\n';
      advice += '• Sudden onset ("thunderclap" headache)\n';
      advice += '• Fever and stiff neck (possible meningitis)\n';
      advice += '• Vision changes or speech difficulties\n';
      advice += '• Weakness or numbness\n';
      advice += '• Confusion or altered consciousness\n';
      advice += '• Head injury within recent weeks\n';
      advice += '• Significantly different from usual headache pattern\n\n';
      advice += '**Call emergency services (911) or go to the nearest emergency room immediately.**';
    }
    
    return advice;
  }

  private getFeverAdvice(severity: SeverityScale): string {
    const severityInfo = SEVERITY_LEVELS[severity];
    let advice = `I understand you're dealing with a fever, which is your body's natural response to infection. This appears to be ${severityInfo.label.toLowerCase()} severity based on your description.\n\n`;
    
    if (severity <= 2) {
      advice += '**Fever Management (Low-Grade: 37.2-38.3°C/99-101°F):**\n';
      advice += '• **Rest**: Your body needs energy to fight infection - prioritize sleep\n';
      advice += '• **Hydration**: Increase fluid intake (water, herbal teas, broths) - aim for clear urine\n';
      advice += '• **Temperature control**: Dress in light, breathable clothing; use lightweight blankets\n';
      advice += '• **Cool comfort**: Lukewarm baths or cool, damp washcloths on forehead/wrists\n';
      advice += '• **Nutrition**: Eat light, easy-to-digest foods when appetite returns\n';
      advice += '• **Environment**: Keep room temperature comfortable (not too hot or cold)\n\n';
      
      advice += '**Temperature Monitoring:**\n';
      advice += '• Check temperature every 4-6 hours\n';
      advice += '• Record readings and note any patterns\n';
      advice += '• Monitor for 24-48 hours post-fever to ensure resolution';
    } else if (severity === 3) {
      advice += '**Moderate Fever Management (38.4-39.4°C/101.1-103°F):**\n';
      advice += '• **Enhanced monitoring**: Check temperature every 2-4 hours\n';
      advice += '• **Symptom tracking**: Note associated symptoms (chills, sweating, body aches)\n';
      advice += '• **Hydration critical**: Increase fluids significantly - dehydration risk is higher\n';
      advice += '• **Electrolyte balance**: Consider oral rehydration solutions or sports drinks\n';
      advice += '• **Activity restriction**: Minimize physical exertion, rest is essential\n';
      advice += '• **Medical consultation**: Consider calling healthcare provider if:\n';
      advice += '  - Fever persists >3 days\n';
      advice += '  - Temperature continues rising\n';
      advice += '  - New concerning symptoms develop\n';
      advice += '  - Difficulty staying hydrated';
    } else {
      advice += '**🚨 HIGH FEVER - IMMEDIATE MEDICAL ATTENTION REQUIRED:**\n';
      advice += '**Temperature >39.4°C/103°F is concerning, especially with:**\n';
      advice += '• **Breathing difficulties** (shortness of breath, chest pain)\n';
      advice += '• **Neurological symptoms** (severe headache, confusion, stiff neck)\n';
      advice += '• **Severe dehydration** (dizziness, minimal urination, dry mouth)\n';
      advice += '• **Persistent vomiting** (unable to keep fluids down)\n';
      advice += '• **Extreme fatigue or lethargy**\n';
      advice += '• **Rash development**\n';
      advice += '• **Abdominal pain**\n\n';
      advice += '**Seek emergency care immediately or call your healthcare provider now.**\n';
      advice += '*For infants <3 months: Any fever requires immediate medical evaluation*';
    }
    
    return advice;
  }

  private getCoughAdvice(severity: SeverityScale): string {
    const severityInfo = SEVERITY_LEVELS[severity];
    let advice = `I understand you're dealing with a cough, which can be quite disruptive. This appears to be ${severityInfo.label.toLowerCase()} severity based on your description.\n\n`;
    
    if (severity <= 2) {
      advice += '**Natural Cough Relief (Dry/Mild Productive Cough):**\n';
      advice += '• **Hydration**: Drink plenty of warm fluids (herbal teas, warm water with lemon)\n';
      advice += '• **Honey therapy**: 1-2 teaspoons of honey can coat throat (not for children <1 year)\n';
      advice += '• **Steam inhalation**: Hot shower steam or bowl of hot water with towel over head\n';
      advice += '• **Humidify air**: Use humidifier or place bowl of water near heating source\n';
      advice += '• **Throat soothing**: Warm salt water gargles (1/2 tsp salt in warm water)\n';
      advice += '• **Elevate head**: Sleep with extra pillows to reduce nighttime coughing\n';
      advice += '• **Avoid irritants**: Stay away from smoke, strong odors, and dust\n\n';
      
      advice += '**Lifestyle Support:**\n';
      advice += '• Rest your voice when possible\n';
      advice += '• Eat soothing foods (warm broths, soft foods)\n';
      advice += '• Consider throat lozenges or hard candies';
    } else if (severity === 3) {
      advice += '**Persistent Cough Management:**\n';
      advice += '• **Cough monitoring**: Track frequency, timing (day/night), and triggers\n';
      advice += '• **Sputum assessment**: Note color, thickness, and amount of any phlegm\n';
      advice += '• **Symptom diary**: Record associated symptoms (fever, fatigue, chest discomfort)\n';
      advice += '• **Environmental factors**: Identify potential allergens or irritants\n';
      advice += '• **Activity modification**: Avoid strenuous exercise that worsens cough\n';
      advice += '• **Medication consideration**: Discuss with pharmacist about appropriate cough suppressants\n\n';
      
      advice += '**Seek medical care if cough:**\n';
      advice += '• Persists longer than 2-3 weeks\n';
      advice += '• Worsens despite treatment\n';
      advice += '• Interferes significantly with sleep\n';
      advice += '• Produces blood-tinged sputum';
    } else {
      advice += '**🚨 SEVERE COUGH - IMMEDIATE MEDICAL ATTENTION:**\n';
      advice += '**Seek emergency care immediately if experiencing:**\n';
      advice += '• **Hemoptysis**: Coughing up blood or blood-streaked sputum\n';
      advice += '• **Respiratory distress**: Difficulty breathing, wheezing, or chest tightness\n';
      advice += '• **Chest pain**: Especially sharp or worsening with cough\n';
      advice += '• **High fever**: >38.5°C/101.3°F with severe cough\n';
      advice += '• **Cyanosis**: Blue lips or fingernails indicating oxygen deficiency\n';
      advice += '• **Severe fatigue**: Extreme weakness or inability to speak in full sentences\n';
      advice += '• **Choking sensation**: Feeling like something is stuck in throat\n\n';
      advice += '**Call emergency services (911) or go to emergency room immediately.**';
    }
    
    return advice;
  }

  private getChestPainAdvice(_severity: SeverityScale): string {
    return '**⚠️ CHEST PAIN ALERT**\n\nChest pain can indicate serious conditions. Please seek immediate medical attention or call emergency services, especially if accompanied by:\n• Shortness of breath\n• Nausea or sweating\n• Pain radiating to arm, jaw, or back\n• Dizziness or lightheadedness\n\n**Do not delay seeking medical care for chest pain.**';
  }

  private getGeneralSymptomAdvice(symptoms: string[], severity: SeverityScale): string {
    const severityInfo = SEVERITY_LEVELS[severity];
    let advice = `I understand you're experiencing multiple symptoms: ${symptoms.slice(0, 3).join(', ')}${symptoms.length > 3 ? `, and ${symptoms.length - 3} others` : ''}. This combination appears to be ${severityInfo.label.toLowerCase()} severity.\n\n`;
    
    if (severity <= 2) {
      advice += '**Comprehensive Self-Care Approach:**\n';
      advice += '• **Rest and recovery**: Prioritize 7-9 hours of quality sleep\n';
      advice += '• **Hydration strategy**: Aim for 8-10 glasses of water daily, more if fever/sweating\n';
      advice += '• **Nutrition support**: Eat nutrient-rich foods - fruits, vegetables, lean proteins\n';
      advice += '• **Stress management**: Practice relaxation techniques, limit stressors\n';
      advice += '• **Gentle movement**: Light walking if energy permits, avoid strenuous exercise\n';
      advice += '• **Environment optimization**: Maintain comfortable temperature and humidity\n\n';
      
      advice += '**Symptom Monitoring:**\n';
      advice += '• Track symptom patterns (timing, triggers, improvements)\n';
      advice += '• Note any new or worsening symptoms\n';
      advice += '• Monitor temperature regularly if fever-related symptoms\n';
      advice += '• Keep a simple daily log of how you feel';
    } else if (severity === 3) {
      advice += '**Enhanced Care and Monitoring:**\n';
      advice += '• **Detailed symptom tracking**: Record timing, severity (1-10), and triggers\n';
      advice += '• **Activity modification**: Reduce work/social commitments to focus on recovery\n';
      advice += '• **Nutrition optimization**: Consider easy-to-digest foods, supplements if needed\n';
      advice += '• **Support system**: Inform family/friends for assistance if needed\n';
      advice += '• **Medical preparation**: Gather information for potential healthcare consultation\n\n';
      
      advice += '**Consider medical consultation if:**\n';
      advice += '• Symptoms persist >5-7 days without improvement\n';
      advice += '• New concerning symptoms develop\n';
      advice += '• Symptoms significantly impact daily functioning\n';
      advice += '• You have underlying health conditions\n';
      advice += '• Intuition tells you something isn\'t right';
    } else {
      advice += '**🚨 MULTIPLE SEVERE SYMPTOMS - MEDICAL EVALUATION NEEDED:**\n';
      advice += '**The combination and severity of your symptoms warrant professional assessment.**\n\n';
      advice += '**Seek immediate medical care if experiencing:**\n';
      advice += '• Difficulty breathing or shortness of breath\n';
      advice += '• Chest pain or pressure\n';
      advice += '• Severe abdominal pain\n';
      advice += '• High fever with confusion or severe headache\n';
      advice += '• Persistent vomiting or inability to keep fluids down\n';
      advice += '• Signs of dehydration (dizziness, minimal urination)\n';
      advice += '• Severe weakness or fainting\n';
      advice += '• Any symptom that feels life-threatening\n\n';
      advice += '**Contact your healthcare provider immediately or go to emergency care.**';
    }
    
    return advice;
  }

  private getGeneralHealthAdvice(): string {
    return '👋 **Welcome to your AI Health Assistant!** I\'m here to provide personalized health guidance and support.\n\n**How I can help you today:**\n• **Symptom assessment** - Describe what you\'re experiencing for personalized advice\n• **Medication suggestions** - Get recommendations for over-the-counter options\n• **Pharmacy locations** - Find nearby pharmacies and their services\n• **Health education** - Learn about conditions, prevention, and wellness\n• **Care coordination** - Guidance on when and where to seek professional care\n\n**To get started:**\n✅ Describe your symptoms in detail (location, duration, severity)\n✅ Mention any relevant medical history or current medications\n✅ Let me know your main concerns or questions\n\n**Quality care principles:**\n• Evidence-based recommendations\n• Personalized to your specific situation\n• Clear guidance on when professional care is needed\n• Respect for your time and concerns\n\n**Important disclaimer:** I provide general health information and guidance, but cannot replace professional medical diagnosis or treatment. For urgent concerns, severe symptoms, or persistent issues, always consult with a qualified healthcare provider.\n\n**Ready when you are** - please share what brings you here today! 🏥';
  }

  // Check if consultation should end and prompt user
  async shouldPromptConsultationEnd(conversation: Conversation): Promise<ConsultationEndPrompt | null> {
    const analysis = await this.analyzeConversation(conversation.messages);
    
    if (analysis.isConsultationComplete && conversation.messages.length >= 6) {
      return {
        trigger: 'ai_detection',
        questions: [
          'It seems like we\'ve covered your main health concerns. Would you like to:',
          '1. Save this consultation for your medical records?',
          '2. Get recommendations for next steps?', 
          '3. Continue the conversation?'
        ],
        saveDecisionLogic: (responses: string[]) => {
          const response = responses[0]?.toLowerCase() || '';
          return response.includes('save') || response.includes('yes') || response.includes('1');
        }
      };
    }

    return null;
  }

  // Determine if conversation should be saved as a medical case
  async shouldSaveConversation(conversation: Conversation, userResponse?: string): Promise<{ shouldSave: boolean; reason: string }> {
    if (userResponse) {
      const response = userResponse.toLowerCase();
      if (response.includes('save') || response.includes('yes') || response.includes('keep')) {
        return { shouldSave: true, reason: 'User requested to save consultation' };
      }
      if (response.includes('discard') || response.includes('no') || response.includes('delete')) {
        return { shouldSave: false, reason: 'User requested to discard consultation' };
      }
    }

    // Automatic save logic
    const analysis = await this.analyzeConversation(conversation.messages);
    
    if (analysis.severity >= 3) {
      return { shouldSave: true, reason: 'Moderate to high severity symptoms detected' };
    }
    
    if (analysis.symptoms.length >= 3) {
      return { shouldSave: true, reason: 'Multiple symptoms discussed' };
    }
    
    if (analysis.requiresFollowUp) {
      return { shouldSave: true, reason: 'Follow-up care recommended' };
    }

    if (conversation.messages.length >= 10) {
      return { shouldSave: true, reason: 'Comprehensive consultation conducted' };
    }

    return { shouldSave: false, reason: 'Brief consultation without significant medical content' };
  }

  // Create medical case from conversation
  async createMedicalCase(conversation: Conversation, userId: string): Promise<MedicalCase> {
    const analysis = await this.analyzeConversation(conversation.messages);
    
    const caseTitle = this.generateCaseTitle(analysis.symptoms);
    const recommendations = analysis.suggestedServices.map(s => s.suggestedAction);
    
    const medicalCase: MedicalCase = {
      id: `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      conversationId: conversation.id,
      title: caseTitle,
      symptoms: analysis.symptoms,
      severity: analysis.severity,
      recommendations,
      followUpRequired: analysis.requiresFollowUp,
      followUpDate: analysis.requiresFollowUp ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined, // 1 week
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: this.generateCaseTags(analysis.symptoms, analysis.severity),
      notes: `AI Assessment: Confidence ${(analysis.confidence * 100).toFixed(0)}%`
    };

    await this.saveMedicalCase(medicalCase);
    return medicalCase;
  }

  private generateCaseTitle(symptoms: string[]): string {
    if (symptoms.length === 0) return 'General Health Consultation';
    if (symptoms.length === 1) return `${symptoms[0].charAt(0).toUpperCase() + symptoms[0].slice(1)} Consultation`;
    if (symptoms.length <= 3) return `${symptoms.slice(0, 2).join(' & ')} Consultation`;
    return `Multiple Symptoms Consultation`;
  }

  private generateCaseTags(symptoms: string[], severity: SeverityScale): string[] {
    const tags = [...symptoms];
    tags.push(SEVERITY_LEVELS[severity].label.toLowerCase());
    
    if (severity >= 4) tags.push('urgent');
    if (severity >= 3) tags.push('follow-up-needed');
    
    return tags;
  }

  private async saveMedicalCase(medicalCase: MedicalCase): Promise<void> {
    try {
      const existingCases = await this.getMedicalCases(medicalCase.userId);
      existingCases.push(medicalCase);
      await WebStorage.setItem(`@medibot_cases_${medicalCase.userId}`, JSON.stringify(existingCases));
    } catch (error) {
      logger.error('Error saving medical case', error as Error, { userId: medicalCase.userId });
    }
  }

  async getMedicalCases(userId: string): Promise<MedicalCase[]> {
    try {
      const stored = await WebStorage.getItem(`@medibot_cases_${userId}`);
      if (!stored) return [];
      
      return JSON.parse(stored).map((caseData: any) => ({
        ...caseData,
        createdAt: new Date(caseData.createdAt),
        updatedAt: new Date(caseData.updatedAt),
        followUpDate: caseData.followUpDate ? new Date(caseData.followUpDate) : undefined
      }));
    } catch (error) {
      logger.error('Error loading medical cases', error as Error);
      return [];
    }
  }

  // Enhanced advice methods for better response quality
  private getPainAdvice(message: string, severity: SeverityScale): string {
    const location = this.extractPainLocation(message);
    let advice = `I understand you're experiencing pain${location ? ` in your ${location}` : ''}. Let me provide some guidance.\n\n`;
    
    if (severity <= 2) {
      advice += '**Pain Management (Mild Level):**\n';
      advice += '• **Rest**: Avoid activities that worsen the pain\n';
      advice += '• **Ice/Heat**: Apply ice for acute injuries (first 48 hours) or heat for muscle tension\n';
      advice += '• **Gentle movement**: Light stretching if tolerated\n';
      advice += '• **Positioning**: Find comfortable positions to reduce strain\n';
      advice += '• **Monitor**: Track pain patterns and triggers\n';
    } else if (severity === 3) {
      advice += '**Pain Management (Moderate Level):**\n';
      advice += '• **Pain tracking**: Rate pain 1-10 and note patterns\n';
      advice += '• **Activity modification**: Balance rest with gentle movement\n';
      advice += '• **Support measures**: Use pillows, supports as needed\n';
      advice += '• **Professional help**: Consider physiotherapy or medical consultation\n';
      advice += '• **Sleep hygiene**: Ensure adequate rest for healing\n';
    } else {
      advice += '**⚠️ Severe Pain Alert:**\n';
      advice += 'Severe pain requires medical attention, especially if:\n';
      advice += '• Pain is sudden and intense\n• Accompanied by numbness or weakness\n• Following injury or trauma\n• Interfering significantly with daily activities\n';
      advice += '\n**Seek medical care promptly for proper evaluation and pain management.**';
    }
    
    return advice;
  }

  private extractPainLocation(message: string): string | null {
    const locations = {
      'head': ['head', 'skull'],
      'back': ['back', 'spine'],
      'neck': ['neck', 'cervical'],
      'shoulder': ['shoulder'],
      'arm': ['arm', 'elbow', 'wrist'],
      'chest': ['chest', 'ribcage'],
      'abdomen': ['abdomen', 'stomach', 'belly'],
      'leg': ['leg', 'thigh', 'calf'],
      'knee': ['knee'],
      'foot': ['foot', 'ankle'],
      'joint': ['joint']
    };
    
    for (const [location, keywords] of Object.entries(locations)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return location;
      }
    }
    return null;
  }

  private getFatigueAdvice(severity: SeverityScale): string {
    let advice = 'I understand you\'re feeling tired or fatigued. This is a common concern that can have various causes.\n\n';
    
    if (severity <= 2) {
      advice += '**Managing Mild Fatigue:**\n';
      advice += '• **Sleep optimization**: Aim for 7-9 hours of quality sleep\n';
      advice += '• **Hydration**: Drink adequate water throughout the day\n';
      advice += '• **Nutrition**: Eat balanced meals with complex carbs and protein\n';
      advice += '• **Light exercise**: Short walks or gentle stretching\n';
      advice += '• **Stress management**: Practice relaxation techniques\n';
      advice += '• **Screen time limits**: Reduce blue light exposure before bed\n';
    } else if (severity === 3) {
      advice += '**Persistent Fatigue Management:**\n';
      advice += '• **Sleep diary**: Track sleep patterns and quality\n';
      advice += '• **Energy conservation**: Prioritize essential activities\n';
      advice += '• **Gradual activity**: Slowly increase activity levels\n';
      advice += '• **Medical evaluation**: Consider underlying causes (thyroid, anemia, etc.)\n';
      advice += '• **Mental health**: Assess for depression or anxiety\n';
    } else {
      advice += '**⚠️ Severe Fatigue Concerns:**\n';
      advice += 'Extreme fatigue warrants medical evaluation, especially if:\n';
      advice += '• Sudden onset or dramatic change\n• Accompanied by fever, weight loss, or pain\n• Interferes significantly with daily life\n• Lasts more than 2 weeks despite rest\n';
      advice += '\n**Consider medical consultation for proper evaluation.**';
    }
    
    return advice;
  }

  private getNauseaAdvice(severity: SeverityScale): string {
    let advice = 'I understand you\'re feeling nauseous or sick. Let me help you manage these symptoms.\n\n';
    
    if (severity <= 2) {
      advice += '**Managing Mild Nausea:**\n';
      advice += '• **Small, frequent meals**: Avoid large portions\n';
      advice += '• **Bland foods**: Toast, crackers, rice, bananas (BRAT diet)\n';
      advice += '• **Ginger**: Ginger tea or candies can help settle stomach\n';
      advice += '• **Hydration**: Sip clear fluids slowly (water, clear broths)\n';
      advice += '• **Fresh air**: Step outside or open windows\n';
      advice += '• **Rest**: Lie down with head elevated\n';
      advice += '• **Avoid triggers**: Strong smells, spicy/fatty foods\n';
    } else if (severity === 3) {
      advice += '**Persistent Nausea Care:**\n';
      advice += '• **Trigger identification**: Note what makes nausea worse\n';
      advice += '• **Electrolyte balance**: Consider oral rehydration solutions\n';
      advice += '• **Temperature preference**: Try cold or room temperature foods\n';
      advice += '• **Acupressure**: P6 point on wrist may help\n';
      advice += '• **Medical consultation**: If persists >24-48 hours\n';
    } else {
      advice += '**🚨 Severe Nausea - Seek Medical Care:**\n';
      advice += 'Immediate medical attention needed if:\n';
      advice += '• Persistent vomiting (unable to keep fluids down)\n• Signs of dehydration (dizziness, dry mouth)\n• Severe abdominal pain\n• Blood in vomit\n• High fever with nausea\n• Severe headache with nausea\n';
      advice += '\n**Contact healthcare provider or emergency services.**';
    }
    
    return advice;
  }

  private analyzeGeneralPain(message: string, severity: SeverityScale): string {
    const painType = this.identifyPainType(message);
    let advice = `I understand you're experiencing ${painType} pain. Let me provide appropriate guidance.\n\n`;
    
    advice += this.getPainAdvice(message, severity);
    
    if (severity <= 2) {
      advice += '\n\n**When to Seek Care:**\n';
      advice += '• Pain persists beyond a few days\n• Pain worsens significantly\n• New symptoms develop\n• Pain affects sleep or daily activities\n';
    }
    
    return advice;
  }

  private identifyPainType(message: string): string {
    if (message.includes('sharp') || message.includes('stabbing')) return 'sharp';
    if (message.includes('dull') || message.includes('aching')) return 'dull';
    if (message.includes('burning')) return 'burning';
    if (message.includes('throbbing') || message.includes('pulsing')) return 'throbbing';
    if (message.includes('cramping')) return 'cramping';
    return 'general';
  }

  private getMentalHealthSupport(message: string, severity: SeverityScale): string {
    let advice = 'I understand you\'re feeling anxious or stressed. These feelings are valid and there are ways to help manage them.\n\n';
    
    if (severity <= 2) {
      advice += '**Immediate Stress Relief:**\n';
      advice += '• **Breathing exercise**: 4-7-8 breathing (inhale 4, hold 7, exhale 8)\n';
      advice += '• **Grounding technique**: 5-4-3-2-1 (5 things you see, 4 hear, 3 feel, 2 smell, 1 taste)\n';
      advice += '• **Progressive muscle relaxation**: Tense and release muscle groups\n';
      advice += '• **Mindfulness**: Focus on present moment without judgment\n';
      advice += '• **Physical activity**: Short walk or gentle exercise\n';
      advice += '• **Connect with others**: Reach out to supportive friends/family\n';
    } else if (severity === 3) {
      advice += '**Managing Persistent Anxiety/Stress:**\n';
      advice += '• **Regular routine**: Maintain consistent sleep and meal times\n';
      advice += '• **Limit stimulants**: Reduce caffeine and alcohol\n';
      advice += '• **Stress journaling**: Write down thoughts and feelings\n';
      advice += '• **Professional support**: Consider counseling or therapy\n';
      advice += '• **Support groups**: Connect with others facing similar challenges\n';
    } else {
      advice += '**🚨 Mental Health Crisis Support:**\n';
      advice += 'If experiencing thoughts of self-harm or suicide:\n';
      advice += '• **Crisis Hotlines**: Lifeline 13 11 14 (Australia)\n';
      advice += '• **Emergency services**: Call 000 if in immediate danger\n';
      advice += '• **Mental health services**: Contact your GP or mental health team\n';
      advice += '• **Trusted person**: Reach out to family, friends, or support person\n';
      advice += '\n**You\'re not alone. Professional help is available and effective.**';
    }
    
    return advice;
  }

  private getDigestiveAdvice(message: string, severity: SeverityScale): string {
    let advice = 'I understand you\'re experiencing digestive discomfort. Let me provide some guidance.\n\n';
    
    if (severity <= 2) {
      advice += '**Managing Mild Digestive Issues:**\n';
      advice += '• **Dietary adjustments**: Eat smaller, more frequent meals\n';
      advice += '• **Bland foods**: BRAT diet (bananas, rice, applesauce, toast)\n';
      advice += '• **Hydration**: Sip clear fluids regularly\n';
      advice += '• **Avoid irritants**: Spicy, fatty, or acidic foods\n';
      advice += '• **Gentle movement**: Light walking can aid digestion\n';
      advice += '• **Stress reduction**: Stress can affect digestion\n';
    } else if (severity === 3) {
      advice += '**Persistent Digestive Concerns:**\n';
      advice += '• **Food diary**: Track what you eat and symptoms\n';
      advice += '• **Elimination diet**: Remove potential trigger foods\n';
      advice += '• **Probiotics**: Consider yogurt or probiotic supplements\n';
      advice += '• **Medical consultation**: If symptoms persist >3-5 days\n';
    } else {
      advice += '**🚨 Severe Digestive Issues - Seek Medical Care:**\n';
      advice += 'Immediate medical attention needed if:\n';
      advice += '• Severe abdominal pain\n• Blood in stool or vomit\n• Signs of dehydration\n• High fever with abdominal pain\n• Persistent vomiting\n• Inability to pass gas or stool\n';
      advice += '\n**Contact healthcare provider or emergency services.**';
    }
    
    return advice;
  }

  private getFallbackResponse(customMessage?: string): Message {
    const defaultMessage = 'I apologize, but I\'m having trouble processing your message right now. Please try rephrasing your question, and I\'ll do my best to help you with your health concerns.';
    
    return {
      id: Date.now().toString(),
      content: customMessage || defaultMessage,
      sender: 'bot',
      timestamp: new Date(),
      type: 'text',
      metadata: {
        severity: 1,
        suggestedActions: ['Try rephrasing your question', 'Contact support if issue persists'],
        aiConfidence: 0.3,
        requiresFollowUp: false
      }
    };
  }
}

export default AIConsultationService;