import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty()
  @IsString()
  doctorId: string;

  @ApiProperty()
  @IsDateString()
  scheduledTime: string;

  @ApiProperty({ enum: ['in-person', 'telehealth'] })
  @IsEnum(['in-person', 'telehealth'])
  appointmentType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateAppointmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryDoctorsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['general-medicine', 'cardiology', 'pediatrics', 'orthopedics', 'dermatology'])
  specialization?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  availability?: boolean;
}
