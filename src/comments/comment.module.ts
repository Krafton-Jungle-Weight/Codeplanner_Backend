import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './comment.entity';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ProjectModule } from 'src/project/project.module';
import { IssuesModule } from 'src/issues/issues.module';
import { NotificationModule } from 'src/notification/notification.moduel';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    UserModule,
    AuthModule,
    ProjectModule,
    IssuesModule,
    NotificationModule,
  ],
  controllers: [CommentController],
  providers: [CommentService, JwtAuthGuard],
  exports: [CommentService],
})
export class CommentModule {}
