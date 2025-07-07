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

  /*
   * 실존 파일을 대상으로 검사하는 함수
   */
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

  // GitHub 커밋 분석 (JWT 인증 적용)
  /*
   * github 커밋의 레포와 해시값으로 분석하는 컨트롤러(딱 1개의 커밋만 분석)
   */
  @UseGuards(JwtAuthGuard)
  @Get('github/commit/:owner/:repo/:sha')
  async analyzeGitHubCommit(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('sha') sha: string,
    @CurrentUser() user: any,
  ) {
    return await this.analysisService.analyzeGitHubCommit(
      owner,
      repo,
      sha,
      user.id,
    );
  }

  // GitHub PR 분석 (JWT 인증 적용)
  /*
   * pr기준으로 모든 커밋을 분석
   */
  @UseGuards(JwtAuthGuard)
  @Get('github/pr/:owner/:repo/:prNumber')
  async analyzeGitHubPullRequest(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('prNumber') prNumber: string,
    @CurrentUser() user: any,
  ) {
    return await this.analysisService.analyzeGitHubPullRequest(
      owner,
      repo,
      parseInt(prNumber, 10),
      user.id,
    );
  }
}
