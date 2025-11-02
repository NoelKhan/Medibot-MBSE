import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AIAgentChatService, ChatTriageDto, TriageResponseDto } from './ai-agent-chat.service';

// ⚠️ TEMPORARY: Auth disabled for testing - REMOVE IN PRODUCTION
@ApiTags('AI Chat')
@Controller('ai-chat')
export class AIAgentChatController {
  constructor(private readonly aiAgentChatService: AIAgentChatService) {}

  @Post('chat/triage')
  @ApiOperation({ summary: 'Run conversational medical triage' })
  async chatTriage(
    @Body() chatDto: ChatTriageDto,
  ): Promise<TriageResponseDto> {
    try {
      // ⚠️ TEMPORARY: Using test user ID - REMOVE IN PRODUCTION
      const userId = 'test-user-' + Date.now().toString();
      return await this.aiAgentChatService.runConversationalTriage(
        userId,
        chatDto,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Triage failed',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('chat/history/:limit')
  @ApiOperation({ summary: 'Get conversation history' })
  async getChatHistory(
    @Param('limit') limit: number = 10,
  ): Promise<any[]> {
    // ⚠️ TEMPORARY: Using test user ID - REMOVE IN PRODUCTION
    const userId = 'test-user-demo';
    return await this.aiAgentChatService.getConversationHistory(
      userId,
      limit,
    );
  }

  @Post('chat/clear')
  @ApiOperation({ summary: 'Clear conversation history' })
  async clearChatHistory(): Promise<{ message: string }> {
    // ⚠️ TEMPORARY: Using test user ID - REMOVE IN PRODUCTION
    const userId = 'test-user-demo';
    await this.aiAgentChatService.clearConversationHistory(userId);
    return { message: 'Conversation history cleared' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check AI Agent health' })
  async checkHealth(): Promise<{ status: string; aiAgent: string }> {
    const aiHealth = await this.aiAgentChatService.checkAIAgentHealth();
    return {
      status: 'ok',
      aiAgent: aiHealth ? 'connected' : 'disconnected',
    };
  }
}
