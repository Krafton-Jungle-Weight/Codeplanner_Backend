import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { GithubModule } from '../github/github.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CppcheckScanner } from './scanner/cppcheck.scanner';
import { ClangTidyScanner } from './scanner/clang-tidy.scanner';
import { ClangFormatScanner } from './scanner/clang-format.scanner';

@Module({
  imports: [
    GithubModule,
    AuthModule,
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService, JwtAuthGuard, CppcheckScanner, ClangTidyScanner, ClangFormatScanner],
  exports: [AnalysisService],
})
export class AnalysisModule {} 