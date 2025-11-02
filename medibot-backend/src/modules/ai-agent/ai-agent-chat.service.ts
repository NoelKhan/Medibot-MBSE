import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AIInteraction } from '../../database/entities/ai-interaction.entity';

// DTOs for chat triage
export interface ChatTriageDto {
  message: string;
  includeHistory?: boolean;
}

export interface TriageResponseDto {
  severity: 'unknown' | 'self_care' | 'referral' | 'urgent' | 'emergency';
  confidence: number;
  recommendation: string;
  suggestedActions: string[];
  disclaimer: string;
  needsEscalation: boolean;
  carePathway?: any;
  actionPlan?: any;
  needsMoreInfo?: boolean;
  possibleConditions?: string[];
}

@Injectable()
export class AIAgentChatService {
  private readonly aiAgentUrl: string;

  constructor(
    @InjectRepository(AIInteraction)
    private aiInteractionRepository: Repository<AIInteraction>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiAgentUrl =
      this.configService.get<string>('AI_AGENT_URL') ||
      'http://localhost:8000';
  }

  async runConversationalTriage(
    userId: string,
    chatDto: ChatTriageDto,
  ): Promise<TriageResponseDto> {
    try {
      // Get conversation history if requested
      let conversationHistory = [];
      if (chatDto.includeHistory) {
        const recentInteractions = await this.aiInteractionRepository.find({
          where: { userId },
          order: { createdAt: 'DESC' },
          take: 5,
        });

        conversationHistory = recentInteractions
          .reverse()
          .map((interaction) => ({
            user: interaction.userMessage,
            assistant: interaction.assistantResponse,
          }));
      }

      // Call AI Agent
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiAgentUrl}/api/chat/triage`, {
          patient_id: userId,
          message: chatDto.message,
          include_history: chatDto.includeHistory,
          conversation_history: conversationHistory,
        }),
      );

      const triageResult = response.data;

      // Store interaction in database
      const interaction = this.aiInteractionRepository.create({
        userId,
        userMessage: chatDto.message,
        assistantResponse: triageResult.recommendation || '',
        severity: triageResult.severity || 'unknown',
        confidence: triageResult.confidence || 0.5,
        carePathway: triageResult.care_pathway
          ? JSON.stringify(triageResult.care_pathway)
          : null,
        needsEscalation: triageResult.needs_escalation || false,
        needsMoreInfo: triageResult.needs_more_info || false,
      });

      await this.aiInteractionRepository.save(interaction);

      // Map response to DTO
      return {
        severity: triageResult.severity || 'unknown',
        confidence: triageResult.confidence || 0.5,
        recommendation: triageResult.recommendation || '',
        suggestedActions: triageResult.suggested_actions || [],
        disclaimer:
          triageResult.disclaimer ||
          'This is not medical advice. Always consult a healthcare provider.',
        needsEscalation: triageResult.needs_escalation || false,
        carePathway: triageResult.care_pathway || null,
        actionPlan: triageResult.action_plan || null,
        needsMoreInfo: triageResult.needs_more_info || false,
        possibleConditions: triageResult.possible_conditions || [],
      };
    } catch (error) {
      console.error('AI Agent triage error:', error);

      // Fallback response
      return {
        severity: 'referral',
        confidence: 0.0,
        recommendation:
          'Unable to process request. Please consult a healthcare provider.',
        suggestedActions: ['Contact your doctor', 'Visit urgent care'],
        disclaimer:
          'AI service temporarily unavailable. Please seek medical advice.',
        needsEscalation: true,
        needsMoreInfo: false,
      };
    }
  }

  async getConversationHistory(
    userId: string,
    limit: number = 10,
  ): Promise<any[]> {
    const interactions = await this.aiInteractionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return interactions.map((interaction) => ({
      id: interaction.id,
      timestamp: interaction.createdAt,
      userMessage: interaction.userMessage,
      assistantResponse: interaction.assistantResponse,
      severity: interaction.severity,
      confidence: interaction.confidence,
    }));
  }

  async clearConversationHistory(userId: string): Promise<void> {
    await this.aiInteractionRepository.delete({ userId });
  }

  async checkAIAgentHealth(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiAgentUrl}/health`, { timeout: 5000 }),
      );
      return response.data?.status === 'ok' || response.data?.status === 'healthy';
    } catch (error) {
      console.error('AI Agent health check failed:', error.message);
      return false;
    }
  }
}
