import { Body, Controller, Get, Param, Post, Query, Headers } from '@nestjs/common';
import { GithubWebhookService } from './github-webhook.service';
import { AnalysisService } from 'src/analysis/analysis.service'
import { GithubService } from './github.service';
@Controller('github')
export class GithubWebhookController {
  constructor(
    private readonly githubWebhookService: GithubWebhookService,
    private readonly githubService: GithubService,
    private readonly analysisService: AnalysisService,
  ) {}

  @Post('webhook')
  async webhook(
    @Body() body: any, 
    @Headers() headers: any
  ) {
      // console.log('----------------------');
      // console.log('headers', headers);
      // console.log('webhook', body);
      // console.log('----------------------');
      const type = headers['x-github-event'];
      if (type == 'pull_request') {
        return this.handlePullRequestEvent(body);
      }
      else if (type == 'push') {
          return this.handlePushEvent(body);
      }
  }

  @Get('webhook/commit/:issueId')
  async getCommit(
    @Param('issueId') issueId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    // 페이지 번호와 limit 유효성 검사
    if (pageNum < 1) {
      throw new Error('페이지 번호는 1 이상이어야 합니다.');
    }
    if (limitNum < 1 || limitNum > 100) {
      throw new Error('limit은 1 이상 100 이하여야 합니다.');
    }

    return this.githubWebhookService.getCommits(issueId, pageNum, limitNum);
  }

  /**
   * 무한스크롤을 위한 커밋 목록 조회
   * cursor 기반 페이지네이션 사용
   */
  @Get('webhook/commit/:issueId/infinite')
  async getCommitsInfinite(
    @Param('issueId') issueId: string,
    @Query('cursor') cursor: string,
    @Query('limit') limit: string = '10',
  ) {
    const limitNum = parseInt(limit, 10) || 10;
    console.log("areyoucall")
    if (limitNum < 1 || limitNum > 100) {
      throw new Error('limit은 1 이상 100 이하여야 합니다.');
    }

    return this.githubWebhookService.getCommitsInfinite(
      issueId,
      cursor,
      limitNum,
    );
  }

  private async handlePushEvent(body: any) {
    const results: any[] = [];

    // Push 이벤트인지 확인
    if (body.commits && Array.isArray(body.commits)) {
      const repositoryName = body.repository?.full_name || 'unknown';

      // 각 커밋을 순차적으로 처리
      for (const commit of body.commits) {
        const commitInfo = {
          repository: repositoryName,
          commitMessage: commit.message,
          authorName: commit.author?.name || 'unknown',
          commitUrl: commit.url,
          changedFiles: {
            added: commit.added || [],
            modified: commit.modified || [],
            removed: commit.removed || [],
          },
          commitHash: commit.id,
          timestamp: commit.timestamp,
        };
        try{
        } catch{
          console.error("커밋 실패, id: ", commit.commitHash);
        }

        console.log('추출된 커밋 정보:', commitInfo);

        try {
          // 서비스로 커밋 정보 전달하고 결과 수집
          const result = await this.githubWebhookService.processCommit(commitInfo);
          results.push({
            commitHash: commit.id,
            ...result,
          });
        } catch (error) {
          console.error(`커밋 ${commit.id} 처리 중 오류:`, error);
          results.push({
            commitHash: commit.id,
            success: false,
            error: error.message,
          });
        }
      }
    }

    return {
      status: 'success',
      processedCommits: results.length,
      results: results,
    };
  }
  // pull-request 
  private async handlePullRequestEvent(body: any) {
    const results: any[] = [];

    if (body.pull_request) {
      const repositoryName = body.repository?.full_name || 'unknown';
      const [owner, repo] = repositoryName.split('/');
      const { number, head, base, title, user } = body.pull_request;
      const action = body.action;
      const sender = body.sender;
      const userId = await this.githubService.getUserIdFromGithubWebhookSender(sender);

      console.log(`PR #${number}: ${title} (${action})`);

      try {
        // PR의 변경된 파일들을 가져오기
        // const changedFiles =
        //   await this.githubService.getFilesChangedInPullRequest(
        //     owner,
        //     repo,
        //     number,
        //     body.sender?.id || 'unknown',
        //   );
        const changedFiles = await this.githubService.getFilesChangedInPullRequest(
        owner,
        repo,
        number,
        userId,
        );

        // C/C++ 파일만 필터링
        const cppFiles = changedFiles.filter(
          (file) => file.language === 'c' || file.language === 'cpp',
        );

        if (cppFiles.length > 0) {
          // 코드 분석 수행
          const analysisResults = await this.analysisService.analyzeFiles(
            cppFiles.map((file) => ({
              filename: file.filename,
              content: file.content,
              language: file.language as 'c' | 'cpp',
            })),
          );

          const prInfo = {
            repository: repositoryName,
            pullRequestNumber: number,
            title: title,
            author: user?.login || 'unknown',
            action: action,
            headSha: head?.sha,
            baseSha: base?.sha,
            changedFiles: {
              total: changedFiles.length,
              cppFiles: cppFiles.length,
            },
            analysisResults: analysisResults,
          };

          console.log('분석 완료된 PR 정보:', prInfo);
          results.push(prInfo);
        } else {
          console.log('C/C++ 파일이 없어서 분석을 건너뜁니다.');
          results.push({
            repository: repositoryName,
            pullRequestNumber: number,
            title: title,
            action: action,
            message: 'No C/C++ files to analyze',
          });
        }
      } catch (error) {
        console.error('PR 분석 중 오류 발생:', error);
        results.push({
          pullRequestNumber: number,
          error: error.message,
        });
      }
    }

    return {
      status: 'success',
      eventType: 'pull_request',
      processedCommits: results.length,
      results: results,
    };
  }
}
