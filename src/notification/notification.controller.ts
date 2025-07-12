import { Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/user.decorator';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getNotifications(@CurrentUser() user: any) {
    return this.notificationService.getNotifications(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/recent')
  async getRecentNotifications(@CurrentUser() user: any) {
    return this.notificationService.getRecentNotifications(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:notificationId/read')
  async setRead(@CurrentUser() user: any, @Param('notificationId') notificationId: string) {
    return this.notificationService.setRead(user.id, notificationId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:notificationId')
  async deleteUserNotification(@CurrentUser() user: any, @Param('notificationId') notificationId: string) {
    return this.notificationService.deleteUserNotification(user.id, notificationId);
  }

}