import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GithubToken } from './github.entity';
import { GithubCommits } from './github-commits.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthModule } from 'src/auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { ProjectModule } from 'src/project/project.module';
import { GithubWebhookService } from './github-webhook.service';
import { GithubWebhookController } from './github-webhook.controller';
import { Issue } from 'src/issues/issues.entity';
import { GithubPullRequestService } from './github-pull-request.service';

@Module({
  imports: [TypeOrmModule.forFeature([GithubToken, GithubCommits, Issue]), AuthModule, HttpModule, ProjectModule],
  controllers: [GithubController, GithubWebhookController],
  providers: [GithubService, JwtAuthGuard, GithubPullRequestService, GithubWebhookService],
  exports: [GithubService, JwtAuthGuard, GithubPullRequestService],
})
export class GithubModule {}
