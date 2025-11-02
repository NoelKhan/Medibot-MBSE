import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class SendNotificationDto {
  @IsString()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsString()
  pushToken?: string;
}

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  pushEnabled?: boolean;

  @IsOptional()
  @IsString()
  pushToken?: string;

  @IsOptional()
  emailEnabled?: boolean;

  @IsOptional()
  emailAppointmentConfirmation?: boolean;

  @IsOptional()
  emailAppointmentReminder?: boolean;

  @IsOptional()
  emailMedicationReminder?: boolean;

  @IsOptional()
  emailMarketingUpdates?: boolean;

  @IsOptional()
  reminderTimingPrimary?: number;

  @IsOptional()
  reminderTimingSecondary?: number;

  @IsOptional()
  reminderTimingCustom?: boolean;

  @IsOptional()
  quietHoursEnabled?: boolean;

  @IsOptional()
  @IsString()
  quietHoursStart?: string;

  @IsOptional()
  @IsString()
  quietHoursEnd?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;
}
