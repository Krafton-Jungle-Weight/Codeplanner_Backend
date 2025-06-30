import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from './project.entity';
import { CreateProjectDto, UpdateProjectDto, ProjectResponseDto } from './dto';

// 프로젝트 컨트롤러
@Controller('projects')
export class ProjectController {
    constructor(private readonly projectService: ProjectService) {}

    // 프로젝트 전체 조회
    @Get()
    async getAll(): Promise<ProjectResponseDto[]> {
        const projects = await this.projectService.findAll();
        return projects.map(project => ({
            ...project,
            due_date: project.due_date ? this.formatDate(project.due_date) : null,
            expires_at: project.expires_at ? this.formatDate(project.expires_at) : null,
        }));
    }

    // 특정 프로젝트 하나 조회
    @Get(':id')  
    async getOne(@Param('id') id: string): Promise<ProjectResponseDto> {
        const project = await this.projectService.findOne(id);
        return {
            ...project,
            due_date: project.due_date ? this.formatDate(project.due_date) : null,
            expires_at: project.expires_at ? this.formatDate(project.expires_at) : null,
        };
    }

    // 프로젝트 생성
    @Post('create')
    async createProject(@Body() createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
        // 프론트엔드 데이터를 DB 스키마에 맞게 변환
        const projectData = {
            title: createProjectDto.title,
            descrition: createProjectDto.descrition,
            project_key: this.generateProjectKey(createProjectDto.title), // 프로젝트 키 자동 생성
            leader_id: createProjectDto.leader_id || '550e8400-e29b-41d4-a716-446655440001', // 기본값 또는 실제 leader_id(추후 수정)
            status: createProjectDto.status || '대기중',
            repository_url: createProjectDto.repository_url || undefined,
            due_date: createProjectDto.due_date ? new Date(createProjectDto.due_date) : undefined,
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
            repository_url: createdProject.repository_url || undefined,
            due_date: createdProject.due_date ? this.formatDate(createdProject.due_date) : undefined,
            expires_at: createdProject.expires_at ? this.formatDate(createdProject.expires_at) : undefined,
            project_people: 0, // 새로 생성된 프로젝트는 멤버가 0명
            project_leader: createProjectDto.project_leader || '관리자', // 프론트엔드에서 받은 값
            leader_id: createdProject.leader_id
        };
    }

    // // 프로젝트 수정
    // @Put(':id')
    // updateProject(
    //     @Param('id') id: string,
    //     @Body() body: Partial<Project>
    // ): Promise<Project> {
    //     return this.projectService.update(id, body);
    // }

    // // 프로젝트 삭제
    // @Delete(':id')
    // deleteProject(@Param('id') id: string): Promise<void> {
    //     return this.projectService.remove(id);
    // }

    // 날짜 포맷팅
    private formatDate(date: Date | string): string {
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}년 ${month}월 ${day}일`;
    }

    // 프로젝트 키 생성
    private generateProjectKey(title: string): string {
        // 프로젝트 제목에서 프로젝트 키 생성 (예: "나만무 프로젝트" -> "NMM001")
        const prefix = title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
        const timestamp = Date.now().toString().slice(-3);
        return `${prefix}${timestamp}`;
    }
}

