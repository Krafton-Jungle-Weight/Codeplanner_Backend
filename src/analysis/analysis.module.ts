import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { GitService } from './mockgit/mockgit';

@Module({
  controllers: [AnalysisController],
  providers: [AnalysisService, GitService],
  exports: [AnalysisService], // (필요시)
})
export class AnalysisModule {}