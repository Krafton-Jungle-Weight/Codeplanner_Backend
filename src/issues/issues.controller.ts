import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto, ReorderIssuesDto } from './issues-update.dto';
import { UpdateIssueDto } from './dto/issue-info.dto';
import { AssignReviewersDto, ReviewDto, RejectReviewDto } from './dto/reviewer.dto';
import { Issue } from './issues.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/user.decorator';
import { User } from 'src/user/user.entity';

@Controller('projects')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/:projectId/issues')
  getIssues(@Param('projectId') projectId: string): Promise<any[]> {
    return this.issuesService.getIssues(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:projectId/issues/updateOrder')
  async updateIssueOrderAndStatus(
    @Param('projectId') projectId: string,
    @Body() dto: ReorderIssuesDto,
    @CurrentUser() user: User,
  ) {
    // console.log('=== 컨트롤러에서 요청 받음 ===');
    // console.log('전체 DTO:', dto);
    // console.log('DTO 타입:', typeof dto);
    // console.log('issueIds:', dto.issueIds);
    // console.log('targetColumnId:', dto.targetColumnId);

    await this.issuesService.updateIssueOrderAndStatus(
      dto.issueIds,
      dto.targetColumnId,
      projectId,
      user.id,
    );
    return { success: 'Issue order and status updated successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/:projectId/issues/create')
  async createIssue(
    @Param('projectId') projectId: string,
    @Body() dto: CreateIssueDto,
    @CurrentUser() user: User,
  ) {
    console.log(projectId, dto);
    const result = await this.issuesService.createIssue(projectId, dto, user);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:projectId/my-issues-count')
  async getMyIssueCount(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ): Promise<{ count: number }> {
    const count = await this.issuesService.getIssuesCurrentUserCount(
      user.id,
      projectId,
    );
    return { count };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:projectId/my-issues')
  getMyIssue(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ): Promise<any[]> {
    return this.issuesService.getIssuesCurrentUser(user.id, projectId);
  }

  @Get('/:projectId/:issueId')
  getIssueById(
    @Param('issueId') issueId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.issuesService.findIssueById(issueId, projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:projectId/:issueId')
  updateIssueInfo(
    @Body() IssueInfoDto: UpdateIssueDto,
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @CurrentUser() user: User,
  ): Promise<Issue> {
    return this.issuesService.updateIssueInfo(
      IssueInfoDto,
      projectId,
      issueId,
      user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:projectId/issues/:issueId')
  deleteIssue(
    @Param('issueId') issueId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    return this.issuesService.deleteIssue(issueId, projectId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/issues/:id/update-dates')
  async updateIssueDates(
    @Param('id') id: string,
    @Body() body: { startDate: string; dueDate: string; projectId: string },
    @CurrentUser() user: User,
  ) {
    return this.issuesService.updateIssueInfo(
      {
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      },
      body.projectId,
      id,
      user.id,
    );
  }

  // 이슈 업데이트 (issue detail)
  @UseGuards(JwtAuthGuard)
  @Patch('/issues/:projectId/:issueId')
  async updateIssue(
    @Param('issueId') issueId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateIssueDto,
    @CurrentUser() user: User,
  ) {
    return this.issuesService.updateIssueInfo(dto, projectId, issueId, user.id);
  }

  // 리뷰어 지정
  @UseGuards(JwtAuthGuard)
  @Post('/:projectId/issues/:issueId/assign-reviewers')
  async assignReviewers(
    @Param('issueId') issueId: string,
    @Param('projectId') projectId: string,
    @Body() dto: AssignReviewersDto,
  ) {
    return this.issuesService.assignReviewers(issueId, projectId, dto);
  }

  // 리뷰 승인
  @UseGuards(JwtAuthGuard)
  @Post('/:projectId/issues/:issueId/review/approve')
  async approveReview(
    @Param('issueId') issueId: string,
    @Param('projectId') projectId: string,
    @Body() dto: ReviewDto,
    @CurrentUser() user: User,
  ) {
    return this.issuesService.approveReview(issueId, projectId, user.id, dto);
  }

  // 리뷰 거부
  @UseGuards(JwtAuthGuard)
  @Post('/:projectId/issues/:issueId/review/reject')
  async rejectReview(
    @Param('issueId') issueId: string,
    @Param('projectId') projectId: string,
    @Body() dto: RejectReviewDto,
    @CurrentUser() user: User,
  ) {
    return this.issuesService.rejectReview(issueId, projectId, user.id, dto);
  }
}
