import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { User } from '../user/user.entity';
import { ProjectMember } from './project-member.entity';
import { DataSource } from 'typeorm';

// 프로젝트 서비스
@Injectable()
export class ProjectService {

  async getProjectSidebar(user: User): Promise<any[]> {
    const projects = await this.projectRepo
      .createQueryBuilder('project')
      .innerJoin('project_member', 'pm', 'pm.project_id = project.id')
      .leftJoinAndSelect('project.leader', 'leader')
      .leftJoinAndSelect('project.members', 'members')
      .where('pm.user_id = :userId', { userId: user.id })
      .orderBy('project.last_visited_at', 'DESC')
      .limit(4)
      .getMany();

    return projects;
  }

  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
    private readonly dataSource: DataSource,
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

    // 각 프로젝트별로 project_member 테이블에서 실제 멤버 수 계산
    const projectsWithMemberCount = await Promise.all(
      projects.map(async (project) => {
        const memberCount = await this.projectMemberRepo.count({
          where: { project_id: project.id },
        });

        return {
          id: project.id,
          title: project.title,
          description: project.description,
          project_key: project.project_key,
          status: project.status,
          repository_url: project.repository_url,
          due_date: project.due_date,
          expires_at: project.expires_at,
          project_people: memberCount, // project_member 테이블에서 계산된 실제 멤버 수
          project_leader: project.leader?.display_name || 'Unknown',
          leader_id: project.leader_id,
        };
      }),
    );

    return projectsWithMemberCount;
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
  async create(projectData: Partial<Project>): Promise<any> {
    const project = this.projectRepo.create(projectData);
    const savedProject = await this.projectRepo.save(project);

    // 프로젝트 생성 후 leader를 project_member에 LEADER 역할로 추가
    if (projectData.leader_id) {
      await this.addProjectMember(
        savedProject.id,
        projectData.leader_id,
        'LEADER',
      );
    }

    // leader의 display_name 가져오기
    const leader = await this.userRepo.findOne({
      where: { id: savedProject.leader_id },
    });

    // project_member 테이블에서 해당 프로젝트의 멤버 수 계산
    const memberCount = await this.projectMemberRepo.count({
      where: { project_id: savedProject.id },
    });

    return {
      ...savedProject,
      leader_display_name: leader?.display_name || 'Unknown',
      project_people: memberCount,
    };
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
    // 이미 멤버인지 확인
    const existingMember = await this.projectMemberRepo.findOne({
      where: { project_id: projectId, user_id: userId },
    });

    if (existingMember) {
      throw new Error('이미 프로젝트 멤버입니다.');
    }

    const projectMember = this.projectMemberRepo.create({
      project_id: projectId,
      user_id: userId,
      role: role,
    });
    await this.projectMemberRepo.save(projectMember);
  }

  // 프로젝트 팀원 목록 조회
  async getMembers(projectId: string) {
    const members = await this.projectMemberRepo
      .createQueryBuilder('pm')
      .leftJoinAndSelect('pm.user', 'user')
      .where('pm.project_id = :projectId', { projectId })
      .getMany();

    return members.map((member) => ({
      id: member.user.id,
      display_name: member.user.display_name,
      email: member.user.email,
      role: member.role,
    }));
  }

  // 현재 사용자의 프로젝트 내 역할 조회
  async getUserRole(projectId: string, userId: string) {
    // 프로젝트가 존재하는지 확인
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    // 사용자가 프로젝트 리더인지 확인
    const isLeader = project.leader_id === userId;

    // 프로젝트 멤버 테이블에서 사용자의 역할 확인
    const member = await this.projectMemberRepo.findOne({
      where: { project_id: projectId, user_id: userId },
    });

    if (!member) {
      // 프로젝트 멤버가 아닌 경우
      return {
        role: 'NONE',
        isLeader: false,
        message: '프로젝트 멤버가 아닙니다.',
      };
    }

    return {
      role: member.role,
      isLeader: isLeader,
      message: '성공적으로 역할을 조회했습니다.',
    };
  }

  // 프로젝트 팀원 역할 변경
  async changeMemberRole(projectId: string, userId: string, role: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 프로젝트 멤버 역할 변경
      await queryRunner.manager
        .createQueryBuilder()
        .update(ProjectMember)
        .set({ role })
        .where('project_id = :projectId AND user_id = :userId', {
          projectId,
          userId,
        })
        .execute();

      await queryRunner.commitTransaction();
      return { message: '역할이 변경되었습니다.' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 프로젝트 팀원 제거
  async removeMember(projectId: string, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 프로젝트 리더는 제거할 수 없음
      const project = await queryRunner.manager.findOne(Project, {
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('프로젝트를 찾을 수 없습니다.');
      }

      if (project.leader_id === userId) {
        throw new Error('프로젝트 리더는 제거할 수 없습니다.');
      }

      // 프로젝트 멤버 제거
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(ProjectMember)
        .where('project_id = :projectId AND user_id = :userId', {
          projectId,
          userId,
        })
        .execute();

      await queryRunner.commitTransaction();
      return { message: '팀원이 제거되었습니다.' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 프로젝트 리더 변경
  async changeLeader(projectId: string, newLeaderId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 새 리더가 프로젝트 멤버인지 확인
      const member = await queryRunner.manager.findOne(ProjectMember, {
        where: { project_id: projectId, user_id: newLeaderId },
      });

      if (!member) {
        throw new Error('프로젝트 멤버가 아닌 사용자는 리더가 될 수 없습니다.');
      }

      // 프로젝트 리더 변경
      await queryRunner.manager
        .createQueryBuilder()
        .update(Project)
        .set({ leader_id: newLeaderId })
        .where('id = :projectId', { projectId })
        .execute();

      await queryRunner.commitTransaction();
      return { message: '프로젝트 리더가 변경되었습니다.' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteProject(id: string) {
    // 연관된 데이터(멤버, 이슈 등)도 필요시 함께 삭제
    await this.projectMemberRepo.delete({ project_id: id });
    // TODO: 이슈 등 다른 연관 데이터도 삭제 필요시 추가

    await this.projectRepo.delete(id);
    return { message: '프로젝트가 삭제되었습니다.' };
  }


  async setProjectRepositoryUrl(projectId: string, repositoryUrl: string) {
    await this.projectRepo.update(projectId, { repository_url: repositoryUrl });
  }

  async getProjectTag(projectId: string) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });

    const tag : string = project?.tag + '-' + project?.tag_number;

    return {issue_tag: tag};
  }

  async updateProjectTagNumber(projectId: string) {
    // 프로젝트를 찾는다
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new Error('프로젝트를 찾을 수 없습니다.');
    }
    // tag_number를 +1 한다
    project.tag_number = (project.tag_number || 0) + 1;
    await this.projectRepo.save(project);
    return { tag_number: project.tag_number };
  }



  // 프로젝트 이름 조회
  async getProjectName(projectId: string) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    return project?.title;
  }
}
