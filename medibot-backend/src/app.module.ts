import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MedicalCasesModule } from './modules/medical-cases/cases.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { EmergencyModule } from './modules/emergency/emergency.module';
import { EmailModule } from './modules/email/email.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { HealthController } from './health.controller';
import { ChatModule } from './modules/chat/chat.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { AIAgentModule } from './modules/ai-agent/ai-agent.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000, // 1 second
      limit: 10, // 10 requests per second
    }, {
      name: 'medium',
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }, {
      name: 'long',
      ttl: 900000, // 15 minutes
      limit: 1000, // 1000 requests per 15 minutes
    }]),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    MedicalCasesModule,
    BookingsModule,
    EmergencyModule,
    EmailModule,
    NotificationsModule,
    RemindersModule,
    ChatModule,
    DoctorsModule,
    AIAgentModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
