import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { User } from '../user/user.entity';
import { ProjectMember } from './project-member.entity';

// 프로젝트 서비스
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

  // 프로젝트 전체 조회
  async findAll(): Promise<any[]> {
    const projects = await this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.leader', 'leader')
      .leftJoinAndSelect('project.members', 'members')
      .getMany();

    return projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      project_key: project.project_key,
      status: project.status,
      repository_url: project.repository_url,
      due_date: project.due_date,
      expires_at: project.expires_at,
      project_people: project.members?.length || 0,
      project_leader: project.leader?.display_name || 'Unknown',
      leader_id: project.leader_id,
    }));
  }

  async findAllByUser(user: User): Promise<any[]> {
    const projects = await this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.leader', 'leader')
      .leftJoinAndSelect('project.members', 'members')
      .innerJoin('project_member', 'pm', 'pm.project_id = project.id')
      .where('pm.user_id = :userId', { userId: user.id })
      .getMany();

    return projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      project_key: project.project_key,
      status: project.status,
      repository_url: project.repository_url,
      due_date: project.due_date,
      expires_at: project.expires_at,
      project_people: project.members?.length || 0,
      project_leader: project.leader?.display_name || 'Unknown',
      leader_id: project.leader_id,
    }));
  }

  // 특정 프로젝트 하나 조회
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
      description: project.description,
      project_key: project.project_key,
      status: project.status,
      repository_url: project.repository_url,
      due_date: project.due_date,
      expires_at: project.expires_at,
      project_people: project.members?.length || 0,
      project_leader: project.leader?.display_name || 'Unknown',
      leader_id: project.leader_id,
    };
  }

  // 프로젝트 생성
  async create(projectData: Partial<Project>): Promise<Project> {
    const project = this.projectRepo.create(projectData);
    const savedProject = await this.projectRepo.save(project);

    // 프로젝트 생성 후 leader를 project_member에 READER 역할로 추가
    if (projectData.leader_id) {
      await this.addProjectMember(
        savedProject.id,
        projectData.leader_id,
        'READER',
      );
    }

    return savedProject;
  }

  // 프로젝트 수정
  async update(id: string, projectData: Partial<Project>): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, projectData);
    return await this.projectRepo.save(project);
  }

  // 프로젝트 삭제
  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepo.remove(project);
  }

  // 프로젝트 멤버 추가
  async addProjectMember(
    projectId: string,
    userId: string,
    role: string = 'MEMBER',
  ): Promise<void> {
    const projectMember = this.projectMemberRepo.create({
      project_id: projectId,
      user_id: userId,
      role: role,
    });
    await this.projectMemberRepo.save(projectMember);
  }
}
