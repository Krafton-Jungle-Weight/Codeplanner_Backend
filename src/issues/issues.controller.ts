import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto, ReorderIssuesDto } from './issues-update.dto';
import { UpdateIssueDto } from './dto/issue-info.dto';
import { Issue } from './issues.entity';

@Controller('api')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get('/projects/:projectId/issues')
  getIssues(@Param('projectId') projectId: string) {
    return this.issuesService.getIssues(projectId);
  }

  @Patch('/projects/:projectId/issues/updateOrder')
  async updateIssueOrderAndStatus(@Body() dto: ReorderIssuesDto) {
    await this.issuesService.updateIssueOrderAndStatus(
      dto.issueIds,
      dto.targetColumnId,
    );
    return { success: 'Issue order and status updated successfully' };
  }

  @Post('/projects/:projectId/issues/create')
  async createIssue(
    @Param('projectId') projectId: string,
    @Body() dto: CreateIssueDto,
  ) {
    console.log(projectId, dto);
    await this.issuesService.createIssue(projectId, dto);
    return { success: 'Issue created successfully' };
  }

  @Get('/projects/:projectId/:issueId')
  getIssueById(
    @Param('issueId') issueId: string,
    @Param('projectId') projectId: string,
  ){
    return this.issuesService.findIssueById(issueId, projectId)
  }

  @Patch('/projects/:projectId/:issueId')
  updateIssueInfo(
    @Body() IssueInfoDto: UpdateIssueDto,
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
  ): Promise<Issue>{
    return this.issuesService.updateIssueInfo(IssueInfoDto, projectId, issueId);
  }

  @Post('/issues/:id/update-dates')
  async updateIssueDates(
    @Param('id') id: string,
    @Body() body: { startDate: string, dueDate: string, projectId: string }
  ) {
    return this.issuesService.updateIssueInfo(
      { 
        startDate: body.startDate ? new Date(body.startDate) : undefined, 
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined 
      },
      body.projectId,
      id
    );
  }
}
