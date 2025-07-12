import { Body, Controller, Get, Param, Post, UseGuards, Query} from '@nestjs/common';
import { Request } from 'express';
import { GithubService } from './github.service';
import { ProjectService } from '../project/project.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GithubToken } from './github.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { CurrentUser } from 'src/auth/user.decorator';
import { parseGitHubUrl } from './github.utils';
import { GithubPullRequestService } from './github-pull-request.service';


@Controller('github')
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly projectService: ProjectService,
    @InjectRepository(GithubToken)
    private githubTokenRepository: Repository<GithubToken>,
    private readonly githubPullRequestService: GithubPullRequestService,
  ) {}


  @UseGuards(JwtAuthGuard)
  // ↓ 명명된 와일드카드로 변경
  @Get('connect/:owner/:repo')
  async connectWebhook(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: User,
  ) {
    return this.githubService.connect(owner, repo, user);
  }

  

  @UseGuards(JwtAuthGuard)
  @Get('repos/:owner/:repo')
  getRepo(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: any,
  ) {

    const userId = user?.id;
    return this.githubService.getRepo(owner, repo, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('repos/:owner/:repo/branches')
  getBranches(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: any,
  ) {
    const userId = user?.id;
    return this.githubService.getBranches(owner, repo, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('repos/:owner/:repo/commits')
  getCommits(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('sha') sha: string,
    @CurrentUser() user: any,
  ) {
    const userId = user?.id;
    return this.githubService.getCommits(owner, repo, userId, sha);
  }

  @UseGuards(JwtAuthGuard)
  @Get('repos/:owner/:repo/pulls')
  getPulls(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: any,
  ) {
    const userId = user?.id;
    return this.githubService.getPulls(owner, repo, userId);
  }

  /**
   * 프로젝트 ID로 저장소 정보 반환
   */
  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId/repo')
  async getRepoByProjectId(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    const project = await this.projectService.findOne(projectId);
    const repoUrl = project.repository_url;
    if (!repoUrl) throw new Error('저장소 URL이 없습니다');

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) throw new Error('저장소 URL이 올바르지 않습니다');

    const userId = user?.id;
    return this.githubService.getRepo(parsed.owner, parsed.repo, userId);
  }

  /**
   * 프로젝트 ID로 브랜치 목록 반환
   */
  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId/branches')
  async getBranchesByProjectId(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    const project = await this.projectService.findOne(projectId);
    const repoUrl = project.repository_url;
    if (!repoUrl) throw new Error('저장소 URL이 없습니다');

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) throw new Error('저장소 URL이 올바르지 않습니다');

    const userId = user?.id;
    return this.githubService.getBranches(parsed.owner, parsed.repo, userId);
  }

  /**
   * 프로젝트 ID로 커밋 목록 반환
   */
  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId/commits')
  async getCommitsByProjectId(
    @Param('projectId') projectId: string,
    @Query('sha') sha: string,
    @CurrentUser() user: any,
  ) {
    const project = await this.projectService.findOne(projectId);
    const repoUrl = project.repository_url;
    if (!repoUrl) throw new Error('저장소 URL이 없습니다');

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) throw new Error('저장소 URL이 올바르지 않습니다');

    const userId = user?.id;
    return this.githubService.getCommits(
      parsed.owner,
      parsed.repo,
      userId,
      sha,
    );
  }

  /**
   * 프로젝트 ID로 PR 목록 반환
   */
  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId/pulls')
  async getPullsByProjectId(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    const project = await this.projectService.findOne(projectId);
    const repoUrl = project.repository_url;
    if (!repoUrl) throw new Error('저장소 URL이 없습니다');

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) throw new Error('저장소 URL이 올바르지 않습니다');

    const userId = user?.id;
    return this.githubService.getPulls(parsed.owner, parsed.repo, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('project/:projectId/create-pull-request')
  async createPullRequest(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() body: any,
  ) {
    return await this.githubPullRequestService.createPullRequest(user, projectId, body);
  }

  /**
   * GitHub 저장소를 생성하는 엔드포인트
   */
  @UseGuards(JwtAuthGuard)
  @Post('create-repo')
  async createRepository(
    @CurrentUser() user: any,
    @Body()
    body: {
      repoName: string;
      description: string;
      isPrivate: boolean;
      orgName?: string;
    },
  ) {
    try {
      console.log(`[GitHub Controller] 저장소 생성 요청 시작`);
      console.log(`[GitHub Controller] 요청 본문:`, body);
      const userId = user?.id;
      if (!userId) {
        console.error(`[GitHub Controller] 사용자 ID가 없습니다`);
        throw new Error('사용자 인증이 필요합니다');
      }

      console.log(`[GitHub Controller] 사용자 ID: ${userId}`);

      const { repoName, description, isPrivate, orgName } = body;

      // 입력값 검증
      if (!repoName) {
        throw new Error('저장소 이름이 필요합니다');
      }

      console.log(
        `[GitHub Controller] GitHub 서비스 호출: ${repoName}, ${description}, ${isPrivate}, ${userId}, 조직: ${orgName || '사용자'}`,
      );

      const repoData = await this.githubService.createRepository(
        repoName,
        description,
        isPrivate,
        userId,
        orgName,
      );

      console.log(`[GitHub Controller] 저장소 생성 성공:`, repoData);

      return {
        success: true,
        repository: repoData,
        repositoryUrl: repoData.html_url,
      };
    } catch (error) {
      console.error(`[GitHub Controller] 저장소 생성 실패:`, error);
      throw new Error(`저장소 생성 실패: ${error.message}`);
    }
  }

  /**
   * GitHub 토큰 상태를 확인하는 엔드포인트
   */
  @UseGuards(JwtAuthGuard)
  @Get('token-status')
  async getTokenStatus(@CurrentUser() user: any) {
    const userId = user?.id;

    try {
      console.log(`[GitHub Controller] 토큰 상태 확인: ${userId}`);

      // 토큰 존재 여부 확인
      const tokenEntity = await this.githubTokenRepository.findOne({
        where: { user_id: userId, provider: 'github' },
      });

      if (!tokenEntity) {
        return {
          success: false,
          message:
            'GitHub 토큰이 없습니다. GitHub OAuth 인증을 먼저 완료해주세요.',
          hasToken: false,
        };
      }

      // GitHub API로 토큰 유효성 검증
      try {
        const userInfo = await this.githubService.getUserInfo(userId);
        // 토큰 스코프 확인
        const scopes = await this.githubService.getTokenScopes(
          tokenEntity.access_token,
        );

        return {
          success: true,
          message: 'GitHub 토큰이 유효합니다.',
          hasToken: true,
          tokenValid: true,
          user: userInfo,
          scopes,
        };
      } catch (apiError) {
        return {
          success: false,
          message: `GitHub 토큰이 만료되었거나 유효하지 않습니다: ${apiError.message}`,
          hasToken: true,
          tokenValid: false,
        };
      }
    } catch (error) {
      console.error(`[GitHub Controller] 토큰 상태 확인 실패:`, error);
      throw new Error(`토큰 상태 확인 실패: ${error.message}`);
    }
  }

  /* 사용자가 작성한 PR의 파일 변경 내역을 가져오는 엔드포인트 */
  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId/pull-request-file-changes/:pull_number/:owner/:repo')
  async getPullRequestFileChanges(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('pull_number') pull_number: string,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ) {
    return await this.githubPullRequestService.getPullRequestFileChanges(user, projectId, pull_number, owner, repo);
  }
  /**
   * 사용자가 속한 GitHub 조직 목록을 가져오는 엔드포인트
   */
  @UseGuards(JwtAuthGuard)
  @Get('organizations')
  async getUserOrganizations(@CurrentUser() user: any) {
    const userId = user?.id;
    
    try {
      console.log(`[GitHub Controller] 사용자 조직 목록 조회 시작: ${userId}`);
      
      // 토큰 존재 여부 먼저 확인
      const tokenEntity = await this.githubTokenRepository.findOne({
        where: { user_id: userId, provider: 'github' },
      });

      if (!tokenEntity) {
        console.error(`[GitHub Controller] GitHub 토큰이 없음: ${userId}`);
        throw new Error('GitHub 토큰이 없습니다. GitHub OAuth 인증을 먼저 완료해주세요.');
      }

      console.log(`[GitHub Controller] GitHub 토큰 확인됨: ${tokenEntity.access_token.substring(0, 10)}...`);
      
      const organizations = await this.githubService.getUserOrganizations(userId);
      
      console.log(`[GitHub Controller] 조직 목록 조회 성공: ${organizations.length}개 조직`);
      console.log(`[GitHub Controller] 조직 목록:`, organizations.map(org => ({
        login: org.login,
        canCreateRepo: org.canCreateRepo,
        role: org.role,
        state: org.state,
        permissionError: org.permissionError
      })));
      
      return {
        success: true,
        organizations: organizations.map(org => ({
          login: org.login,
          id: org.id,
          avatar_url: org.avatar_url,
          description: org.description,
          url: org.url,
          html_url: org.html_url,
          canCreateRepo: org.canCreateRepo,
          role: org.role,
          state: org.state,
          permissionError: org.permissionError
        }))
      };
    } catch (error) {
      console.error(`[GitHub Controller] 조직 목록 조회 실패:`, error);
      console.error(`[GitHub Controller] 오류 상세:`, {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      throw new Error(`조직 목록 조회 실패: ${error.message}`);
    }
  }

  /**
   * 특정 조직의 저장소 생성 권한을 확인하는 엔드포인트
   */
  @UseGuards(JwtAuthGuard)
  @Get('organizations/:orgName/permissions')
  async checkOrganizationPermissions(@CurrentUser() user: any, @Param('orgName') orgName: string) {
    const userId = user?.id;
    
    try {
      console.log(`[GitHub Controller] 조직 권한 확인: ${userId} -> ${orgName}`);
      
      const permissionCheck = await this.githubService.checkOrganizationRepoCreationPermission(userId, orgName);
      const helpInfo = this.githubService.getOrganizationPermissionHelp(orgName);
      
      return {
        success: true,
        canCreateRepo: permissionCheck.canCreateRepo,
        role: permissionCheck.role,
        state: permissionCheck.state,
        organization: permissionCheck.organization,
        helpInfo
      };
    } catch (error) {
      console.error(`[GitHub Controller] 조직 권한 확인 실패:`, error);
      
      // 권한 문제인 경우 도움말 정보와 함께 반환
      const helpInfo = this.githubService.getOrganizationPermissionHelp(orgName);
      
      return {
        success: false,
        error: error.message,
        canCreateRepo: false,
        helpInfo
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('repos/:owner/:repo/commit/:sha/files')
  async getCommitChangedFiles(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('sha') sha: string,
    @CurrentUser() user: any,
  ) {
    return this.githubService.getChangedFilesWithContent(
      owner,
      repo,
      sha,
      user.id,
    );
  }

  /**
   * PR 기준으로 최근 변경된 파일들 가져오기 (중복 제거)
   */
  @UseGuards(JwtAuthGuard)
  @Get('repos/:owner/:repo/pulls/:pullNumber/recent-files')
  async getRecentChangedFilesInPullRequest(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('pullNumber') pullNumber: string,
    @CurrentUser() user: any,
  ) {
    const pullNumberInt = parseInt(pullNumber, 10);
    if (isNaN(pullNumberInt)) {
      throw new Error('올바른 PR 번호를 입력해주세요.');
    }
    
    return this.githubService.getRecentChangedFilesInPullRequest(
      owner,
      repo,
      pullNumberInt,
      user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('repos/:owner/:repo/pulls/:prNumber/files')
  async getFilesInPR(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('prNumber') prNumber: string,
    @CurrentUser() user: any,
  ) {
    const userId = user?.id;
    return this.githubService.getFilesChangedInPullRequest(
      owner,
      repo,
      parseInt(prNumber, 10),
      userId,
    );
  }
}
