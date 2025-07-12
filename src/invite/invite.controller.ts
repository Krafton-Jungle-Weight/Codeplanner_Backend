import { Controller, Get, Post, Query, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { ProjectService } from 'src/project/project.service';
import { UserService } from 'src/user/user.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/user.decorator';
import { User } from 'src/user/user.entity';

@Controller('/invite')
export class InviteController {
  constructor(
    private readonly emailService: EmailService,
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
  ) {}

  // 초대 토큰 검증
  @Get()
  async verifyInvitation(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('토큰이 필요합니다.');
    }

    // 토큰 검증
    const invitation = await this.emailService.verifyInvitationToken(token);
    if (!invitation) {
      throw new BadRequestException('유효하지 않거나 만료된 초대 링크입니다.');
    }

    // 프로젝트 정보 조회
    const project = await this.projectService.findOne(String(invitation.project_id));
    if (!project) {
      throw new BadRequestException('프로젝트를 찾을 수 없습니다.');
    }

    // 사용자 계정 존재 확인
    const existingUser = await this.userService.findByEmail(invitation.email);

    const roleDisplayName = {
      'ADMIN': '관리자',
      'MEMBER': '멤버', 
      'VIEWER': '뷰어',
    }[invitation.role] || invitation.role;

    return {
      success: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        roleDisplayName,
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
        },
        hasAccount: !!existingUser,
        token: token,
      },
    };
  }

  // 초대 수락
  @Post('accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvitation(
    @Query('token') token: string,
    @CurrentUser() user: User,
  ) {
    if (!token) {
      throw new BadRequestException('토큰이 필요합니다.');
    }

    // 토큰 검증
    const invitation = await this.emailService.verifyInvitationToken(token);
    if (!invitation) {
      throw new BadRequestException('유효하지 않거나 만료된 초대 링크입니다.');
    }

    // 초대된 이메일과 현재 로그인한 사용자 이메일 확인
    if (user.email !== invitation.email) {
      throw new BadRequestException('초대된 사용자와 로그인된 사용자가 다릅니다.');
    }

    // 이미 프로젝트 멤버인지 확인
    const userRole = await this.projectService.getUserRole(
      String(invitation.project_id),
      user.id,
    );
    if (userRole.role !== 'NONE') {
      throw new BadRequestException('이미 이 프로젝트의 멤버입니다.');
    }

    try {
      // 프로젝트 멤버로 추가
      await this.projectService.addProjectMember(
        String(invitation.project_id),
        String(user.id),
        invitation.role,
      );

      // 사용된 토큰 삭제
      await this.emailService.deleteInvitationToken(invitation.id);

      return {
        success: true,
        message: '프로젝트에 성공적으로 참여했습니다.',
        projectId: invitation.project_id,
      };
    } catch (error) {
      throw new BadRequestException('프로젝트 참여 중 오류가 발생했습니다: ' + error.message);
    }
  }

  // 초대 거부
  @Post('decline')
  @UseGuards(JwtAuthGuard)
  async declineInvitation(
    @Query('token') token: string,
    @CurrentUser() user: User,
  ) {
    if (!token) {
      throw new BadRequestException('토큰이 필요합니다.');
    }

    // 토큰 검증
    const invitation = await this.emailService.verifyInvitationToken(token);
    if (!invitation) {
      throw new BadRequestException('유효하지 않거나 만료된 초대 링크입니다.');
    }

    // 초대된 이메일과 현재 로그인한 사용자 이메일 확인
    if (user.email !== invitation.email) {
      throw new BadRequestException('초대된 사용자와 로그인된 사용자가 다릅니다.');
    }

    try {
      // 토큰 삭제 (거부 처리)
      await this.emailService.deleteInvitationToken(invitation.id);

      return {
        success: true,
        message: '초대를 거부했습니다.',
      };
    } catch (error) {
      throw new BadRequestException('초대 거부 중 오류가 발생했습니다: ' + error.message);
    }
  }
} 