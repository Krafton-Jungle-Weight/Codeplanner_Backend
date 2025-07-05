import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Issue } from './issues.entity';
import { createQueryBuilder, Repository } from 'typeorm';
import { UpdateIssueDto } from './dto/issue-info.dto';

import { CreateIssueDto } from './issues-update.dto';
import { EmailService } from 'src/email/email.service';
import { User } from 'src/user/user.entity';
import { ProjectService } from 'src/project/project.service';

@Injectable()
export class IssuesService {
  
  constructor(
    @InjectRepository(Issue)
    private issueRepository: Repository<Issue>,

    @Inject(EmailService)
    private readonly emailService: EmailService,

    @Inject(ProjectService)
    private readonly projectService: ProjectService,
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

  
  async createIssue(projectId: string, dto: CreateIssueDto, user: User): Promise<void> {
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
      dto.tag9 ,
    ]);

    await this.projectService.updateProjectTagNumber(projectId);
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
