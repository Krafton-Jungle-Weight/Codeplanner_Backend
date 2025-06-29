import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Issue } from './issues.entity';
import { Repository } from 'typeorm';
import { CreateIssueDto } from 'src/dto/create-issue.dto';

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

  async createIssue(createIssueDto: CreateIssueDto) {}
}
