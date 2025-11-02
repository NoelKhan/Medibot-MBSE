import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  emergencyContacts?: any[];
}

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bloodType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  heightCm?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  weightKg?: number;
}

export class AddMedicalHistoryDto {
  @ApiProperty()
  @IsString()
  conditionName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  diagnosedDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddMedicationDto {
  @ApiProperty()
  @IsString()
  medicationName: string;

  @ApiProperty()
  @IsString()
  dosage: string;

  @ApiProperty()
  @IsString()
  frequency: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;
}

export class AddAllergyDto {
  @ApiProperty()
  @IsString()
  allergen: string;

  @ApiProperty()
  @IsString()
  severity: 'mild' | 'moderate' | 'severe';

  @ApiProperty()
  @IsString()
  reaction: string;
}
