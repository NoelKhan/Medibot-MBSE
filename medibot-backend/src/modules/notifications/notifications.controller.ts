/**
 * Notifications Controller
 * ========================
 * REST API endpoints for notification management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  SendNotificationDto,
  UpdateNotificationPreferencesDto,
} from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Send push notification
   * POST /api/notifications/send
   */
  @Post('send')
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationsService.sendPushNotification(dto);
  }

  /**
   * Get user notifications
   * GET /api/notifications
   */
  @Get()
  async getNotifications(
    @Request() req,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.userId;
    return this.notificationsService.getUserNotifications(userId, limit);
  }

  /**
   * Get unread notification count
   * GET /api/notifications/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.userId;
    return {
      count: await this.notificationsService.getUnreadCount(userId),
    };
  }

  /**
   * Mark notification as read
   * PUT /api/notifications/:id/read
   */
  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  /**
   * Mark all notifications as read
   * PUT /api/notifications/read-all
   */
  @Put('read-all')
  async markAllAsRead(@Request() req) {
    const userId = req.user.userId;
    await this.notificationsService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  /**
   * Get user notification preferences
   * GET /api/notifications/preferences
   */
  @Get('preferences')
  async getPreferences(@Request() req) {
    const userId = req.user.userId;
    return this.notificationsService.getPreferences(userId);
  }

  /**
   * Update user notification preferences
   * PUT /api/notifications/preferences
   */
  @Put('preferences')
  async updatePreferences(
    @Request() req,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    const userId = req.user.userId;
    return this.notificationsService.updatePreferences(userId, dto);
  }

  /**
   * Register push token
   * POST /api/notifications/register-token
   */
  @Post('register-token')
  async registerPushToken(
    @Request() req,
    @Body() body: { pushToken: string; deviceType?: string; appVersion?: string },
  ) {
    const userId = req.user.userId;
    return this.notificationsService.registerPushToken(
      userId,
      body.pushToken,
      body.deviceType,
      body.appVersion,
    );
  }
}
