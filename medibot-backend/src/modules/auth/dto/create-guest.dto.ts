/**
 * Create Guest User DTO
 * =====================
 * Minimal info for guest users
 */

import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGuestDto {
  @ApiProperty({
    example: 'Guest User',
    description: 'Display name for guest',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    example: 'guest@temp.com',
    description: 'Optional email for guest',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
