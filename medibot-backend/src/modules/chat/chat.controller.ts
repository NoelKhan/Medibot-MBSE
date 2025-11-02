/**
 * Chat Controller
 * ===============
 * Handles chat and AI consultation endpoints
 * 
 * NOTE: Auth removed to allow anonymous web access
 * Mobile app can still send userId in request body if authenticated
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto, AnalyzeSymptomsDto, UpdateConversationDto } from './dto/chat.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @ApiOperation({ summary: 'Send message and get AI response (No auth required)' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(@Body() dto: SendMessageDto) {
    // userId is now optional in DTO - can be anonymous or from mobile app
    const userId = dto.userId || 'anonymous-' + Date.now();
    return this.chatService.sendMessage(userId, dto);
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze symptoms from text (No auth required)' })
  @ApiResponse({ status: 200, description: 'Symptom analysis complete' })
  async analyzeSymptoms(@Body() dto: AnalyzeSymptomsDto): Promise<any> {
    return this.chatService.analyzeSymptoms(dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all user conversations (Requires userId in query)' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  async getUserConversations(@Param('userId') userId?: string) {
    if (!userId) {
      return { conversations: [], message: 'No userId provided' };
    }
    return this.chatService.getUserConversations(userId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation by ID with messages' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved successfully' })
  async getConversation(@Param('id') id: string) {
    return this.chatService.getConversation(null, id);
  }

  @Put('conversations/:id')
  @ApiOperation({ summary: 'Update conversation (title, status)' })
  @ApiResponse({ status: 200, description: 'Conversation updated successfully' })
  async updateConversation(
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.chatService.updateConversation(null, id, dto);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete conversation' })
  @ApiResponse({ status: 200, description: 'Conversation deleted successfully' })
  async deleteConversation(@Param('id') id: string) {
    await this.chatService.deleteConversation(null, id);
    return { message: 'Conversation deleted successfully' };
  }
}

