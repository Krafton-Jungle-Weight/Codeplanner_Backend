import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GithubCommits } from './github-commits.entity';
import { Issue } from '../issues/issues.entity';

@Injectable()
export class GithubWebhookService {
  constructor(
    @InjectRepository(GithubCommits)
    private githubCommitsRepository: Repository<GithubCommits>,
    @InjectRepository(Issue)
    private issueRepository: Repository<Issue>,
  ) {}

  /**
   * 커밋 메시지에서 영어-숫자 형식의 태그를 추출합니다.
   * 예: "feat: ABC-123 새로운 기능 추가" -> "ABC-123"
   */
  private extractTagFromCommitMessage(commitMessage: string): string | null {
    // 영어(대소문자)-숫자 형식의 태그 패턴 (예: ABC-123, feature-456, Bug-789)
    const tagPattern = /[A-Za-z]+-\d+/g;
    const matches = commitMessage.match(tagPattern);

    if (matches && matches.length > 0) {
      // 첫 번째 매치된 태그를 반환
      return matches[0];
    }

    return null;
  }

  /**
   * 이슈 상태를 업데이트합니다.
   */
  private async updateIssueStatus(
    issue: Issue,
    newStatus: string,
  ): Promise<boolean> {
    try {
      const previousStatus = issue.status;
      issue.status = newStatus;
      await this.issueRepository.save(issue);

      console.log(
        `이슈 상태 변경: ${previousStatus} -> ${newStatus} (이슈 ID: ${issue.id})`,
      );
      return true;
    } catch (error) {
      console.error('이슈 상태 업데이트 중 오류:', error);
      return false;
    }
  }

  /**
   * 태그로 이슈를 찾습니다.
   */
  private async findIssueByTag(tag: string): Promise<Issue | null> {
    try {
      const issue = await this.issueRepository.findOne({
        where: { tag: tag },
      });
      return issue || null;
    } catch (error) {
      console.error('이슈 조회 중 오류:', error);
      return null;
    }
  }

  /**
   * 커밋 정보를 DB에 저장하고 이슈와 연결합니다.
   */
  async processCommit(commitInfo: {
    repository: string;
    commitMessage: string;
    authorName: string;
    commitUrl: string;
    changedFiles: {
      added: string[];
      modified: string[];
      removed: string[];
    };
    commitHash: string;
    timestamp: string;
  }) {
    console.log('커밋 정보 처리 중...');
    console.log('레포지토리:', commitInfo.repository);
    console.log('커밋 메시지:', commitInfo.commitMessage);
    console.log('작성자:', commitInfo.authorName);
    console.log('커밋 URL:', commitInfo.commitUrl);
    console.log('추가된 파일:', commitInfo.changedFiles.added);
    console.log('수정된 파일:', commitInfo.changedFiles.modified);
    console.log('삭제된 파일:', commitInfo.changedFiles.removed);
    console.log('커밋 해시:', commitInfo.commitHash);
    console.log('타임스탬프:', commitInfo.timestamp);

    try {
      // 1. 커밋 메시지에서 태그 추출
      const extractedTag = this.extractTagFromCommitMessage(
        commitInfo.commitMessage,
      );
      console.log('추출된 태그:', extractedTag);

      // 태그가 없으면 커밋을 무시
      if (!extractedTag) {
        console.log('태그가 없어서 커밋을 무시합니다.');
        return {
          success: true,
          commitId: null,
          extractedTag: null,
          relatedIssueId: null,
          message: '태그가 없어서 커밋을 무시했습니다.',
          ignored: true,
        };
      }

      // 2. 태그로 이슈 찾기
      let relatedIssue: Issue | null = null;
      relatedIssue = await this.findIssueByTag(extractedTag);
      console.log('연결된 이슈:', relatedIssue ? relatedIssue.id : '없음');

      // 3. 이슈 상태 업데이트 (TODO -> IN_PROGRESS)
      let statusUpdated = false;
      if (relatedIssue && relatedIssue.status === 'TODO') {
        statusUpdated = await this.updateIssueStatus(
          relatedIssue,
          'IN_PROGRESS',
        );
      }

      // 4. GitHub 커밋 엔티티 생성
      const githubCommit = new GithubCommits();
      githubCommit.commitHash = commitInfo.commitHash;
      githubCommit.commitMessage = commitInfo.commitMessage;
      githubCommit.commitUrl = commitInfo.commitUrl;

      // 이슈가 찾아지면 연결
      if (relatedIssue) {
        githubCommit.issue = relatedIssue;
      }

      // 5. DB에 저장
      const savedCommit = await this.githubCommitsRepository.save(githubCommit);
      console.log('커밋 저장 완료:', savedCommit.id);

      return {
        success: true,
        commitId: savedCommit.id,
        extractedTag: extractedTag,
        relatedIssueId: relatedIssue?.id || null,
        statusUpdated: statusUpdated,
        previousStatus: statusUpdated ? 'TODO' : relatedIssue?.status || null,
        currentStatus: relatedIssue?.status || null,
        message: relatedIssue
          ? `커밋이 태그 ${extractedTag}의 이슈와 연결되었습니다.${statusUpdated ? ' 이슈 상태가 IN_PROGRESS로 변경되었습니다.' : ''}`
          : `태그 ${extractedTag}의 이슈를 찾을 수 없어 연결되지 않았습니다.`,
        ignored: false,
      };
    } catch (error) {
      console.error('커밋 처리 중 오류:', error);
      throw new Error(`커밋 처리 실패: ${error.message}`);
    }
  }

  /**
   * 특정 이슈의 커밋 목록을 페이지네이션으로 조회합니다.
   */
  async getCommits(issueId: string, page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;

      // 커밋 목록 조회 (최신순)
      const commits = await this.githubCommitsRepository.find({
        where: { issue: { id: issueId } },
        relations: ['issue'],
        order: { createdAt: 'DESC' },
        skip: offset,
        take: limit,
      });

      // 전체 커밋 수 조회
      const totalCount = await this.githubCommitsRepository.count({
        where: { issue: { id: issueId } },
      });

      // 다음 페이지 존재 여부 확인
      const hasNextPage = offset + limit < totalCount;
      const hasPreviousPage = page > 1;

      return {
        commits,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage,
          hasPreviousPage,
          limit,
        },
      };
    } catch (error) {
      console.error('커밋 조회 중 오류:', error);
      throw new Error(`커밋 조회 실패: ${error.message}`);
    }
  }

  /**
   * 무한스크롤을 위한 커밋 목록 조회 (cursor 기반)
   */
  async getCommitsInfinite(
    issueId: string,
    cursor?: string,
    limit: number = 10,
  ) {
    try {
      let query = this.githubCommitsRepository
        .createQueryBuilder('commit')
        .leftJoinAndSelect('commit.issue', 'issue')
        .where('issue.id = :issueId', { issueId })
        .orderBy('commit.createdAt', 'DESC')
        .addOrderBy('commit.id', 'DESC') // 동일한 시간일 때 ID로 정렬
        .take(limit + 1); // 다음 페이지 존재 여부 확인을 위해 +1

      // cursor가 있으면 해당 커밋 이후부터 조회
      if (cursor) {
        const [cursorDate, cursorId] = cursor.split('_');
        query = query.andWhere(
          '(commit.createdAt < :cursorDate OR (commit.createdAt = :cursorDate AND commit.id < :cursorId))',
          { cursorDate, cursorId },
        );
      }

      const commits = await query.getMany();

      // 다음 페이지 존재 여부 확인
      const hasNextPage = commits.length > limit;
      const nextCursor = hasNextPage ? commits[limit - 1] : null;

      // limit + 1개를 가져왔으므로 실제 limit개만 반환
      const result = hasNextPage ? commits.slice(0, limit) : commits;

      return {
        commits: result,
        pagination: {
          hasNextPage,
          nextCursor: nextCursor
            ? `${nextCursor.createdAt.toISOString()}_${nextCursor.id}`
            : null,
          limit,
        },
      };
    } catch (error) {
      console.error('무한스크롤 커밋 조회 중 오류:', error);
      throw new Error(`커밋 조회 실패: ${error.message}`);
    }
  }
}
