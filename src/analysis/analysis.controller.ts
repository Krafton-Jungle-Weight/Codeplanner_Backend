import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalyzeRequest } from './dto/analyze-request.dto';
import { execa } from 'execa';
import { join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get()
  async analyzeExampleC() {
    const filePath = join(
      __dirname,
      '..',
      '..',
      '..',
      'src',
      'static',
      'code-samples',
      'example1.c',
    );
    // cppcheck 실행
    let cppcheckResult = '';
    try {
      const { stdout, stderr } = await execa('cppcheck', [
        '--enable=all',
        filePath,
      ]);
      cppcheckResult = stdout + (stderr ? '\n' + stderr : '');
    } catch (err: any) {
      cppcheckResult = err.stdout || err.stderr || err.message;
    }
    // clang-tidy 실행
    let clangTidyResult = '';
    try {
      const { stdout } = await execa(
        'clang-tidy',
        [filePath, '--', '-std=c11'],
        {
          env: { PATH: process.env.PATH },
        },
      );
      clangTidyResult = stdout;
    } catch (err: any) {
      clangTidyResult = err.stdout || err.stderr || err.message;
    }
    return {
      file: 'example1.c',
      cppcheck: cppcheckResult,
      clangTidy: clangTidyResult,
    };
  }

  @Post('analyze')
  async analyze(@Body() files: AnalyzeRequest[]) {
    return this.analysisService.analyzeFiles(files);
  }

  /*
  localhost:5000/analysis/commits/abc123
  [
    {
      "filename": "foo.c",
      "content": "#include <stdio.h>\nint main() { return 0; }",
      "language": "c"
    },
    {
      "filename": "bar.cpp",
      "content": "#include <iostream>\nint main() { return 0; }",
      "language": "cpp"
    }
  ]
  */

  @Get('commit/:gitHash')
  async gitCommitAnalyze(@Param('gitHash') gitHash: string) {
    return this.analysisService.analyzeCommit(gitHash);
  }

  // 테스트용 엔드포인트 (JWT 없이)
  @Get('test')
  async test() {
    return { message: 'Analysis module is working!' };
  }

  // GitHub 커밋 분석 (JWT 인증 적용)
  @UseGuards(JwtAuthGuard)
  @Get('github/commit/:owner/:repo/:sha')
  async analyzeGitHubCommit(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('sha') sha: string,
    @CurrentUser() user: any,
  ) {
    try {
      console.log(`[Controller] GitHub 커밋 분석 시작: ${owner}/${repo}@${sha}`);
      console.log(`[Controller] 사용자 ID: ${user.id}`);
      
      const result = await this.analysisService.analyzeGitHubCommit(owner, repo, sha, user.id);
      
      console.log(`[Controller] 분석 완료: ${result.length}개 파일`);
      return result;
    } catch (error) {
      console.error(`[Controller] GitHub 커밋 분석 실패:`, error);
      console.error(`[Controller] 에러 스택:`, error.stack);
      throw error;
    }
  }

  // GitHub PR 분석 (JWT 인증 적용)
  @UseGuards(JwtAuthGuard)
  @Get('github/pr/:owner/:repo/:prNumber')
  async analyzeGitHubPullRequest(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('prNumber') prNumber: string,
    @CurrentUser() user: any,
  ) {
    try {
      console.log(`[Controller] GitHub PR 분석 시작: ${owner}/${repo}#${prNumber}`);
      console.log(`[Controller] 사용자 ID: ${user.id}`);
      
      const result = await this.analysisService.analyzeGitHubPullRequest(
        owner,
        repo,
        parseInt(prNumber, 10),
        user.id,
      );
      
      console.log(`[Controller] 분석 완료: ${result.length}개 파일`);
      return result;
    } catch (error) {
      console.error(`[Controller] GitHub PR 분석 실패:`, error);
      console.error(`[Controller] 에러 스택:`, error.stack);
      throw error;
    }
  }
}
