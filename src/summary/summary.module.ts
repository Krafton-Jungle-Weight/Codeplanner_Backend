import { Module } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { SummaryController } from './summary.controller';
import { IssuesService } from 'src/issues/issues.service';
import { ProjectMember } from 'src/project/project-member.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from 'src/issues/issues.entity';

// 인증 모듈
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthModule } from 'src/auth/auth.module';
import { EmailModule } from 'src/email/email.module';
import { ProjectModule } from 'src/project/project.module';
import { GithubModule } from 'src/github/github.module';
import { NotificationModule } from 'src/notification/notification.moduel';

@Module({
  providers: [SummaryService, JwtAuthGuard, IssuesService],
  controllers: [SummaryController],
  imports: [
    TypeOrmModule.forFeature([ProjectMember, Issue]),
    AuthModule,
    EmailModule,
    ProjectModule,
    GithubModule,
    NotificationModule,
  ],
})
export class SummaryModule {}
