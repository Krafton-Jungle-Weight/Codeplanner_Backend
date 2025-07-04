import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { GitCommit } from './mockgit/mockgit';

@Module({
  controllers: [AnalysisController],
  providers: [AnalysisService, GitCommit],
  exports: [AnalysisService], // (필요시)
})
export class AnalysisModule {}