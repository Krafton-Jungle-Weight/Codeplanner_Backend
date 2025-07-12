import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { AuthModule } from 'src/auth/auth.module';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserModule } from 'src/user/user.module';
import { UserNotification } from './user-notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, UserNotification]),
    AuthModule,
    UserModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, JwtAuthGuard],
  exports: [NotificationService],
})
export class NotificationModule {}
