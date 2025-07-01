import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from 'src/project/project-member.entity';

@Injectable()
export class SummaryService {
  constructor(
    @InjectRepository(ProjectMember)
    private projectMemberRepository: Repository<ProjectMember>,
  ) {}

  async getMembers(projectId: string) {
    const members = await this.projectMemberRepository.find({
      where: { project_id: projectId },
    });
    return members;
  }
}
