import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { GitService } from './mockgit/mockgit';
import { GithubModule } from '../github/github.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Module({
  imports: [
    GithubModule,
    AuthModule,
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService, GitService, JwtAuthGuard],
  exports: [AnalysisService],
})
export class AnalysisModule {} 