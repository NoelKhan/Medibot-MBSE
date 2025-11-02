/**
 * Reminders Controller
 * ====================
 * REST API endpoints for reminder management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { CreateReminderDto, UpdateReminderDto } from './dto/reminder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  /**
   * Create a new reminder
   * POST /api/reminders
   */
  @Post()
  async createReminder(@Request() req, @Body() dto: CreateReminderDto) {
    const userId = req.user.userId;
    return this.remindersService.createReminder(userId, dto);
  }

  /**
   * Get user reminders
   * GET /api/reminders
   */
  @Get()
  async getUserReminders(
    @Request() req,
    @Query('includeCompleted') includeCompleted?: string,
  ) {
    const userId = req.user.userId;
    return this.remindersService.getUserReminders(
      userId,
      includeCompleted === 'true',
    );
  }

  /**
   * Get upcoming reminders
   * GET /api/reminders/upcoming
   */
  @Get('upcoming')
  async getUpcomingReminders(@Request() req) {
    const userId = req.user.userId;
    return this.remindersService.getUpcomingReminders(userId);
  }

  /**
   * Update reminder
   * PUT /api/reminders/:id
   */
  @Put(':id')
  async updateReminder(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
  ) {
    const userId = req.user.userId;
    return this.remindersService.updateReminder(id, userId, dto);
  }

  /**
   * Cancel reminder
   * DELETE /api/reminders/:id
   */
  @Delete(':id')
  async cancelReminder(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId;
    await this.remindersService.cancelReminder(id, userId);
    return { message: 'Reminder cancelled successfully' };
  }

  /**
   * Cancel appointment reminders
   * DELETE /api/reminders/appointment/:appointmentId
   */
  @Delete('appointment/:appointmentId')
  async cancelAppointmentReminders(
    @Request() req,
    @Param('appointmentId') appointmentId: string,
  ) {
    const userId = req.user.userId;
    await this.remindersService.cancelAppointmentReminders(
      appointmentId,
      userId,
    );
    return { message: 'Appointment reminders cancelled successfully' };
  }
}
