import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete, BadRequestException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto, ProjectResponseDto } from './dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/user.decorator';
import { User } from 'src/user/user.entity';
import { Project } from './project.entity';
import { CreateLabelDto } from './dto/label.dto';
import { EmailService } from 'src/email/email.service';

// 프로젝트 컨트롤러
@Controller('/projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly emailService: EmailService,
  ) {}

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
    console.log('getProjectMembers id', id);
    return this.projectService.getMembers(id);
  }

  // 현재 사용자의 프로젝트 내 역할 조회
  @Get(':id/my-role')
  @UseGuards(JwtAuthGuard)
  async getMyProjectRole(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.projectService.getUserRole(id, user.id);
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

  // 이메일로 프로젝트 초대
  @Post(':id/invite')
  @UseGuards(JwtAuthGuard)
  async sendEmailInvitation(
    @Param('id') id: string,
    @Body() body: { email: string; role: string },
    @CurrentUser() user: User,
  ) {
    const { email, role } = body;
    
    console.log('초대 요청 수신:', { id, email, role });

    // 프로젝트 ID 검증 (UUID 형식)
    const projectId = id;
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      console.log('프로젝트 ID가 유효하지 않습니다:', id);
      throw new BadRequestException('올바르지 않은 프로젝트 ID입니다.');
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('올바른 이메일 형식이 아닙니다.');
    }

    // 역할 검증
    if (!['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
      throw new BadRequestException('올바르지 않은 역할입니다.');
    }

    // 프로젝트 정보 조회
    const project = await this.projectService.findOne(id);
    if (!project) {
      throw new BadRequestException('프로젝트를 찾을 수 없습니다.');
    }

    // 사용자 권한 확인 (리더 또는 관리자만 초대 가능)
    const userRole = await this.projectService.getUserRole(id, user.id);
    if (!userRole.isLeader && userRole.role !== 'ADMIN') {
      throw new BadRequestException('초대 권한이 없습니다.');
    }

    // 관리자는 ADMIN 역할로 초대할 수 없음
    if (!userRole.isLeader && role === 'ADMIN') {
      throw new BadRequestException('관리자 임명은 리더만 가능합니다.');
    }

    try {
      // 초대 토큰 생성
      const token = await this.emailService.createInvitationToken(
        email,
        projectId,
        role,
      );

      // 초대 이메일 발송
      await this.emailService.sendProjectInvitationEmail(
        email,
        project.title,
        user.display_name,
        role,
        token,
      );

      return {
        success: true,
        message: '초대 이메일이 발송되었습니다.',
      };
    } catch (error) {
      throw new BadRequestException('초대 발송에 실패했습니다: ' + error.message);
    }
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


  @Post(':projectId/labels')
  async createLabel(@Param('projectId') projectId: string, @Body() body: CreateLabelDto) {
    return this.projectService.createLabel(projectId, body.name, body.color);
  }

  @Get(':projectId/labels')
  async getLabels(@Param('projectId') projectId: string) {
    return this.projectService.getLabels(projectId);
  }

  @Delete(':projectId/labels/:labelId')
  async deleteLabel(@Param('projectId') projectId: string, @Param('labelId') labelId: string) {
    return this.projectService.deleteLabel(projectId, labelId);
  }

  @Get(':projectId/labels-count')
  async getLabelCount(@Param('projectId') projectId: string) {
    return this.projectService.getLabelCount(projectId);
  }

  
}
