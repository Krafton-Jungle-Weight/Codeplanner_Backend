import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { GithubWebhookService } from './github-webhook.service';

@Controller('github')
export class GithubWebhookController {
  constructor(private readonly githubWebhookService: GithubWebhookService) {}

  @Post('webhook')
  async webhook(@Body() body: any) {
    console.log('webhook', body);

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

        console.log('추출된 커밋 정보:', commitInfo);

        try {
          // 서비스로 커밋 정보 전달하고 결과 수집
          const result =
            await this.githubWebhookService.processCommit(commitInfo);
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

    if (limitNum < 1 || limitNum > 100) {
      throw new Error('limit은 1 이상 100 이하여야 합니다.');
    }

    return this.githubWebhookService.getCommitsInfinite(
      issueId,
      cursor,
      limitNum,
    );
  }
}
