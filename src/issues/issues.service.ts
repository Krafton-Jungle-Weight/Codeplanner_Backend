import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Issue } from './issues.entity';
import { createQueryBuilder, Repository } from 'typeorm';
import { UpdateIssueDto } from './dto/issue-info.dto';

import { CreateIssueDto } from './issues-update.dto';
import { EmailService } from 'src/email/email.service';
import { User } from 'src/user/user.entity';
import { ProjectService } from 'src/project/project.service';
import { GithubService } from 'src/github/github.service';


@Injectable()
export class IssuesService {
  
  constructor(
    @InjectRepository(Issue)
    private issueRepository: Repository<Issue>,

    @Inject(EmailService)
    private readonly emailService: EmailService,

    @Inject(ProjectService)
    private readonly projectService: ProjectService,

    @Inject(GithubService)
    private readonly githubService: GithubService,

  ) {}

  // UUID 값을 정리하는 헬퍼 함수
  private cleanUuid(uuid: string | undefined): string | undefined {
    if (!uuid) return undefined;

    // UUID 패턴 매칭 (8-4-4-4-12 형식)
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 이미 올바른 UUID 형식이면 그대로 반환
    if (uuidPattern.test(uuid)) {
      return uuid;
    }

    // UUID 패턴을 찾아서 추출
    const match = uuid.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
    if (match) {
      return match[0];
    }

    // UUID가 아닌 경우 undefined 반환
    return undefined;
  }

  async getIssues(projectId: string) {
    console.log('getIssues projectId', projectId);
    return await this.issueRepository.find({
      where: { projectId },
      order: { position: 'ASC' },
    });
  }

  async findIssueById(issueId: string, projectId: string): Promise<Issue> {
    const findissue = await this.issueRepository.findOne({
      where: {
        id: issueId,
        projectId: projectId,
      },
    });
    if (!findissue) {
      throw new NotFoundException('이슈를 찾을 수 없습니다.');
    }
    return findissue;
  }

  async getIssueInfo(
    issueId: string,
    projectId: string,
  ): Promise<UpdateIssueDto> {
    const issue = await this.findIssueById(issueId, projectId);

    if (!issue) {
      throw new NotFoundException('해당 이슈를 찾을 수 없습니다.');
    }

    return {
      title: issue.title,
      description: issue.description ?? '',
      issueType: issue.issueType ?? 'task',
      status: issue.status ?? 'TODO',
      assigneeId: issue.assigneeId ?? null,
      reporterId: issue.reporterId ?? null,
      startDate: issue.startDate ?? null,
      dueDate: issue.dueDate ?? null,
    };
  }

  async updateIssueInfo(
    dto: UpdateIssueDto,
    projectId: string,
    issueId: string,
  ): Promise<Issue> {
    const issue = await this.findIssueById(issueId, projectId);

    if (dto.title !== undefined) issue.title = dto.title;
    if (dto.description !== undefined) issue.description = dto.description;
    if (dto.issueType !== undefined) issue.issueType = dto.issueType;
    if (dto.status !== undefined) issue.status = dto.status;
    if (dto.assigneeId !== undefined) issue.assigneeId = dto.assigneeId;
    if (dto.reporterId !== undefined) issue.reporterId = dto.reporterId;
    if (dto.startDate !== undefined) {
      issue.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.dueDate !== undefined) {
      issue.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    return await this.issueRepository.save(issue);
  }

  async getIssuesCurrentUser(
    userId: string,
    projectId: string,
  ): Promise<Issue[]> {
    return this.issueRepository
      .createQueryBuilder('issue')
      .where('issue.assigneeId = :userId', { userId })
      .andWhere('issue.projectId = :projectId', { projectId })
      .getMany();
  }

  async getIssuesCurrentUserCount(
    userId: string,
    projectId: string,
  ): Promise<number> {
    return this.issueRepository
      .createQueryBuilder('issue')
      .where('issue.assigneeId = :userId', { userId })
      .andWhere('issue.projectId = :projectId', { projectId })
      .getCount();
  }

  async updateIssueOrderAndStatus(
    issueIds: string[],
    targetColumnId: string,
  ): Promise<void> {
    const sql = `
      UPDATE issue AS i
      SET
        status = $2,
        position  = u.ord
      FROM unnest($1::uuid[]) WITH ORDINALITY AS u(id, ord)
      WHERE i.id = u.id;
    `;
    await this.issueRepository.query(sql, [issueIds, targetColumnId]);
  }

  
  async createIssue(projectId: string, dto: CreateIssueDto, user: User): Promise<{ success: string; branchName?: string; branchError?: string }> {
    // UUID 값들을 정리
    const cleanAssigneeId = this.cleanUuid(dto.assigneeId);
    const cleanReporterId = user.id;
    console.log('dto', dto);
    if (dto.assigneeId) {
      this.emailService.sendIssueAllocateEmail(
        dto.assigneeId,
        dto.title,
        projectId,
      );
    }
    const sql = `
      INSERT INTO issue (project_id, title, description, issue_type, status, assignee_id, reporter_id, start_date, due_date, position, tag)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;
    await this.issueRepository.query(sql, [
      projectId,
      dto.title,
      dto.description,
      dto.issueType,
      dto.status,
      cleanAssigneeId,
      cleanReporterId,
      dto.startDate,
      dto.dueDate,
      dto.position,
      dto.tag,
    ]);

    await this.projectService.updateProjectTagNumber(projectId);

    // 브랜치 생성 옵션이 활성화된 경우에만 브랜치 생성
    let branchName: string | undefined;
    let branchError: string | undefined;
    
    if (dto.createBranch !== false) { // 기본값이 true이므로 false가 아닌 경우 브랜치 생성
      try {
        const branchResult = await this.createBranchForIssue(projectId, dto.title, user.id);
        branchName = branchResult?.branchName;
        branchError = branchResult?.error;
        console.log(`브랜치 생성 결과 - branchName: ${branchName}, branchError: ${branchError}`);
      } catch (error) {
        console.error('브랜치 생성 실패:', error);
        branchError = '브랜치 생성 중 예상치 못한 오류가 발생했습니다.';
      }
    }

    const response = { 
      success: 'Issue created successfully',
      branchName,
      branchError
    };
    
    console.log(`createIssue 최종 응답:`, response);
    return response;
  }

  /**
   * 이슈를 위한 브랜치를 생성하는 메서드
   */
  private async createBranchForIssue(projectId: string, issueTitle: string, userId: string): Promise<{ branchName?: string; error?: string }> {
    try {
      // 프로젝트 정보 가져오기
      const project = await this.projectService.findOne(projectId);
      if (!project.repository_url) {
        console.log('프로젝트에 저장소 URL이 없어 브랜치를 생성하지 않습니다.');
        return { error: '프로젝트에 GitHub 저장소 URL이 설정되지 않았습니다.' };
      }

      // GitHub URL에서 owner/repo 추출
      const match = project.repository_url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        console.log('올바르지 않은 GitHub URL 형식입니다.');
        return { error: '올바르지 않은 GitHub 저장소 URL 형식입니다. (예: https://github.com/owner/repo)' };
      }

      const owner = match[1];
      const repo = match[2];

      // 저장소 정보를 가져와서 기본 브랜치 확인
      let baseBranch = 'main'; // 기본값
      try {
        const repoInfo = await this.githubService.getRepo(owner, repo, userId);
        baseBranch = repoInfo.default_branch || 'main';
        console.log(`저장소의 기본 브랜치: ${baseBranch}`);
      } catch (error) {
        console.log(`저장소 정보 조회 실패, 기본값 'main' 사용: ${error.message}`);
      }

      // 브랜치 생성
      const branchData = await this.githubService.createBranchFromIssue(
        userId,
        owner,
        repo,
        issueTitle,
        baseBranch
      );

      console.log(`이슈 '${issueTitle}'을 위한 브랜치가 생성되었습니다: ${branchData.branchName}`);
      console.log(`브랜치 생성 결과:`, branchData);
      
      return { branchName: branchData.branchName };
    } catch (error) {
      console.error('브랜치 생성 중 오류 발생:', error);
      
      // 오류 메시지 추출
      let errorMessage = '브랜치 생성에 실패했습니다.';
      
      if (error.message) {
        if (error.message.includes('저장소를 찾을 수 없습니다')) {
          errorMessage = 'GitHub 저장소를 찾을 수 없습니다. 저장소 이름과 소유자를 확인해주세요.';
        } else if (error.message.includes('접근 권한이 없습니다')) {
          errorMessage = 'GitHub 저장소에 대한 접근 권한이 없습니다. 저장소가 비공개인 경우 소유자에게 접근 권한을 요청하세요.';
        } else if (error.message.includes('GitHub 인증이 만료')) {
          errorMessage = 'GitHub 인증이 만료되었습니다. GitHub OAuth를 다시 연결해주세요.';
        } else if (error.message.includes('브랜치가 이미 존재')) {
          errorMessage = '동일한 이름의 브랜치가 이미 존재합니다.';
        } else if (error.message.includes('브랜치 생성 권한')) {
          errorMessage = '브랜치 생성 권한이 없습니다. GitHub OAuth에서 repo 권한을 확인해주세요.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { error: errorMessage };
    }

  }

  async deleteIssue(issueId: string, projectId: string): Promise<void> {
    await this.issueRepository.delete({ id: issueId, projectId });
  }

  async updateDates(id: string, startDate: string, dueDate: string) {
    const issue = await this.issueRepository.findOne({ where: { id } });
    if (!issue) throw new NotFoundException('이슈를 찾을 수 없습니다.');
    issue.startDate = startDate ? new Date(startDate) : null;
    issue.dueDate = dueDate ? new Date(dueDate) : null;
    await this.issueRepository.save(issue);
    return issue;
  }
}
