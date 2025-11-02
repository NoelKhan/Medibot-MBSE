/**
 * Chat Service
 * =============
 * Handles AI-powered medical chat conversations
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, ConversationStatus } from './entities/conversation.entity';
import { Message, MessageSender, MessageType } from './entities/message.entity';
import { SymptomAnalysis, SeverityLevel, SentimentType } from './entities/symptom-analysis.entity';
import { SendMessageDto, AnalyzeSymptomsDto, UpdateConversationDto } from './dto/chat.dto';

interface SmartAnalysisResult {
  symptoms: string[];
  severity: SeverityLevel;
  bodyParts: string[];
  duration: string | null;
  triggers: string[];
  sentiment: SentimentType;
  medicalTerms: string[];
}

@Injectable()
export class ChatService {
  // Medical knowledge base
  private readonly symptoms = {
    pain: ['ache', 'hurt', 'pain', 'sore', 'tender', 'throbbing', 'stabbing', 'burning'],
    respiratory: ['cough', 'breathing', 'shortness of breath', 'wheezing', 'congestion'],
    digestive: ['nausea', 'vomiting', 'stomach', 'belly', 'diarrhea', 'constipation'],
    neurological: ['headache', 'dizzy', 'confusion', 'memory', 'numbness', 'tingling'],
    cardiac: ['chest pain', 'heart', 'palpitations', 'irregular heartbeat'],
    emergency: ['chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious', 'stroke'],
  };

  private readonly bodyParts = [
    'head', 'neck', 'chest', 'back', 'arm', 'leg', 'stomach', 'abdomen',
    'shoulder', 'knee', 'ankle', 'wrist', 'throat', 'eye', 'ear', 'nose',
  ];

  private readonly severityIndicators = {
    emergency: ['severe', 'intense', 'unbearable', "can't breathe", 'crushing', 'worst ever'],
    high: ['very', 'really bad', 'terrible', 'awful', 'extreme'],
    moderate: ['moderate', 'noticeable', 'bothering', 'concerning'],
    low: ['mild', 'slight', 'little', 'minor', 'barely'],
  };

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(SymptomAnalysis)
    private symptomAnalysisRepository: Repository<SymptomAnalysis>,
  ) {}

  /**
   * Send message and get AI response
   */
  async sendMessage(userId: string, dto: SendMessageDto): Promise<{ userMessage: Message; aiMessage: Message }> {
    // Get or create conversation
    let conversation: Conversation;
    
    if (dto.conversationId) {
      conversation = await this.conversationRepository.findOne({
        where: { id: dto.conversationId, userId },
        relations: ['messages'],
      });
      
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
    } else {
      // Create new conversation
      conversation = this.conversationRepository.create({
        userId,
        title: this.generateConversationTitle(dto.content),
        status: ConversationStatus.ACTIVE,
      });
      conversation = await this.conversationRepository.save(conversation);
    }

    // Save user message
    const userMessage = this.messageRepository.create({
      conversationId: conversation.id,
      sender: MessageSender.USER,
      content: dto.content,
      messageType: dto.messageType || MessageType.TEXT,
      metadata: dto.metadata,
    });
    await this.messageRepository.save(userMessage);

    // Analyze symptoms
    const analysis = await this.analyzeUserInput(dto.content, conversation.messages || []);

    // Save symptom analysis
    if (analysis.symptoms.length > 0) {
      const symptomAnalysis = this.symptomAnalysisRepository.create({
        messageId: userMessage.id,
        symptoms: analysis.symptoms,
        severity: analysis.severity,
        bodyParts: analysis.bodyParts,
        duration: analysis.duration,
        triggers: analysis.triggers,
        sentiment: analysis.sentiment,
        medicalTerms: analysis.medicalTerms,
      });
      await this.symptomAnalysisRepository.save(symptomAnalysis);
    }

    // Generate AI response
    const aiContent = this.generateAIResponse(dto.content, analysis, conversation.messages || []);
    
    const aiMessage = this.messageRepository.create({
      conversationId: conversation.id,
      sender: MessageSender.AI,
      content: aiContent,
      messageType: MessageType.TEXT,
      metadata: {
        analysis,
        requiresFollowUp: analysis.severity !== SeverityLevel.LOW,
      },
    });
    await this.messageRepository.save(aiMessage);

    // Update conversation last message time
    conversation.lastMessageAt = new Date();
    if (!conversation.title || conversation.title === 'New Conversation') {
      conversation.title = this.generateConversationTitle(dto.content);
    }
    await this.conversationRepository.save(conversation);

    return { userMessage, aiMessage };
  }

  /**
   * Analyze user input for medical context
   */
  async analyzeSymptoms(dto: AnalyzeSymptomsDto): Promise<SmartAnalysisResult> {
    return this.analyzeUserInput(dto.content, []);
  }

  /**
   * Get user conversations
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { userId },
      relations: ['messages'],
      order: { lastMessageAt: 'DESC' },
    });
  }

  /**
   * Get conversation by ID
   */
  async getConversation(userId: string, conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, userId },
      relations: ['messages', 'messages.symptomAnalysis'],
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  /**
   * Update conversation
   */
  async updateConversation(
    userId: string,
    conversationId: string,
    dto: UpdateConversationDto,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (dto.title) conversation.title = dto.title;
    if (dto.status) conversation.status = dto.status as ConversationStatus;

    return this.conversationRepository.save(conversation);
  }

  /**
   * Delete conversation
   */
  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.conversationRepository.remove(conversation);
  }

  // ============================================
  // Private helper methods - Medical AI Logic
  // ============================================

  private analyzeUserInput(message: string, _conversationHistory: Message[]): SmartAnalysisResult {
    const lowercaseMessage = message.toLowerCase();

    // Extract symptoms
    const symptoms: string[] = [];
    Object.values(this.symptoms)
      .flat()
      .forEach((symptom) => {
        if (lowercaseMessage.includes(symptom)) {
          symptoms.push(symptom);
        }
      });

    // Identify body parts
    const bodyParts = this.bodyParts.filter((part) => lowercaseMessage.includes(part));

    // Assess severity
    let severity: SeverityLevel = SeverityLevel.LOW;

    if (this.severityIndicators.emergency.some((indicator) => lowercaseMessage.includes(indicator))) {
      severity = SeverityLevel.EMERGENCY;
    } else if (this.severityIndicators.high.some((indicator) => lowercaseMessage.includes(indicator))) {
      severity = SeverityLevel.HIGH;
    } else if (this.severityIndicators.moderate.some((indicator) => lowercaseMessage.includes(indicator))) {
      severity = SeverityLevel.MODERATE;
    }

    // Extract duration
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
      medicalTerms,
    };
  }

  private generateAIResponse(userInput: string, analysis: SmartAnalysisResult, history: Message[]): string {
    // Emergency response
    if (analysis.severity === SeverityLevel.EMERGENCY) {
      return this.generateEmergencyResponse(analysis);
    }

    // Build contextual response
    let response = '';

    // Greeting and acknowledgment
    if (history.length === 0) {
      response += "Hello! I'm your medical AI assistant. ";
    }

    // Acknowledge symptoms
    if (analysis.symptoms.length > 0) {
      response += `I understand you're experiencing ${analysis.symptoms.join(', ')}. `;
      
      if (analysis.bodyParts.length > 0) {
        response += `This affects your ${analysis.bodyParts.join(' and ')}. `;
      }

      if (analysis.duration) {
        response += `You mentioned this has been happening ${analysis.duration}. `;
      }
    }

    // Provide advice based on severity
    if (analysis.severity === SeverityLevel.HIGH) {
      response += `\n\n⚠️ Based on your symptoms, I recommend seeking medical attention soon. `;
      response += this.getSpecificAdvice(analysis);
    } else if (analysis.severity === SeverityLevel.MODERATE) {
      response += `\n\nThese symptoms should be monitored. `;
      response += this.getSpecificAdvice(analysis);
      response += `\n\nIf symptoms worsen or persist for more than a few days, please consult a healthcare provider.`;
    } else {
      response += `\n\n${this.getSpecificAdvice(analysis)}`;
      response += `\n\nIf you have any concerns or symptoms worsen, don't hesitate to seek medical advice.`;
    }

    // Add follow-up questions
    const followUpQuestions = this.generateFollowUpQuestions(analysis);
    if (followUpQuestions.length > 0) {
      response += `\n\nTo better assist you, could you tell me:\n`;
      followUpQuestions.forEach((q, i) => {
        response += `${i + 1}. ${q}\n`;
      });
    }

    return response;
  }

  private generateEmergencyResponse(analysis: SmartAnalysisResult): string {
    return `🚨 EMERGENCY ALERT 🚨

Based on your symptoms, this could be a medical emergency. Please:

1. Call emergency services (911) immediately
2. Do NOT wait - seek immediate medical attention
3. Do NOT drive yourself - call an ambulance or have someone take you
4. Stay calm and try to remain still

Symptoms that concern me:
${analysis.symptoms.map((s) => `• ${s}`).join('\n')}

This is a serious situation that requires immediate professional medical care. Please act now.`;
  }

  private getSpecificAdvice(analysis: SmartAnalysisResult): string {
    const advice: string[] = [];

    // Pain-specific advice
    if (analysis.symptoms.some((s) => this.symptoms.pain.includes(s))) {
      advice.push('• Rest and avoid activities that worsen the pain');
      advice.push('• Apply ice (wrapped in cloth) for 15-20 minutes if recent injury');
      advice.push('• Over-the-counter pain relievers may help (follow dosage instructions)');
    }

    // Respiratory advice
    if (analysis.symptoms.some((s) => this.symptoms.respiratory.includes(s))) {
      advice.push('• Stay hydrated by drinking plenty of fluids');
      advice.push('• Use a humidifier to ease breathing');
      advice.push('• Avoid smoke and other irritants');
      advice.push('• Rest and get adequate sleep');
    }

    // Digestive advice
    if (analysis.symptoms.some((s) => this.symptoms.digestive.includes(s))) {
      advice.push('• Stay hydrated - sip water or clear fluids frequently');
      advice.push('• Eat bland, easy-to-digest foods (rice, bananas, toast)');
      advice.push('• Avoid dairy, fatty, and spicy foods temporarily');
      advice.push('• Rest your digestive system');
    }

    // Neurological advice
    if (analysis.symptoms.some((s) => this.symptoms.neurological.includes(s))) {
      advice.push('• Rest in a quiet, dark room');
      advice.push('• Stay hydrated');
      advice.push('• Avoid screens and bright lights');
      advice.push('• Track your symptoms and triggers');
    }

    return advice.length > 0 ? `Here's what might help:\n${advice.join('\n')}` : 'Rest and monitor your symptoms carefully.';
  }

  private generateFollowUpQuestions(analysis: SmartAnalysisResult): string[] {
    const questions: string[] = [];

    if (!analysis.duration) {
      questions.push('How long have you been experiencing these symptoms?');
    }

    if (analysis.bodyParts.length === 0 && analysis.symptoms.length > 0) {
      questions.push('Can you specify where exactly you feel the discomfort?');
    }

    if (analysis.triggers.length === 0) {
      questions.push('Is there anything that makes your symptoms better or worse?');
    }

    if (analysis.severity !== SeverityLevel.LOW && questions.length < 2) {
      questions.push('Have you taken any medications or tried any treatments?');
      questions.push('Do you have any existing medical conditions or allergies?');
    }

    return questions.slice(0, 3); // Limit to 3 questions
  }

  private extractDuration(message: string): string | null {
    const durationPatterns = [
      /(\d+)\s*(day|days|week|weeks|month|months|hour|hours|minute|minutes)/i,
      /(since|for|about|around|over)\s+(\w+)/i,
      /(yesterday|today|this morning|last night|few days|couple weeks)/i,
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
      'after eating',
      'when walking',
      'during exercise',
      'at night',
      'in the morning',
      'when stressed',
      'after work',
      'when lying down',
    ];

    triggerWords.forEach((trigger) => {
      if (message.includes(trigger)) {
        triggers.push(trigger);
      }
    });

    return triggers;
  }

  private analyzeSentiment(message: string): SentimentType {
    const anxiousWords = ['worried', 'scared', 'afraid', 'panic', 'anxious'];
    const urgentWords = ['urgent', 'emergency', 'help', 'immediately', 'now'];
    const concernedWords = ['concerned', 'wondering', 'should i', 'what if'];

    if (urgentWords.some((word) => message.includes(word))) return SentimentType.URGENT;
    if (anxiousWords.some((word) => message.includes(word))) return SentimentType.ANXIOUS;
    if (concernedWords.some((word) => message.includes(word))) return SentimentType.CONCERNED;

    return SentimentType.CALM;
  }

  private extractMedicalTerms(message: string): string[] {
    const medicalTerms = [
      'diabetes',
      'hypertension',
      'asthma',
      'allergy',
      'migraine',
      'arthritis',
      'infection',
      'inflammation',
      'fracture',
      'sprain',
    ];

    return medicalTerms.filter((term) => message.toLowerCase().includes(term));
  }

  private generateConversationTitle(firstMessage: string): string {
    // Extract first few words or symptoms as title
    const words = firstMessage.split(' ').slice(0, 5).join(' ');
    return words.length > 50 ? words.substring(0, 47) + '...' : words;
  }
}

