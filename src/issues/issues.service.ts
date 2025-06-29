import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Issue } from './issues.entity';
import { Repository } from 'typeorm';
import { UpdateIssueDto } from './dto/issue-info.dto';
import { CreateIssueDto } from './dto/create-issue.dto';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private issueRepository: Repository<Issue>,
  ) {}

  async getIssues(projectId: string) {
    return await this.issueRepository.find({
      where: { projectId },
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

  async createIssue(createIssueDto: CreateIssueDto) {}

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
    if (dto.startDate !== undefined) issue.startDate = dto.startDate;
    if (dto.dueDate !== undefined) issue.dueDate = dto.dueDate;

    return await this.issueRepository.save(issue);
  }
}
