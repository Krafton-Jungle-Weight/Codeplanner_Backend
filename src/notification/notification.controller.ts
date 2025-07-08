import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
}