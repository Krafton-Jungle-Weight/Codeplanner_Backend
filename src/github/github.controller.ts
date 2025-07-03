import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GithubService } from './github.service';
import { ProjectService } from '../project/project.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('github')
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly projectService: ProjectService,
  ) {}

  @Get('repos/:owner/:repo')
  getRepo(@Param('owner') owner: string, @Param('repo') repo: string) {
    return this.githubService.getRepo(owner, repo);
  }

  @Get('repos/:owner/:repo/branches')
  getBranches(@Param('owner') owner: string, @Param('repo') repo: string) {
    return this.githubService.getBranches(owner, repo);
  }

  @Get('repos/:owner/:repo/commits')
  getCommits(@Param('owner') owner: string, @Param('repo') repo: string) {
    return this.githubService.getCommits(owner, repo);
  }

  @Get('repos/:owner/:repo/pulls')
  getPulls(@Param('owner') owner: string, @Param('repo') repo: string) {
    return this.githubService.getPulls(owner, repo);
  }

  /**
   * 프로젝트 ID로 저장소 정보 반환
   */
  @Get('project/:projectId/repo')
  async getRepoByProjectId(@Param('projectId') projectId: string) {
    const project = await this.projectService.findOne(projectId);
    const repoUrl = project.repository_url;
    if (!repoUrl) throw new Error('저장소 URL이 없습니다');
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error('저장소 URL이 올바르지 않습니다');
    const owner = match[1];
    const repo = match[2];
    return this.githubService.getRepo(owner, repo);
  }

  /**
   * 프로젝트 ID로 브랜치 목록 반환
   */
  @Get('project/:projectId/branches')
  async getBranchesByProjectId(@Param('projectId') projectId: string) {
    const project = await this.projectService.findOne(projectId);
    const repoUrl = project.repository_url;
    if (!repoUrl) throw new Error('저장소 URL이 없습니다');
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error('저장소 URL이 올바르지 않습니다');
    const owner = match[1];
    const repo = match[2];
    return this.githubService.getBranches(owner, repo);
  }

  /**
   * 프로젝트 ID로 커밋 목록 반환
   */
  @Get('project/:projectId/commits')
  async getCommitsByProjectId(@Param('projectId') projectId: string) {
    const project = await this.projectService.findOne(projectId);
    const repoUrl = project.repository_url;
    if (!repoUrl) throw new Error('저장소 URL이 없습니다');
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error('저장소 URL이 올바르지 않습니다');
    const owner = match[1];
    const repo = match[2];
    return this.githubService.getCommits(owner, repo);
  }

  /**
   * 프로젝트 ID로 PR 목록 반환
   */
  @Get('project/:projectId/pulls')
  async getPullsByProjectId(@Param('projectId') projectId: string) {
    const project = await this.projectService.findOne(projectId);
    const repoUrl = project.repository_url;
    if (!repoUrl) throw new Error('저장소 URL이 없습니다');
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error('저장소 URL이 올바르지 않습니다');
    const owner = match[1];
    const repo = match[2];
    return this.githubService.getPulls(owner, repo);
  }
}