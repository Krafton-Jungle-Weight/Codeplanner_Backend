import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { GitService } from './mockgit/mockgit';
import { GithubModule } from '../github/github.module';

@Module({
  imports: [GithubModule, HttpModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, GitService],
  exports: [AnalysisService], // (필요시)
})
export class AnalysisModule {} 