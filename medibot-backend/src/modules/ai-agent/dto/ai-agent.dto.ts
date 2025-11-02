import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({ description: 'User message or symptoms description' })
  @IsString()
  message: string;

  @ApiProperty({ required: false, description: 'Existing conversation ID' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({ required: false, description: 'User ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  includeHistory?: boolean;
}

export class TriageResponseDto {
  case_id: string;
  
  symptoms: {
    chief_complaint: string;
    duration: string;
    severity_self: string;
    age_band?: string;
    associated_symptoms: string[];
  };
  
  triage: {
    severity_level: 'GREEN' | 'AMBER' | 'RED';
    rationale: string;
    recommended_action: 'self-care' | 'referral' | 'emergency';
    red_flags_triggered: string[];
    care_instructions: string[];
    confidence?: number;
  };
  
  action: {
    type: 'self-care' | 'book_appointment' | 'emergency' | 'referral';
    specialization?: string;
    urgency: string;
    instructions: string[];
    resources: string[];
  };
  
  summary: {
    patient_summary: string;
    clinician_summary: string;
  };
  
  message: string;
  status: string;
}
