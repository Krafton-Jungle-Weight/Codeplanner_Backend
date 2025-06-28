import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from './project.entity';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async getAll(): Promise<any[]> {
    const projects = await this.projectService.findAll();
    return projects.map(project => ({
      ...project,
      due_date: project.due_date ? this.formatDate(project.due_date) : null,
      expires_at: project.expires_at ? this.formatDate(project.expires_at) : null,
    }));
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<any> {
    const project = await this.projectService.findOne(id);
    return {
      ...project,
      due_date: project.due_date ? this.formatDate(project.due_date) : null,
      expires_at: project.expires_at ? this.formatDate(project.expires_at) : null,
    };
  }

  @Post()
  async createProject(@Body() body: any): Promise<any> {
    // 프론트엔드 데이터를 DB 스키마에 맞게 변환
    const projectData = {
      title: body.title,
      descrition: body.descrition,
      project_key: this.generateProjectKey(body.title), // 프로젝트 키 자동 생성
      leader_id: body.leader_id || '550e8400-e29b-41d4-a716-446655440001', // 기본값 또는 실제 leader_id
      status: body.status || '대기중',
      repository_url: body.repository_url || null,
      due_date: body.due_date ? new Date(body.due_date) : undefined,
      expires_at: undefined
    };

    const createdProject = await this.projectService.create(projectData);
    
    // 응답 데이터 포맷팅
    return {
      id: createdProject.id,
      title: createdProject.title,
      descrition: createdProject.descrition,
      project_key: createdProject.project_key,
      status: createdProject.status,
      repository_url: createdProject.repository_url,
      due_date: createdProject.due_date ? this.formatDate(createdProject.due_date) : null,
      expires_at: createdProject.expires_at ? this.formatDate(createdProject.expires_at) : null,
      project_people: 0, // 새로 생성된 프로젝트는 멤버가 0명
      project_leader: body.project_leader || '관리자', // 프론트엔드에서 받은 값
      leader_id: createdProject.leader_id
    };
  }

  @Put(':id')
  updateProject(
    @Param('id') id: string,
    @Body() body: Partial<Project>
  ): Promise<Project> {
    return this.projectService.update(id, body);
  }

  @Delete(':id')
  deleteProject(@Param('id') id: string): Promise<void> {
    return this.projectService.remove(id);
  }

  private formatDate(date: Date | string): string {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
  }

  private generateProjectKey(title: string): string {
    // 프로젝트 제목에서 프로젝트 키 생성 (예: "나만무 프로젝트" -> "NMM001")
    const prefix = title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    const timestamp = Date.now().toString().slice(-3);
    return `${prefix}${timestamp}`;
  }
}

