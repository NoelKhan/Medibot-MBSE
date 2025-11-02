import { IsString, IsArray, IsInt, Min, Max, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCaseDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty()
  @IsString()
  chiefComplaint: string;

  @ApiProperty()
  @IsArray()
  symptoms: string[];

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(5)
  severity: number;
}

export class UpdateCaseDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['open', 'in-progress', 'resolved', 'closed'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedStaffId?: string;
}

export class AddCaseNoteDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['general', 'clinical', 'administrative'])
  noteType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isVisibleToPatient?: boolean;
}

export class CreateTriageDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(5)
  esiLevel: number;

  @ApiProperty({ required: false })
  @IsOptional()
  vitalSigns?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assessmentNotes?: string;
}

export class AssignCaseDto {
  @ApiProperty()
  @IsString()
  staffId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateFollowupDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  followupDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['pending', 'scheduled', 'completed', 'cancelled'])
  status?: string;
}
