import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { AIAgentService } from './ai-agent.service';
import { ChatRequestDto } from './dto/ai-agent.dto';

@Controller('ai')
export class AIAgentController {
  private readonly logger = new Logger(AIAgentController.name);

  constructor(private readonly aiAgentService: AIAgentService) {}

  /**
   * Process chat message through AI Agent
   * POST /api/ai/chat
   * No auth required - allows anonymous web access
   */
  @Post('chat')
  async chat(@Body() dto: ChatRequestDto) {
    // Use provided userId or generate anonymous ID
    const userId = dto.userId || 'anonymous-' + Date.now();
    this.logger.log(`Chat request from user ${userId}`);
    
    dto.userId = userId;
    
    return await this.aiAgentService.processChat(dto);
  }

  /**
   * Quick triage assessment
   * POST /api/ai/triage
   * No auth required
   */
  @Post('triage')
  async triage(@Body() body: { message: string; userId?: string }) {
    const userId = body.userId || 'anonymous-' + Date.now();
    return await this.aiAgentService.quickTriage(body.message, userId);
  }

  /**
   * Get user's triage cases
   * GET /api/ai/cases?status=active&userId=xxx
   */
  @Get('cases')
  async getTriageCases(@Query('userId') userId?: string, @Query('status') status?: string) {
    if (!userId) {
      return { cases: [], message: 'No userId provided' };
    }
    return await this.aiAgentService.getTriageCases(userId, status);
  }

  /**
   * Get specific triage case
   * GET /api/ai/cases/:id
   */
  @Get('cases/:id')
  async getTriageCase(@Param('id') id: string) {
    return await this.aiAgentService.getTriageCase(id);
  }

  /**
   * Get all emergency cases (RED severity)
   * GET /api/ai/emergencies
   * Public endpoint - for monitoring
   */
  @Get('emergencies')
  async getEmergencyCases() {
    return await this.aiAgentService.getEmergencyCases();
  }

  /**
   * AI Agent health check
   * GET /api/ai/health
   */
  @Get('health')
  async healthCheck() {
    return await this.aiAgentService.healthCheck();
  }
}
