import { IsString, IsInt, Min, Max, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmergencyDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  emergencyType: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(5)
  severity: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  location?: any;
}

export class UpdateEmergencyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['pending', 'assigned', 'en-route', 'on-scene', 'resolved', 'cancelled'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedStaffId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
