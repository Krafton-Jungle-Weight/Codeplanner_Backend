import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { User } from '../user/user.entity';
import { ProjectMember } from './project-member.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
  ) {}

  async findAll(): Promise<any[]> {
    const projects = await this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.leader', 'leader')
      .leftJoinAndSelect('project.members', 'members')
      .getMany();

    return projects.map(project => ({
      id: project.id,
      title: project.title,
      descrition: project.descrition,
      project_key: project.project_key,
      status: project.status,
      repository_url: project.repository_url,
      due_date: project.due_date,
      expires_at: project.expires_at,
      project_people: project.members?.length || 0,
      project_leader: project.leader?.display_name || 'Unknown',
      leader_id: project.leader_id
    }));
  }

  async findOne(id: string): Promise<any> {
    const project = await this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.leader', 'leader')
      .leftJoinAndSelect('project.members', 'members')
      .where('project.id = :id', { id })
      .getOne();

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return {
      id: project.id,
      title: project.title,
      descrition: project.descrition,
      project_key: project.project_key,
      status: project.status,
      repository_url: project.repository_url,
      due_date: project.due_date,
      expires_at: project.expires_at,
      project_people: project.members?.length || 0,
      project_leader: project.leader?.display_name || 'Unknown',
      leader_id: project.leader_id
    };
  }

  async create(projectData: Partial<Project>): Promise<Project> {
    const project = this.projectRepo.create(projectData);
    return await this.projectRepo.save(project);
  }

  async update(id: string, projectData: Partial<Project>): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, projectData);
    return await this.projectRepo.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepo.remove(project);
  }
}

