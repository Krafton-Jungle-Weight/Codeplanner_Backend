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
import { NotificationService } from 'src/notification/notification.service';
import { ActivityService } from 'src/activity/activity.service';


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

    @Inject(NotificationService)
    private readonly notificationService: NotificationService,

    @Inject(ActivityService)
    private readonly activityService: ActivityService,

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
    userId?: string, // Activity 로깅을 위해 userId 추가
  ): Promise<Issue> {
    const originalIssue = await this.findIssueById(issueId, projectId);
    const changes: any[] = [];

    // 변경사항 추적
    if (dto.title !== undefined && dto.title !== originalIssue.title) {
      changes.push({ field: 'title', oldValue: originalIssue.title, newValue: dto.title });
      originalIssue.title = dto.title;
    }
    if (dto.description !== undefined && dto.description !== originalIssue.description) {
      changes.push({ field: 'description', oldValue: originalIssue.description, newValue: dto.description });
      originalIssue.description = dto.description;
    }
    if (dto.issueType !== undefined && dto.issueType !== originalIssue.issueType) {
      changes.push({ field: 'issueType', oldValue: originalIssue.issueType, newValue: dto.issueType });
      originalIssue.issueType = dto.issueType;
    }
    if (dto.status !== undefined && dto.status !== originalIssue.status) {
      changes.push({ field: 'status', oldValue: originalIssue.status, newValue: dto.status });
      originalIssue.status = dto.status;
    }

    if (dto.assigneeId !== undefined) {
      const cleanAssigneeId = this.cleanUuid(dto.assigneeId || undefined) || null;
      if (cleanAssigneeId !== originalIssue.assigneeId) {
        changes.push({ field: 'assigneeId', oldValue: originalIssue.assigneeId, newValue: cleanAssigneeId });
        originalIssue.assigneeId = cleanAssigneeId;
      }
    }
    if (dto.reporterId !== undefined) {
      const cleanReporterId = this.cleanUuid(dto.reporterId || undefined) || null;
      if (cleanReporterId !== originalIssue.reporterId) {
        changes.push({ field: 'reporterId', oldValue: originalIssue.reporterId, newValue: cleanReporterId });
        originalIssue.reporterId = cleanReporterId;
      }
    }
    if (dto.startDate !== undefined) {
      const newStartDate = dto.startDate ? new Date(dto.startDate) : null;
      if (newStartDate !== originalIssue.startDate) {
        changes.push({ field: 'startDate', oldValue: originalIssue.startDate, newValue: newStartDate });
        originalIssue.startDate = newStartDate;
      }
    }
    if (dto.dueDate !== undefined) {
      const newDueDate = dto.dueDate ? new Date(dto.dueDate) : null;
      if (newDueDate !== originalIssue.dueDate) {
        changes.push({ field: 'dueDate', oldValue: originalIssue.dueDate, newValue: newDueDate });
        originalIssue.dueDate = newDueDate;
      }
    }

    const updatedIssue = await this.issueRepository.save(originalIssue);

    // Activity 로깅 (변경사항이 있을 때만)
    if (changes.length > 0 && userId) {
      try {
        await this.activityService.createActivity({
          projectId,
          issueId,
          userId,
          actionType: 'issue_updated',
          issueTitle: updatedIssue.title,
          details: { changes },
        });
      } catch (error) {
        console.error('Activity 로깅 실패:', error);
        // Activity 로깅 실패해도 기존 로직에는 영향 없음
      }
    }

    return updatedIssue;
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
    projectId?: string,
    userId?: string,
  ): Promise<void> {
    // Activity 로깅을 위해 변경 전 이슈들의 상태 조회
    let originalIssues: Issue[] = [];
    if (userId && projectId) {
      try {
        originalIssues = await this.issueRepository.findByIds(issueIds);
      } catch (error) {
        console.error('Activity 로깅을 위한 이슈 조회 실패:', error);
      }
    }

    const sql = `
      UPDATE issue AS i
      SET
        status = $2,
        position  = u.ord
      FROM unnest($1::uuid[]) WITH ORDINALITY AS u(id, ord)
      WHERE i.id = u.id;
    `;
    await this.issueRepository.query(sql, [issueIds, targetColumnId]);

    // Activity 로깅 추가 (상태가 실제로 변경된 이슈들만, 중복 방지를 위해 하나만)
    if (userId && projectId && originalIssues.length > 0) {
      try {
        // 상태가 변경된 이슈들 찾기
        const changedIssues = originalIssues.filter(issue => issue.status !== targetColumnId);
        
        // 실제로 상태가 변경된 이슈가 있는 경우만 로깅 (보통 드래그앤드롭은 1개 이슈)
        if (changedIssues.length > 0) {
          // 첫 번째 변경된 이슈만 로깅 (드래그앤드롭은 보통 하나의 이슈만 이동)
          const movedIssue = changedIssues[0];
          await this.activityService.createActivity({
            projectId,
            issueId: movedIssue.id,
            userId,
            actionType: 'issue_updated',
            issueTitle: movedIssue.title,
            details: {
              changes: [{
                field: 'status',
                oldValue: movedIssue.status,
                newValue: targetColumnId,
                action: 'drag_and_drop'
              }]
            },
          });
        }
      } catch (error) {
        console.error('Activity 로깅 실패:', error);
        // Activity 로깅 실패해도 기존 로직에는 영향 없음
      }
    }
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

    // 알림 기능을 위해 쿼리문 마지막에 'RETURNING id;' 추가
    const sql = `
      INSERT INTO issue (project_id, title, description, issue_type, status, assignee_id, reporter_id, start_date, due_date, position, tag)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id;
    `;
    const result = await this.issueRepository.query(sql, [
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
      dto.tag ,
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

  
    {/* 이슈 생성시 알림 생성 */ }
    const projectName = await this.projectService.getProjectName(projectId);

    await this.notificationService.createNotification(user.id, 'issue_created', {
      issueId: result[0]?.id,
      issueTitle: dto.title,
      projectName: projectName,
      projectId: projectId,
      createdAt: new Date().toISOString(),
    });

    console.log('notification payload', {
      issueId: result,
      issueTitle: dto.title,
      projectName: projectName,
      projectId: projectId,
    });
    {/* 이슈 생성시 알림 생성 여기까지 */}

    // Activity 로깅 추가
    try {
      await this.activityService.createActivity({
        projectId,
        issueId: result[0]?.id,
        userId: user.id,
        actionType: 'issue_created',
        issueTitle: dto.title,
        details: {
          issueType: dto.issueType,
          status: dto.status,
          assigneeId: cleanAssigneeId,
          reporterId: cleanReporterId,
        },
      });
    } catch (error) {
      console.error('Activity 로깅 실패:', error);
      // Activity 로깅 실패해도 기존 로직에는 영향 없음
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

  async deleteIssue(issueId: string, projectId: string, userId?: string): Promise<void> {
    // Activity 로깅을 위해 삭제 전에 이슈 정보 가져오기
    let issueTitle = '';
    if (userId) {
      try {
        const issue = await this.findIssueById(issueId, projectId);
        issueTitle = issue.title;
      } catch (error) {
        console.error('삭제할 이슈 정보 조회 실패:', error);
      }
    }

    await this.issueRepository.delete({ id: issueId, projectId });

    // Activity 로깅 추가
    if (userId && issueTitle) {
      try {
        await this.activityService.createActivity({
          projectId,
          issueId,
          userId,
          actionType: 'issue_deleted',
          issueTitle,
          details: { deletedAt: new Date().toISOString() },
        });
      } catch (error) {
        console.error('Activity 로깅 실패:', error);
        // Activity 로깅 실패해도 기존 로직에는 영향 없음
      }
    }
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
