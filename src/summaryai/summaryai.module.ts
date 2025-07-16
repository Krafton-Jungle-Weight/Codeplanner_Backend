import { Module } from '@nestjs/common';
import { SummaryaiController } from './summaryai.controller';
import { SummaryaiService } from './summaryai.service';
import { GithubModule } from '../github/github.module';
import { IssuesModule } from '../issues/issues.module';
import { CommentModule } from '../comments/comment.module';
import { ActivityModule } from '../activity/activity.module';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    GithubModule,
    IssuesModule,
    CommentModule,
    ActivityModule,
    ProjectModule,
    UserModule,
    AuthModule,
  ],
  controllers: [SummaryaiController],
  providers: [SummaryaiService],
  exports: [SummaryaiService],
})
export class SummaryaiModule {} 