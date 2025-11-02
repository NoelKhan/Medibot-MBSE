import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIAgentService } from './ai-agent.service';
import { AIAgentController } from './ai-agent.controller';
import { AIAgentChatService } from './ai-agent-chat.service';
import { AIAgentChatController } from './ai-agent-chat.controller';
import { PythonManagerService } from './python-manager.service';
import { TriageCase } from '../../database/entities/triage-case.entity';
import { AILog } from '../../database/entities/ai-log.entity';
import { AIInteraction } from '../../database/entities/ai-interaction.entity';
import { User } from '../../database/entities/user.entity';
import { Conversation } from '../../database/entities/conversation.entity';
import { EmergencyModule } from '../emergency/emergency.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BookingsModule } from '../bookings/bookings.module';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([TriageCase, AILog, AIInteraction, User, Conversation]),
    EmergencyModule,
    NotificationsModule,
    BookingsModule,
    RemindersModule,
  ],
  controllers: [AIAgentController, AIAgentChatController],
  providers: [
    PythonManagerService, // Automatically starts Python AIAgent on module init
    AIAgentService,
    AIAgentChatService,
  ],
  exports: [PythonManagerService, AIAgentService, AIAgentChatService],
})
export class AIAgentModule {}
