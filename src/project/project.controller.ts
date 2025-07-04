import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto, ProjectResponseDto } from './dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/user.decorator';
import { User } from 'src/user/user.entity';
import { Project } from './project.entity';

// 프로젝트 컨트롤러
@Controller('/projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  // 프로젝트 전체 조회
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(@CurrentUser() user: User): Promise<ProjectResponseDto[]> {
    const projects = await this.projectService.findAllByUser(user);
    return projects.map((project) => ({
      ...project,
      due_date: project.due_date ? this.formatDate(project.due_date) : null,
      expires_at: project.expires_at
        ? this.formatDate(project.expires_at)
        : null,
    }));
  }

  // 특정 프로젝트 하나 조회
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string): Promise<ProjectResponseDto> {
    const project = await this.projectService.findOne(id);
    console.log('project', project);
    return {
      ...project,
      due_date: project.due_date ? this.formatDate(project.due_date) : null,
      expires_at: project.expires_at
        ? this.formatDate(project.expires_at)
        : null,
    };
  }

  // 프로젝트 생성
  @UseGuards(JwtAuthGuard)
  @Post('create/')
  async createProject(
    @CurrentUser() user: User,
    @Body() createProjectDto: CreateProjectDto,
    
  ): Promise<ProjectResponseDto> {
    // 프론트엔드 데이터를 DB 스키마에 맞게 변환
    const projectData = {
      title: createProjectDto.title,
      description: createProjectDto.description,
      project_key: this.generateProjectKey(createProjectDto.title), // 프로젝트 키 자동 생성
      leader_id: user.id, // 현재 로그인한 사용자를 leader로 설정
      status: '대기중',
      repository_url: createProjectDto.repository_url,
      due_date: createProjectDto.due_date
        ? new Date(createProjectDto.due_date)
        : undefined,
      expires_at: new Date(),
      tag: createProjectDto.tag,
    };

    const createdProject = await this.projectService.create(projectData);

    // 응답 데이터 포맷팅
    return {
      id: createdProject.id,
      title: createdProject.title,
      description: createdProject.description,
      project_key: createdProject.project_key,
      status: createdProject.status,
      repository_url: createdProject.repository_url || undefined,
      due_date: createdProject.due_date
        ? this.formatDate(createdProject.due_date)
        : undefined,
      expires_at: createdProject.expires_at
        ? this.formatDate(createdProject.expires_at)
        : undefined,
      project_people: createdProject.project_people, // 서비스에서 계산된 멤버 수
      project_leader: createdProject.leader_display_name, // 서비스에서 가져온 leader display_name
      leader_id: createdProject.leader_id,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateProject(
    @Param('id') id: string,
    @Body() body: Partial<Project>,
    @CurrentUser() user: User,
  ): Promise<ProjectResponseDto> {
    // 권한 체크 등 필요시 추가
    const updated = await this.projectService.update(id, body);
    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      project_key: updated.project_key,
      status: updated.status,
      repository_url: updated.repository_url,
      due_date: updated.due_date
        ? this.formatDate(updated.due_date)
        : undefined,
      expires_at: updated.expires_at
        ? this.formatDate(updated.expires_at)
        : undefined,
      leader_id: updated.leader_id,
      project_people: updated.members?.length || 0,
      project_leader: updated.leader?.display_name || 'Unknown',
    };
  }

  // 프로젝트 팀원 목록 조회
  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  async getProjectMembers(@Param('id') id: string) {
    // console.log('getProjectMembers id', id);
    return this.projectService.getMembers(id);
  }

  // 프로젝트 팀원 초대
  @Post(':id/members/invite')
  @UseGuards(JwtAuthGuard)
  async inviteMember(
    @Param('id') id: string,
    @Body() body: { userId: string; role: string },
    @CurrentUser() user: User,
  ) {
    return this.projectService.addProjectMember(id, body.userId, body.role);
  }

  // 프로젝트 팀원 역할 변경
  @Patch(':id/members/:userId/role')
  @UseGuards(JwtAuthGuard)
  async changeMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { role: string },
    @CurrentUser() user: User,
  ) {
    return this.projectService.changeMemberRole(id, userId, body.role);
  }

  // 프로젝트 팀원 제거
  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    return this.projectService.removeMember(id, userId);
  }

  // 프로젝트 리더 변경
  @Patch(':id/leader')
  @UseGuards(JwtAuthGuard)
  async changeLeader(
    @Param('id') id: string,
    @Body() body: { leader_id: string },
    @CurrentUser() user: User,
  ) {
    return this.projectService.changeLeader(id, body.leader_id);
  }

  // 프로젝트 삭제
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteProject(@Param('id') id: string) {
    return this.projectService.deleteProject(id);
  }

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
    const prefix = title
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    const timestamp = Date.now().toString().slice(-3);
    return `${prefix}${timestamp}`;
  }

  @Get(':projectId/tag')
  async getProjectTag(@Param('projectId') projectId: string) {
    return this.projectService.getProjectTag(projectId);
  }
}
