/**
 * Chat DTOs
 * =========
 * Data Transfer Objects for chat endpoints
 */

import { IsString, IsOptional, IsEnum, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../entities/message.entity';

/**
 * Send Message DTO
 */
export class SendMessageDto {
  @ApiPropertyOptional({ description: 'User ID (optional - for anonymous users)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Conversation ID (omit to create new conversation)' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiProperty({ description: 'Message content', example: 'I have a headache and fever' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ 
    description: 'Message type',
    enum: MessageType,
    default: MessageType.TEXT 
  })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Analyze Symptoms DTO
 */
export class AnalyzeSymptomsDto {
  @ApiProperty({ description: 'User message to analyze', example: 'I have a severe headache for 3 days' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;
}

/**
 * Update Conversation DTO
 */
export class UpdateConversationDto {
  @ApiPropertyOptional({ description: 'Conversation title' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ 
    description: 'Conversation status',
    enum: ['active', 'archived', 'closed']
  })
  @IsOptional()
  @IsEnum(['active', 'archived', 'closed'])
  status?: 'active' | 'archived' | 'closed';
}
