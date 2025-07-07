import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WebHookController } from './webhook.controller';
import { AnalysisService } from '../analysis.service';
import { GithubService } from '../../github/github.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GithubToken } from 'src/github/github.entity';

@Module({
  imports: [
    HttpModule,                    // HttpService 제공
    TypeOrmModule.forFeature([GithubToken]), // GithubToken Repository 제공
  ],
  controllers: [WebHookController],
  providers: [AnalysisService, GithubService],
  exports: [],
})
export class WebhookModule {} 