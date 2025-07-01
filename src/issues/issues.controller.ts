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
import { Issue } from './issues.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/user.decorator';



Controller('projects')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get('/:projectId/issues')
  getIssues(@Param('projectId') projectId: string) {
    return this.issuesService.getIssues(projectId);
  }

  @Patch('/:projectId/issues/updateOrder')
  async updateIssueOrderAndStatus(@Body() dto: ReorderIssuesDto) {
    // console.log('=== 컨트롤러에서 요청 받음 ===');
    // console.log('전체 DTO:', dto);
    // console.log('DTO 타입:', typeof dto);
    // console.log('issueIds:', dto.issueIds);
    // console.log('targetColumnId:', dto.targetColumnId);

    await this.issuesService.updateIssueOrderAndStatus(
      dto.issueIds,
      dto.targetColumnId,
    );
    return { success: 'Issue order and status updated successfully' };
  }

  @Post('/:projectId/issues/create')
  async createIssue(
    @Param('projectId') projectId: string,
    @Body() dto: CreateIssueDto,
  ) {
    console.log(projectId, dto);
    await this.issuesService.createIssue(projectId, dto);
    return { success: 'Issue created successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/projects/:projectId/my-issues-count')
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
  @Get('/projects/:projectId/my-issues')
  getMyIssue(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ): Promise<Issue[]> {
    return this.issuesService.getIssuesCurrentUser(user.id, projectId);
  }

  @Get('/:projectId/:issueId')
  getIssueById(
    @Param('issueId') issueId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.issuesService.findIssueById(issueId, projectId);
  }

  @Patch('/:projectId/:issueId')
  updateIssueInfo(
    @Body() IssueInfoDto: UpdateIssueDto,
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
  ): Promise<Issue> {
    return this.issuesService.updateIssueInfo(IssueInfoDto, projectId, issueId);
  }

  @Delete('/:projectId/issues/:issueId')
  deleteIssue(
    @Param('issueId') issueId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.issuesService.deleteIssue(issueId, projectId);
  }

  @Post('/issues/:id/update-dates')
  async updateIssueDates(
    @Param('id') id: string,
    @Body() body: { startDate: string; dueDate: string; projectId: string },
  ) {
    return this.issuesService.updateIssueInfo(
      {
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      },
      body.projectId,
      id,
    );
  }
}
