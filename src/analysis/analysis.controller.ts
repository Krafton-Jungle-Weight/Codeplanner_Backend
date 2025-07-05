import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalyzeRequest } from './dto/analyze-request.dto';
import { execa } from 'execa';
import { join } from 'path';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/user.decorator';

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

  // GitHub 커밋 분석
  @UseGuards(JwtAuthGuard)
  @Get('github/commit/:owner/:repo/:sha')
  async analyzeGitHubCommit(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('sha') sha: string,
    @CurrentUser() user: any,
  ) {
    return this.analysisService.analyzeGitHubCommit(owner, repo, sha, user.id);
  }

  // GitHub PR 분석
  @UseGuards(JwtAuthGuard)
  @Get('github/pr/:owner/:repo/:prNumber')
  async analyzeGitHubPullRequest(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('prNumber') prNumber: string,
    @CurrentUser() user: any,
  ) {
    return this.analysisService.analyzeGitHubPullRequest(
      owner,
      repo,
      parseInt(prNumber, 10),
      user.id,
    );
  }
}
