// import { Module } from '@nestjs/common';
// import { AnalysisController } from './analysis.controller';
// import { AnalysisService } from './analysis.service';
// import { GithubModule } from '../github/github.module';
// import { AuthModule } from 'src/auth/auth.module';
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
// import { CppcheckScanner } from './scanner/cppcheck.scanner';
// import { ClangTidyScanner } from './scanner/clang-tidy.scanner';
// import { ClangFormatScanner } from './scanner/clang-format.scanner';

// @Module({
//   imports: [
//     GithubModule,
//     AuthModule,
//   ],
//   controllers: [AnalysisController],
//   providers: [AnalysisService, JwtAuthGuard, CppcheckScanner, ClangTidyScanner, ClangFormatScanner],
//   exports: [AnalysisService],
// })
// export class AnalysisModule {} 

import { forwardRef, Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { GithubModule } from '../github/github.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CppcheckScanner } from './scanner/cppcheck.scanner';
import { ClangTidyScanner } from './scanner/clang-tidy.scanner';
import { ClangFormatScanner } from './scanner/clang-format.scanner';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectConfig } from './analysis.entity';
import { HttpModule } from '@nestjs/axios';
import { UserModule } from 'src/user/user.module';
import { GithubService } from 'src/github/github.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectConfig]),
    forwardRef(() => GithubModule),
    AuthModule,
    HttpModule,
    UserModule,
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService, JwtAuthGuard, CppcheckScanner, ClangTidyScanner, ClangFormatScanner],
  exports: [AnalysisService],
})
export class AnalysisModule {} 