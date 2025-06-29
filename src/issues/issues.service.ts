import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Issue } from './issues.entity';
import { Repository } from 'typeorm';
import { IssueInfoDto } from './dto/issue-info.dto';
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
  ): Promise<IssueInfoDto> {
    const issue = await this.issueRepository.findOne({
      where: {
        id: issueId,
        projectId: projectId,
      },
    });

    if (!issue) {
      throw new NotFoundException('해당 이슈를 찾을 수 없습니다.');
    }

    // 필요한 기본값 처리
    return {
      id: issue.id,
      projectId: issue.projectId,
      title: issue.title,
      description: issue.description ?? '', // 필수니까 null 방지
      issueType: issue.issueType ?? 'task',
      status: issue.status ?? 'TODO',
      assigneeId: issue.assigneeId ?? null,
      reporterId: issue.reporterId ?? null,
      startDate: issue.startDate ?? null,
      dueDate: issue.dueDate ?? null,
    };
  }
}
