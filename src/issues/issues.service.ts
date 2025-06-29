import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Issue } from './issues.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private issueRepository: Repository<Issue>,
  ) {}

  async getIssues(projectId: string) {
    return this.issueRepository.find({
      where: { projectId },
    });
  }
}
